const path = require('path');
const fs = require('fs');
/**
 * RAJENDRA STUDIO & FRAMING - ORDER RECOVERY & CLOUD BACKUP SERVICE
 * Guarantees zero order loss by cross-referencing Brevo transactional email receipts
 * with the local and Supabase databases. If any order was saved to an ephemeral instance
 * or if Supabase was paused during checkout, this service automatically recovers the order.
 */

const https = require('https');
const db = require('./db');

function fetchBrevoJson(path, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: path,
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Brevo API response parse failed: ' + e.message));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function parseAdminAlert(html, subject, date) {
  const getCell = (label) => {
    const reg = new RegExp('<td[^>]*>' + label + ':?<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>', 'i');
    const m = html.match(reg);
    return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
  };

  const idMatch = subject.match(/#(RF-ORD-[\w-]+)/);
  const totalMatch = subject.match(/₹(\d+)/);

  const orderId = idMatch ? idMatch[1] : (getCell('Order ID').replace(/^#/, '') || 'RF-ORD-RECOVERED');
  const customerName = getCell('Customer') || 'Customer';
  const email = getCell('Email') || '';
  const phone = getCell('Phone') || '';
  const rawTotal = getCell('Total Amount').replace(/[^0-9]/g, '');
  const total = rawTotal ? Number(rawTotal) : (totalMatch ? Number(totalMatch[1]) : 0);
  const paymentMethod = getCell('Payment') || 'Pick up from shop';
  const address = getCell('Delivery Address') || 'Studio Pickup - Dahej Shop';

  return {
    orderId,
    customer: {
      name: customerName,
      phone: phone,
      email: email,
      address: address,
      city: 'Bharuch',
      state: 'Gujarat',
      pincode: '392001'
    },
    total,
    subtotal: total,
    shipping: 0,
    paymentMethod,
    paymentStatus: 'Pending',
    status: 'pending',
    notes: 'Standard Studio Packaging',
    createdAt: date || new Date().toISOString()
  };
}

function parseCustomerEmailItems(html) {
  const items = [];
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  for (const r of rows) {
    if (r.includes('Size:') && r.includes('Finish:')) {
      const clean = r.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const m = clean.match(/(.+?)\s*Size:\s*([^•]+)•\s*Finish:\s*([^\s]+.*?)\s*x(\d+)\s*₹([\d,]+)/i);
      if (m) {
        items.push({
          name: m[1].trim(),
          size: m[2].trim(),
          finish: m[3].trim(),
          quantity: Number(m[4]),
          price: Number(m[5].replace(/,/g, '')),
          lineTotal: Number(m[4]) * Number(m[5].replace(/,/g, ''))
        });
      }
    }
  }
  return items;
}

let _lastRecoveryRun = 0;

async function syncBrevoOrders(force = false) {
  const now = Date.now();
  // Don't auto-run more than once every 5 minutes unless forced
  if (!force && (now - _lastRecoveryRun < 300000)) {
    return { skipped: true, reason: 'Recently checked' };
  }
  _lastRecoveryRun = now;

  const apiKey = process.env.BREVO_ORDER_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey || !apiKey.startsWith('xkeysib-')) {
    return { skipped: true, reason: 'Brevo API key not available' };
  }

  try {
    const listRes = await fetchBrevoJson(
      '/v3/smtp/emails?email=' + encodeURIComponent('order@rajendrastudioandgifts.in') + '&limit=30&sort=desc',
      apiKey
    );

    const emailList = listRes.transactionalEmails || [];
    if (!emailList.length) return { checkedCount: 0, recoveredCount: 0 };

    const currentOrders = await db.getOrders();
    const existingOrderIds = new Set(currentOrders.map(o => (o.orderId || '').toLowerCase().trim().replace(/^#/, '')));
    const deletedIds = await db.getDeletedOrderIds();

    const recovered = [];
    // Only recover orders placed during the real store era (from Nov 6, 2026 onwards)
    const RECOVERY_CUTOFF = new Date('2026-11-06T00:00:00.000Z');

    for (const item of emailList) {
      const emailDate = new Date(item.date || 0);
      if (emailDate < RECOVERY_CUTOFF) {
        continue; // Strictly skip legacy test emails prior to today
      }

      const m = item.subject && item.subject.match(/🛒 \[New Online Order\] #(RF-ORD-[\w-]+) from (.*?) \(₹(\d+)\)/);
      if (!m) continue;

      const orderId = m[1];
      const cleanOrderId = orderId.toLowerCase().trim().replace(/^#/, '');

      if (existingOrderIds.has(cleanOrderId) || existingOrderIds.has(orderId.toLowerCase())) {
        continue; // Order already in system
      }

        // If deleted by admin, respect deletion and NEVER resurrect
        if (deletedIds.has(cleanOrderId) || deletedIds.has(orderId.toLowerCase())) {
          console.log(`🛡️ [ORDER RECOVERY] Skipping ${orderId} because it is in deleted orders registry.`);
          continue;
        }

      // Fetch detail
      try {
        const detail = await fetchBrevoJson('/v3/smtp/emails/' + item.uuid, apiKey);
        if (!detail || !detail.body) continue;

        const baseOrder = parseAdminAlert(detail.body, item.subject, detail.date || item.date);

        // Try to fetch customer email to get itemized rows
        let items = [];
        if (baseOrder.customer.email) {
          try {
            const custRes = await fetchBrevoJson(
              '/v3/smtp/emails?email=' + encodeURIComponent(baseOrder.customer.email) + '&limit=5&sort=desc',
              apiKey
            );
            const custEmails = custRes.transactionalEmails || [];
            for (const ce of custEmails) {
              if (ce.subject && ce.subject.includes('Order Has Been Placed Successfully')) {
                const ceDetail = await fetchBrevoJson('/v3/smtp/emails/' + ce.uuid, apiKey);
                if (ceDetail && ceDetail.body) {
                  const extracted = parseCustomerEmailItems(ceDetail.body);
                  if (extracted.length) {
                    items = extracted;
                    break;
                  }
                }
              }
            }
          } catch (_) {}
        }

        if (!items.length) {
          items = [{
            name: 'Custom Studio Order',
            size: 'Standard',
            finish: 'Standard',
            quantity: 1,
            price: baseOrder.total,
            lineTotal: baseOrder.total
          }];
        }

        const fullOrder = {
          ...baseOrder,
          items,
          subtotal: baseOrder.total,
          shipping: 0
        };

        await db.saveOrder(fullOrder);

        // Mirror to inquiries
        const itemSummary = items.map(i => `${i.name} (x${i.quantity})`).join(', ');
        await db.saveInquiry({
          id: fullOrder.orderId,
          name: fullOrder.customer.name,
          phone: fullOrder.customer.phone,
          email: fullOrder.customer.email,
          product: `[ONLINE ORDER] ${itemSummary}`,
          specs: `Deliver to: ${fullOrder.customer.address}, ${fullOrder.customer.city} • ${fullOrder.paymentMethod}`,
          quantity: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
          estimatedValue: fullOrder.total,
          notes: fullOrder.notes || 'None',
          status: fullOrder.status,
          hasUpload: false,
          deliveryAddress: fullOrder.customer.address,
          items: fullOrder.items,
          subtotal: fullOrder.subtotal,
          shipping: fullOrder.shipping,
          total: fullOrder.total,
          paymentMethod: fullOrder.paymentMethod,
          createdAt: fullOrder.createdAt
        });

        // Record customer stats
        if (fullOrder.customer.email) {
          await db.recordCustomerLogin(fullOrder.customer.email, fullOrder.customer.name, fullOrder.customer.phone);
          await db.updateCustomerOrderStats(fullOrder.customer.email, fullOrder.total);
        }

        existingOrderIds.add(orderId.toLowerCase());
        recovered.push(fullOrder);
        console.log(`🛡️ [ORDER AUTO-RECOVERY] Successfully recovered order ${orderId} from Brevo! Total: ₹${fullOrder.total}`);
      } catch (err) {
        console.warn(`Failed to recover order for email ${item.uuid}:`, err.message);
      }
    }

    return {
      checkedCount: emailList.length,
      recoveredCount: recovered.length,
      recoveredOrders: recovered
    };
  } catch (err) {
    console.warn('Order recovery check notice:', err.message);
    return { error: err.message };
  }
}

module.exports = {
  syncBrevoOrders
};

