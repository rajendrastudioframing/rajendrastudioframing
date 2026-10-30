/**
 * RAJENDRA STUDIO & FRAMING - UNIFIED BREVO EMAIL SERVICE
 * Handles transactional emails via Brevo API:
 * 1. Customer Login Alert (sent to shop@rajendrastudioandgifts.in + customer)
 * 2. Admin Login Alert (sent to shop@rajendrastudioandgifts.in)
 * 3. Customer OTP Verification Code (sent to customer)
 * 4. Admin OTP Verification Code (sent to admin)
 * 5. Order "Ready for Pick Up at Shop" (sent to customer + shop@rajendrastudioandgifts.in)
 * 6. New Order Placed Alert (sent to customer + shop@rajendrastudioandgifts.in)
 */

const https = require('https');

// Brevo API Configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'shop@rajendrastudioandgifts.in';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Rajendra Studio & Gifts';
const SHOP_ALERT_EMAIL = process.env.SHOP_NOTIFICATION_EMAIL || 'shop@rajendrastudioandgifts.in';

// Brevo Channel 2: Order Confirmations & Admin Order Acceptance
const BREVO_ORDER_API_KEY = process.env.BREVO_ORDER_API_KEY || '';
const ORDER_SENDER_EMAIL = process.env.BREVO_ORDER_EMAIL || 'order@rajendrastudioandgifts.in';
const ORDER_SENDER_NAME = process.env.BREVO_ORDER_NAME || 'Rajendra Studio Orders';
const ORDER_ALERT_EMAIL = process.env.ORDER_NOTIFICATION_EMAIL || 'order@rajendrastudioandgifts.in';

const STUDIO_INFO = {
  name: 'Rajendra Studio & Framing',
  tagline: 'Custom Framing & Gifts Studio • Dahej Support',
  address: 'Rajesh Framing Studio, Dahej GIDC, Near Main Road, Bharuch, Gujarat 392130',
  phone: process.env.STUDIO_PHONE || '+91 95107 57513',
  whatsapp: process.env.STUDIO_WHATSAPP ? `https://wa.me/${process.env.STUDIO_WHATSAPP}` : 'https://wa.me/919510757513',
  email: 'shop@rajendrastudioandgifts.in',
  hours: '9:30 AM – 9:00 PM (Monday to Sunday)'
};

/**
 * Core Brevo API Dispatcher
 */
function dispatchBrevoSingle({ to, subject, htmlContent, textContent, bcc = null, replyTo = null, sender = null, apiKey = null }) {
  return new Promise((resolve) => {
    try {
      const recipients = Array.isArray(to) ? to : [{ email: to }];
      const validRecipients = recipients
        .map(r => (typeof r === 'string' ? { email: r } : r))
        .map(r => (r && r.email ? { ...r, email: r.email.trim().toLowerCase() } : null))
        .filter(r => r && r.email && r.email.includes('@'));

      if (validRecipients.length === 0) {
        return resolve({ success: false, reason: 'No valid recipient email address' });
      }

      const activeSender = sender || { name: SENDER_NAME, email: SENDER_EMAIL };
      const cleanSender = {
        name: (activeSender.name || SENDER_NAME).trim(),
        email: (activeSender.email || SENDER_EMAIL).trim().toLowerCase()
      };

      const payload = {
        sender: cleanSender,
        to: validRecipients,
        subject: subject,
        htmlContent: htmlContent || `<p>${textContent || ''}</p>`,
        textContent: textContent || ''
      };

      if (bcc) {
        const bccList = (Array.isArray(bcc) ? bcc : [{ email: bcc }])
          .map(b => (typeof b === 'string' ? { email: b } : b))
          .map(b => (b && b.email ? { ...b, email: b.email.trim().toLowerCase() } : null))
          .filter(b => b && b.email && b.email.includes('@'));
        if (bccList.length > 0) {
          payload.bcc = bccList;
        }
      }

      const defaultReplyTo = SENDER_EMAIL;
      const cleanReply = typeof replyTo === 'string' ? replyTo.trim().toLowerCase() : ((replyTo && replyTo.email) ? replyTo.email.trim().toLowerCase() : defaultReplyTo);
      if (cleanReply && cleanReply.includes('@')) {
        payload.replyTo = { email: cleanReply };
      }

      const postData = JSON.stringify(payload);

      const req = https.request({
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey || BREVO_API_KEY,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(postData)
        },
        timeout: 9000
      }, (res) => {
        let responseBody = '';
        res.on('data', chunk => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let parsed = {};
            try { parsed = JSON.parse(responseBody); } catch (_) {}
            console.log(`✅ [Brevo Email Delivered] "${subject}" -> ${validRecipients.map(r => r.email).join(', ')} (MsgID: ${parsed.messageId || 'ok'})`);
            resolve({ success: true, messageId: parsed.messageId });
          } else {
            console.warn(`⚠️ [Brevo Email API Warning] Status ${res.statusCode}:`, responseBody);
            resolve({ success: false, statusCode: res.statusCode, error: responseBody });
          }
        });
      });

      req.on('error', (err) => {
        console.error('❌ [Brevo Email Network Error]:', err.message);
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('⚠️ [Brevo Email Timeout] Request timed out after 9s');
        resolve({ success: false, error: 'Request timeout' });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.error('❌ [dispatchBrevoSingle Exception]:', err.message);
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Robust Dual-Channel Brevo Dispatcher with automatic failover
 */
async function sendBrevoEmail(options) {
  const primaryResult = await dispatchBrevoSingle(options);
  if (primaryResult.success) {
    return primaryResult;
  }

  // Automatic Failover: Try Brevo Secondary Order API Key if primary fails
  if (BREVO_ORDER_API_KEY && options.apiKey !== BREVO_ORDER_API_KEY) {
    console.log('🔄 [Brevo Failover] Retrying email via secondary Brevo channel (order@rajendrastudioandgifts.in)...');
    const secondaryOptions = {
      ...options,
      apiKey: BREVO_ORDER_API_KEY,
      sender: { name: ORDER_SENDER_NAME, email: ORDER_SENDER_EMAIL }
    };
    const secondaryResult = await dispatchBrevoSingle(secondaryOptions);
    if (secondaryResult.success) {
      return secondaryResult;
    }
  }

  return primaryResult;
}

/**
 * 1. CUSTOMER LOGIN NOTIFICATION
 * Notifies both shop@rajendrastudioandgifts.in and the customer
 */
async function notifyCustomerLogin({ customerEmail, customerName = '', customerPhone = '', req = null }) {
  if (!customerEmail || !customerEmail.includes('@')) return;

  const cleanEmail = customerEmail.trim().toLowerCase();
  const cleanName = (customerName && customerName.trim()) || cleanEmail.split('@')[0];
  const cleanPhone = (customerPhone && customerPhone.trim()) || 'Not Provided';

  const timeIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  }) + ' (IST)';

  const ipAddress = (req && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || 'Local / Network';
  let userAgent = (req && req.headers['user-agent']) || 'Web Browser';
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    userAgent = 'Mobile Device';
  } else if (userAgent.includes('Windows')) {
    userAgent = 'Windows PC';
  } else if (userAgent.includes('Mac')) {
    userAgent = 'Apple Mac';
  }

  // A) Shop Alert to shop@rajendrastudioandgifts.in
  const shopAlertSubject = `👤 [Customer Login] ${cleanName} (${cleanEmail}) Logged In`;
  const shopAlertHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 22px 28px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 19px; letter-spacing: 1px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Customer Activity Alert</div>
        </div>
        <div style="padding: 28px;">
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 10px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; margin-bottom: 18px;">
            👤 CUSTOMER SIGNED IN
          </div>
          <h3 style="margin: 0 0 12px; font-size: 18px; color: #111;">Customer Just Logged In to the Website</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5; margin-bottom: 20px;">
            A customer has successfully authenticated on Rajendra Studio &amp; Framing online portal.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border-radius: 8px; border: 1px solid #EFEAE0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Customer Name:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${cleanName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email Address:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;"><a href="mailto:${cleanEmail}" style="color: #8C6A1E; text-decoration: none;">${cleanEmail}</a></td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Mobile Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;"><a href="tel:${cleanPhone}" style="color: #111; text-decoration: none;">${cleanPhone}</a></td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Login Time:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${timeIST}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Device / Browser:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${userAgent}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">IP Address:</td><td style="padding: 10px 14px; color: #111;">${ipAddress}</td></tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://rajendrastudioandgifts.in/admin#customers" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 700;">View in Admin Panel &rarr;</a>
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 14px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}
        </div>
      </div>
    </body>
    </html>
  `;

  // B) Welcome / Security Email to Customer
  const customerSubject = `🔐 Successful Login to Rajendra Studio & Framing Account`;
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 24px 28px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 20px; letter-spacing: 1px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Custom Framing Studio • Dahej Support</div>
        </div>
        <div style="padding: 28px;">
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 16px;">
            ✓ SIGNED IN SUCCESSFULLY
          </div>
          <h3 style="margin: 0 0 10px; font-size: 18px; color: #111;">Hello ${cleanName},</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 20px;">
            You have successfully signed in to your <strong>Rajendra Studio &amp; Framing</strong> account (<code>${cleanEmail}</code>) at <strong>${timeIST}</strong>.
          </p>
          <div style="background: #FAF9F6; border: 1px solid #EAE5DB; border-radius: 10px; padding: 16px; margin-bottom: 22px;">
            <div style="font-size: 13px; color: #666; margin-bottom: 6px;"><strong>Device:</strong> ${userAgent}</div>
            <div style="font-size: 13px; color: #666;"><strong>Security Notice:</strong> If you did not perform this login, please contact us immediately on WhatsApp or Phone: <a href="tel:+919510757513" style="color: #8C6A1E; font-weight: 700;">+91 95107 57513</a>.</div>
          </div>
          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="https://rajendrastudioandgifts.in/products" style="display: inline-block; background: #C99A3D; color: #111; font-weight: 800; text-decoration: none; padding: 12px 26px; border-radius: 8px; font-size: 14px;">Browse Premium Framing Collection &rarr;</a>
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 16px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}<br>
          Helpline: ${STUDIO_INFO.phone} • Email: ${STUDIO_INFO.email}
        </div>
      </div>
    </body>
    </html>
  `;

  // Send both in parallel
  await Promise.allSettled([
    sendBrevoEmail({
      to: SHOP_ALERT_EMAIL,
      subject: shopAlertSubject,
      htmlContent: shopAlertHtml,
      textContent: `Customer Login Alert:\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nPhone: ${cleanPhone}\nTime: ${timeIST}\nDevice: ${userAgent}\nIP: ${ipAddress}`
    }),
    sendBrevoEmail({
      to: cleanEmail,
      subject: customerSubject,
      htmlContent: customerHtml,
      textContent: `Hello ${cleanName},\n\nYou have successfully logged in to Rajendra Studio & Framing on ${timeIST}.\n\nIf this was not you, please contact us at ${STUDIO_INFO.phone}.`
    })
  ]);
}

/**
 * 2. ADMIN LOGIN NOTIFICATION
 * Notifies shop@rajendrastudioandgifts.in whenever an admin logs in
 */
async function notifyAdminLogin({ adminEmail, loginType = 'Direct Password', req = null }) {
  const cleanEmail = (adminEmail || 'admin').trim().toLowerCase();
  const timeIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  }) + ' (IST)';

  const ipAddress = (req && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || 'Local / Network';
  let userAgent = (req && req.headers['user-agent']) || 'Web Browser';
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    userAgent = 'Mobile Device';
  } else if (userAgent.includes('Windows')) {
    userAgent = 'Windows PC';
  } else if (userAgent.includes('Mac')) {
    userAgent = 'Apple Mac';
  }

  const subject = `🔐 [Admin Login Alert] ${cleanEmail} Logged into Admin Panel`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 22px 28px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 19px; letter-spacing: 1px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Security Alert &bull; Admin Access</div>
        </div>
        <div style="padding: 28px;">
          <div style="background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 18px;">
            🔐 ADMIN DASHBOARD LOGIN DETECTED
          </div>
          <h3 style="margin: 0 0 10px; font-size: 18px; color: #111;">Admin Panel Access Granted</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5; margin-bottom: 20px;">
            An administrator has successfully signed in to manage orders, products, customers, and leads.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border-radius: 8px; border: 1px solid #EFEAE0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Admin Email:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${cleanEmail}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Auth Method:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${loginType}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Login Time:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${timeIST}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Device:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${userAgent}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">IP Address:</td><td style="padding: 10px 14px; color: #111;">${ipAddress}</td></tr>
          </table>
          <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-top: 20px; border-radius: 4px; font-size: 12px; color: #92400E;">
            <strong>Security Notice:</strong> If this login was not made by you or an authorized team member, please change the Admin password immediately.
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 14px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendBrevoEmail({
    to: SHOP_ALERT_EMAIL,
    subject: subject,
    htmlContent: htmlContent,
    textContent: `Admin Login Alert:\n\nAdmin: ${cleanEmail}\nMethod: ${loginType}\nTime: ${timeIST}\nDevice: ${userAgent}\nIP: ${ipAddress}`
  });
}

/**
 * 3. ORDER "READY FOR PICK UP AT SHOP" NOTIFICATION
 * Sent to Customer + Copy to shop@rajendrastudioandgifts.in
 */
/**
 * Format date nicely for display in customer emails
 */
function formatDateDisplay(dateVal) {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    const dObj = new Date(Date.UTC(y, m - 1, d));
    return dObj.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
  }
  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  }
  return str;
}

/**
 * 3. ORDER READY FOR PICKUP NOTIFICATION
 * Sent when admin marks order as ready for pickup (ready_for_pickup)
 */
async function notifyOrderPickupReady({ order, pickupDate = null, notes = '', req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');

  let customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  let rawEmail = (order.customer && order.customer.email) || order.email || '';
  let customerEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();
  let customerPhone = (order.customer && order.customer.phone) || order.phone || '';

  const protocol = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https';
  const host = (req && req.get('host')) || 'rajendrastudioandgifts.in';
  const trackingUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(cleanId)}`;

  const rawPickupDate = pickupDate || (order && (order.pickupDate || order.pickup_date || order.confirmationDate || order.confirmation_date)) || null;
  const formattedPickupDate = formatDateDisplay(rawPickupDate) || 'Available at Studio';

  let items = [];
  if (order.items && Array.isArray(order.items)) {
    items = order.items;
  } else if (order.product) {
    items = [{
      name: order.product.replace('[ONLINE ORDER]', '').trim(),
      quantity: order.quantity || 1,
      price: order.estimatedValue || 0
    }];
  }

  const total = Number(order.total || order.estimatedValue || 0);
  const paymentMethod = order.paymentMethod || 'Pick up from shop';

  const timeIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  }) + ' IST';

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #EFEAE0; font-size: 14px; color: #111;">
        <strong>${item.name || 'Custom Photo Frame'}</strong>
        ${item.size ? `<br><span style="font-size: 12px; color: #777;">Size: ${item.size}</span>` : ''}
        ${item.finish ? `<br><span style="font-size: 12px; color: #777;">Finish: ${item.finish}</span>` : ''}
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #EFEAE0; font-size: 14px; text-align: center; color: #444;">x${item.quantity || 1}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #EFEAE0; font-size: 14px; text-align: right; font-weight: 700; color: #111;">₹${item.price || (total / (item.quantity || 1))}</td>
    </tr>
  `).join('');

  // A) Customer Pick Up Ready Email
  const customerSubject = 'Your Order Is Ready for Pickup!';
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>Your Order Is Ready for Pickup!</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: #111; padding: 28px; text-align: center; border-bottom: 3px solid #C99A3D;">
          <h2 style="color: #fff; margin:0; font-size: 21px; letter-spacing: 2px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">
            Premium Framing Studio &bull; Dahej Support
          </div>
        </div>

        <!-- Banner -->
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #BFDBFE;">
          <div style="display: inline-block; background: #2563EB; color: #FFFFFF; font-weight: 800; font-size: 11px; letter-spacing: 1.2px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            🛍️ READY FOR PICKUP
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #1E3A8A;">
            Your Order Is Ready for Pickup!
          </h1>
          <p style="margin: 0; font-size: 14px; color: #1D4ED8;">
            Order ID: <strong style="color: #1E40AF; font-size: 16px;">#${cleanId}</strong>
          </p>
        </div>

        <div style="padding: 26px 30px;">
          <!-- Official Message Box -->
          <div style="background-color: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: 12px; padding: 20px 22px; margin-bottom: 22px; color: #1E40AF; font-size: 15px; line-height: 1.6;">
            <p style="margin: 0 0 10px; font-size: 15px; color: #111827;">Hello <strong>${customerName}</strong>,</p>
            <p style="margin: 0 0 10px; font-size: 15px; color: #1D4ED8; font-weight: 600;">Your order <strong>#${cleanId}</strong> is now ready for pickup!</p>
            <p style="margin: 0 0 10px; font-size: 14px; color: #111827;"><strong>Scheduled Pickup Date:</strong> <span style="color: #1D4ED8; font-weight: 700; font-size: 15px;">${formattedPickupDate}</span></p>
            <p style="margin: 0 0 10px; font-size: 14px; color: #1E40AF;">Please visit us to collect your order.</p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #4B5563;">Thank you for shopping with us!</p>
          </div>

          ${notes ? `
          <div style="background: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #166534;">
            <strong>Studio Note:</strong> ${notes}
          </div>
          ` : ''}

          <!-- Pickup Location Box -->
          <div style="background: #FAF8F5; border: 2px dashed #C99A3D; border-radius: 12px; padding: 22px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #111; display: flex; align-items: center;">
              📍 Studio Pick Up Address &amp; Contact:
            </h3>
            <div style="font-size: 14px; color: #222; font-weight: 700; margin-bottom: 4px;">
              ${STUDIO_INFO.address}
            </div>
            <div style="font-size: 13px; color: #666; margin-top: 10px; line-height: 1.6;">
              <strong>🕒 Shop Timings:</strong> ${STUDIO_INFO.hours}<br>
              <strong>📞 Direct Helpline:</strong> <a href="tel:+919510757513" style="color: #8C6A1E; font-weight: 700; text-decoration: none;">+91 95107 57513</a><br>
              <strong>💬 WhatsApp:</strong> <a href="${STUDIO_INFO.whatsapp}" style="color: #16A34A; font-weight: 700; text-decoration: none;">Chat on WhatsApp (+91 95107 57513)</a>
            </div>
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #EBE6DC; font-size: 12px; color: #777;">
              💡 <em>Please show this email or share your Order ID (<strong>#${cleanId}</strong>) at our shop counter during collection.</em>
            </div>
          </div>

          <!-- Items Summary Table -->
          <h4 style="margin: 22px 0 10px; font-size: 15px; color: #111; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; background: #FAF9F6; border-radius: 8px; border: 1px solid #EFEAE0;">
            <thead>
              <tr style="background: #F1ECE1;">
                <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Item</th>
                <th style="padding: 10px 14px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase;">Qty</th>
                <th style="padding: 10px 14px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding: 12px 14px; font-weight: 800; font-size: 15px; color: #111; text-align: right;">Total Order Amount:</td>
                <td style="padding: 12px 14px; font-weight: 800; font-size: 17px; color: #8C6A1E; text-align: right;">₹${total}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 8px 14px; font-size: 13px; color: #666; text-align: right;">Payment Mode:</td>
                <td style="padding: 8px 14px; font-size: 13px; font-weight: 600; color: #111; text-align: right;">${paymentMethod}</td>
              </tr>
            </tbody>
          </table>

          <!-- Action Button -->
          <div style="text-align: center; margin: 28px 0 14px;">
            <a href="${trackingUrl}" style="display: inline-block; background: #111; color: #C99A3D; font-weight: 800; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-size: 15px; border: 1px solid #C99A3D;">
              Track Order Status Online &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #FAF8F5; padding: 20px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} &bull; ${STUDIO_INFO.address}<br>
          For queries: ${STUDIO_INFO.phone} &bull; ${STUDIO_INFO.email}
        </div>
      </div>
    </body>
    </html>
  `;

  // B) Shop Alert to shop@rajendrastudioandgifts.in
  const shopSubject = `🛍️ [Ready For Pickup Alert] Order #${cleanId} Ready for Collection - ${customerName}`;
  const shopHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 20px 24px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 18px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px;">Order Ready For Pickup Notification</div>
        </div>
        <div style="padding: 24px;">
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 14px;">
            🛍️ ORDER MARKED READY FOR PICKUP
          </div>
          <h3 style="margin: 0 0 10px; font-size: 18px;">Order #${cleanId} Ready for Collection</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5;">
            An order was marked ready for pickup. Scheduled Pickup Date: <strong>${formattedPickupDate}</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border-radius: 8px; border: 1px solid #EFEAE0; margin: 16px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 140px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Pickup Date:</td><td style="padding: 10px 14px; font-weight: 700; color: #1D4ED8; border-bottom: 1px solid #EFEAE0;">${formattedPickupDate}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Total Amount:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">₹${total} (${paymentMethod})</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">Status Update Time:</td><td style="padding: 10px 14px; color: #111;">${timeIST}</td></tr>
          </table>
          ${notes ? `<div style="font-size: 13px; color: #555; background: #FFFBEB; padding: 10px 14px; border-radius: 6px; border: 1px solid #FDE68A; margin-bottom: 18px;"><strong>Note:</strong> ${notes}</div>` : ''}
          <div style="text-align: center;">
            <a href="https://rajendrastudioandgifts.in/admin#orders" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 700;">Manage in Admin Panel &rarr;</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text fallback (Strict user specification)
  const plainText = `Hello ${customerName},

Your order #${cleanId} is now ready for pickup!

Scheduled Pickup Date: ${formattedPickupDate}

Please visit us to collect your order.

Thank you for shopping with us!`;

  let customerEmailResult = { success: false, reason: 'No customer email' };
  let shopEmailResult = { success: false };

  const shopPromise = sendOrderBrevoEmail({
    to: SHOP_ALERT_EMAIL,
    subject: shopSubject,
    htmlContent: shopHtml,
    textContent: `Order #${cleanId} is ready for pickup at shop. Scheduled date: ${formattedPickupDate}. Customer: ${customerName} (${customerPhone}). Total: ₹${total}`
  }).then(res => {
    shopEmailResult = res;
    return res;
  }).catch(err => {
    shopEmailResult = { success: false, error: err.message };
    return shopEmailResult;
  });

  let customerPromise = Promise.resolve(customerEmailResult);
  if (customerEmail && customerEmail.includes('@')) {
    customerPromise = sendOrderBrevoEmail({
      to: customerEmail,
      subject: customerSubject,
      htmlContent: customerHtml,
      textContent: plainText
    }).then(res => {
      customerEmailResult = res;
      if (res && res.success) {
        console.log(`✅ [ORDER READY FOR PICKUP EMAIL DELIVERED] #${cleanId} -> ${customerEmail}`);
      } else {
        console.warn(`⚠️ [ORDER READY FOR PICKUP EMAIL FAILED] #${cleanId} -> ${customerEmail}:`, res ? (res.error || res.statusCode) : 'Unknown');
      }
      return res;
    }).catch(err => {
      customerEmailResult = { success: false, error: err.message };
      console.error(`❌ [ORDER READY FOR PICKUP EMAIL ERROR] #${cleanId} -> ${customerEmail}:`, err.message);
      return customerEmailResult;
    });
  }

  await Promise.allSettled([shopPromise, customerPromise]);
  const isCustomerSent = Boolean(customerEmailResult && customerEmailResult.success);

  return {
    success: isCustomerSent,
    sent: isCustomerSent,
    recipient: customerEmail,
    customerResult: customerEmailResult,
    shopResult: shopEmailResult
  };
}

/**
 * 4. ORDER CANCELLED NOTIFICATION
 * Sent when admin cancels an order (cancelled)
 */
async function notifyOrderCancelledByAdmin({ order, notes = '', req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');

  let customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  let rawEmail = (order.customer && order.customer.email) || order.email || '';
  let customerEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();
  let customerPhone = (order.customer && order.customer.phone) || order.phone || '';

  const total = Number(order.total || order.estimatedValue || 0);

  const customerSubject = 'Your Order Has Been Cancelled';
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="utf-8"><title>Your Order Has Been Cancelled</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: #111; padding: 28px; text-align: center; border-bottom: 3px solid #DC2626;">
          <h2 style="color: #fff; margin:0; font-size: 21px; letter-spacing: 2px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">
            Order Desk &bull; Dahej Support
          </div>
        </div>

        <!-- Banner -->
        <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #FECACA;">
          <div style="display: inline-block; background: #DC2626; color: #FFFFFF; font-weight: 800; font-size: 11px; letter-spacing: 1.2px; padding: 6px 16px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            ✕ ORDER CANCELLED
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #991B1B;">
            Your Order Has Been Cancelled
          </h1>
          <p style="margin: 0; font-size: 14px; color: #B91C1C;">
            Order ID: <strong style="color: #991B1B; font-size: 16px;">#${cleanId}</strong>
          </p>
        </div>

        <div style="padding: 26px 30px;">
          <!-- Official Message Box (Strict requirements text) -->
          <div style="background-color: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 12px; padding: 20px 22px; margin-bottom: 22px; color: #991B1B; font-size: 15px; line-height: 1.6;">
            <p style="margin: 0 0 10px; font-size: 15px; color: #111827;">Hello <strong>${customerName}</strong>,</p>
            <p style="margin: 0 0 10px; font-size: 15px; color: #DC2626; font-weight: 600;">Your order <strong>#${cleanId}</strong> has been cancelled by our team.</p>
            <p style="margin: 0 0 10px; font-size: 14px; color: #4B5563;">If you have any questions, please contact us.</p>
            <p style="margin: 10px 0 0; font-size: 14px; color: #4B5563;">Thank you.</p>
          </div>

          ${notes ? `
          <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px 18px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #92400E;">
            <strong>Studio Note:</strong> ${notes}
          </div>
          ` : ''}

          <!-- Support Contact -->
          <div style="margin-top: 24px; text-align: center;">
            <a href="${STUDIO_INFO.whatsapp}?text=${encodeURIComponent('Hello Rajendra Studio, I have a question regarding my cancelled order #' + cleanId)}." target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 999px; margin: 4px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);">
              💬 WhatsApp Support
            </a>
            <a href="tel:${STUDIO_INFO.phone.replace(/[^0-9+]/g, '')}" style="display: inline-block; background-color: #111827; color: #FFFFFF; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 999px; margin: 4px;">
              📞 Call Helpline: ${STUDIO_INFO.phone}
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #FAF8F5; padding: 20px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} &bull; ${STUDIO_INFO.address}<br>
          For queries: ${STUDIO_INFO.phone} &bull; ${STUDIO_INFO.email}
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `Hello ${customerName},

Your order #${cleanId} has been cancelled by our team.

If you have any questions, please contact us.

Thank you.`;

  let customerEmailResult = { success: false, reason: 'No customer email' };
  let shopEmailResult = { success: false };

  const shopPromise = sendOrderBrevoEmail({
    to: SHOP_ALERT_EMAIL,
    subject: `✕ [Order Cancelled] Order #${cleanId} - ${customerName}`,
    htmlContent: customerHtml,
    textContent: `Order #${cleanId} has been cancelled. Customer: ${customerName} (${customerPhone}). Total: ₹${total}`
  }).then(res => {
    shopEmailResult = res;
    return res;
  }).catch(err => {
    shopEmailResult = { success: false, error: err.message };
    return shopEmailResult;
  });

  let customerPromise = Promise.resolve(customerEmailResult);
  if (customerEmail && customerEmail.includes('@')) {
    customerPromise = sendOrderBrevoEmail({
      to: customerEmail,
      subject: customerSubject,
      htmlContent: customerHtml,
      textContent: plainText
    }).then(res => {
      customerEmailResult = res;
      if (res && res.success) {
        console.log(`✅ [ORDER CANCELLED EMAIL DELIVERED] #${cleanId} -> ${customerEmail}`);
      } else {
        console.warn(`⚠️ [ORDER CANCELLED EMAIL FAILED] #${cleanId} -> ${customerEmail}:`, res ? (res.error || res.statusCode) : 'Unknown');
      }
      return res;
    }).catch(err => {
      customerEmailResult = { success: false, error: err.message };
      console.error(`❌ [ORDER CANCELLED EMAIL ERROR] #${cleanId} -> ${customerEmail}:`, err.message);
      return customerEmailResult;
    });
  }

  await Promise.allSettled([shopPromise, customerPromise]);
  const isCustomerSent = Boolean(customerEmailResult && customerEmailResult.success);

  return {
    success: isCustomerSent,
    sent: isCustomerSent,
    recipient: customerEmail,
    customerResult: customerEmailResult,
    shopResult: shopEmailResult
  };
}

/**
 * 4. CUSTOMER OTP EMAIL
 */
async function sendCustomerOtpEmail({ email, otp, name = '' }) {
  if (!email || !email.includes('@')) return { success: false, reason: 'Invalid email' };

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name && name.trim()) || 'Valued Customer';
  const subject = `Your Rajendra Studio Verification Code: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 540px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 24px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 20px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Customer Sign In</div>
        </div>
        <div style="padding: 28px; text-align: center;">
          <h3 style="margin: 0 0 10px; font-size: 18px; color: #111;">Hello ${cleanName},</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5; margin-bottom: 20px;">
            Here is your One-Time Passcode (OTP) to securely sign in to your Rajendra Studio customer account for <strong>${cleanEmail}</strong>:
          </p>
          <div style="background: #FAF7F2; border: 2px dashed #C99A3D; border-radius: 12px; padding: 18px; margin: 16px auto; display: inline-block; min-width: 220px;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #111; font-family: monospace;">${otp}</div>
            <div style="font-size: 12px; color: #888; margin-top: 6px;">Valid for <strong>5 minutes</strong> • Single use</div>
          </div>
          <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 14px; text-align: left; font-size: 12px; color: #92400E; margin-top: 24px; border-radius: 4px;">
            <strong>Security Notice:</strong> Please do not share this passcode with anyone. Rajendra Studio team members will never ask for your code.
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 14px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}<br>
          Helpline: ${STUDIO_INFO.phone}
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendBrevoEmail({
    to: cleanEmail,
    subject: subject,
    htmlContent: html,
    textContent: `Your Rajendra Studio login passcode is: ${otp}\nValid for 5 minutes.`
  });
}

/**
 * 5. ADMIN OTP EMAIL
 */
async function sendAdminOtpEmail({ email, otp }) {
  if (!email || !email.includes('@')) return { success: false, reason: 'Invalid email' };

  const cleanEmail = email.trim().toLowerCase();
  const subject = `Your Rajendra Studio Admin Passcode: ${otp}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 540px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="background: #111; padding: 24px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 20px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO ADMIN</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px; text-transform: uppercase;">Admin Verification</div>
        </div>
        <div style="padding: 28px; text-align: center;">
          <h3 style="margin: 0 0 10px; font-size: 18px; color: #111;">Admin Verification Passcode</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5; margin-bottom: 20px;">
            Your Admin Dashboard login passcode for <strong>${cleanEmail}</strong> is:
          </p>
          <div style="background: #FAF7F2; border: 2px dashed #C99A3D; border-radius: 12px; padding: 18px; margin: 16px auto; display: inline-block; min-width: 220px;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #111; font-family: monospace;">${otp}</div>
            <div style="font-size: 12px; color: #888; margin-top: 6px;">Valid for <strong>5 minutes</strong></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendBrevoEmail({
    to: cleanEmail,
    subject: subject,
    htmlContent: html,
    textContent: `Your Rajendra Studio Admin passcode is: ${otp}\nValid for 5 minutes.`
  });
}

/**
 * 6. NEW ORDER PLACED NOTIFICATION
 */
async function notifyNewOrderPlaced({ order, req = null }) {
  return await notifyOrderConfirmation({ order, req });
}


/**
 * Dedicated Brevo Order Channel Dispatcher
 * Dispatches strictly from order@rajendrastudioandgifts.in using Order API Key
 */
async function sendOrderBrevoEmail({ to, subject, htmlContent, textContent, bcc = null, replyTo = null, sender = null }) {
  const orderKey = BREVO_ORDER_API_KEY || BREVO_API_KEY;
  const orderSender = sender || { name: ORDER_SENDER_NAME, email: ORDER_SENDER_EMAIL };

  // Attempt Channel 2 (Dedicated Order Channel)
  const result = await sendBrevoEmail({
    to,
    subject,
    htmlContent,
    textContent,
    bcc,
    replyTo: replyTo || ORDER_SENDER_EMAIL,
    sender: orderSender,
    apiKey: orderKey
  });

  if (result && result.success) {
    return result;
  }

  // Automatic Fallback to Channel 1 (Shop Channel) if Channel 2 fails
  if (BREVO_API_KEY && (orderKey !== BREVO_API_KEY || (orderSender && orderSender.email !== SENDER_EMAIL))) {
    console.warn(`⚠️ [sendOrderBrevoEmail Fallback] Channel 2 failed (${result.error || result.statusCode || 'unknown'}). Retrying via Channel 1 (${SENDER_EMAIL})...`);
    return await sendBrevoEmail({
      to,
      subject,
      htmlContent,
      textContent,
      bcc,
      replyTo: SENDER_EMAIL,
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      apiKey: BREVO_API_KEY
    });
  }

  return result;
}


/**
 * 7. ORDER PLACEMENT NOTIFICATION (via order@rajendrastudioandgifts.in)
 * Dispatched when a customer places an order
 */
async function notifyOrderConfirmation({ order, req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');
  const customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  const rawEmail = (order.customer && order.customer.email) || order.email || order.customerEmail || '';
  const customerEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();
  const customerPhone = (order.customer && order.customer.phone) || order.phone || '';
  const total = Number(order.total || order.estimatedValue || 0);
  const subtotal = Number(order.subtotal || total);
  const paymentMethod = order.paymentMethod || 'Pick up from shop';
  const upiUtr = order.upiUtr || null;

  const deliveryAddress = (order.customer && order.customer.address 
    ? `${order.customer.address}${order.customer.city ? ', ' + order.customer.city : ''}${order.customer.pincode ? ' (' + order.customer.pincode + ')' : ''}` 
    : (order.deliveryAddress || order.address || 'Studio Counter Pickup, Dahej'));

  // Uploaded photo detection (if customer provided custom framing image)
  const uploadedPhoto = (order.orderPhoto && order.orderPhoto.fileUrl)
    || order.customerPhotoUrl
    || order.uploadedFileUrl
    || (order.items && order.items.find(i => i.uploadedPhoto && i.uploadedPhoto.fileUrl)?.uploadedPhoto?.fileUrl)
    || null;
  const photoName = (order.orderPhoto && order.orderPhoto.fileName)
    || order.customerPhotoName
    || order.uploadFileName
    || 'Custom Framing Photo';

  const protocol = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https';
  const host = (req && req.get('host')) || 'rajendrastudioandgifts.in';
  const trackingUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(cleanId)}`;

  const timeIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  }) + ' IST';

  let items = [];
  if (order.items && Array.isArray(order.items)) {
    items = order.items;
  } else if (order.product) {
    items = [{
      name: order.product.replace('[ONLINE ORDER]', '').trim(),
      quantity: order.quantity || 1,
      price: order.estimatedValue || total
    }];
  }

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px 14px; font-size: 13px; color: #111827; vertical-align: top;">
        <strong style="display: block; font-size: 14px; color: #111827;">${item.name || 'Custom Photo Frame'}</strong>
        ${item.size ? `<span style="display: inline-block; font-size: 11px; color: #6B7280; margin-top: 2px;">Size: ${item.size}</span>` : ''}
        ${item.finish ? `<span style="display: inline-block; font-size: 11px; color: #6B7280; margin-left: 6px; margin-top: 2px;">• Finish: ${item.finish}</span>` : ''}
      </td>
      <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #4B5563; font-weight: 600; vertical-align: middle;">x${item.quantity || 1}</td>
      <td style="padding: 12px 14px; font-size: 14px; text-align: right; font-weight: 700; color: #111827; vertical-align: middle;">₹${Number(item.price || (total / (item.quantity || 1))).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  // A) Customer Order Placed Successfully Email (Premium Responsive UI)
  const customerSubject = 'Your Order Has Been Placed Successfully!';
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>Your Order Has Been Placed Successfully!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 24px 12px;">
        <tr>
          <td align="center">
            <!-- Main Email Container (600px Max) -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #0F172A; padding: 28px 24px; text-align: center; border-bottom: 3px solid #D97706;">
                  <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF; text-transform: uppercase;">
                    RAJENDRA <span style="color: #F59E0B;">STUDIO &amp; FRAMING</span>
                  </div>
                  <div style="font-size: 11px; letter-spacing: 1.5px; color: #94A3B8; text-transform: uppercase; margin-top: 6px; font-weight: 600;">
                    ONLINE ORDER DESK &bull; DAHEJ SUPPORT
                  </div>
                </td>
              </tr>

              <!-- Status Hero Banner -->
              <tr>
                <td style="background: #ECFDF5; padding: 26px 24px 22px; text-align: center; border-bottom: 1px solid #A7F3D0;">
                  <div style="display: inline-block; background-color: #059669; color: #FFFFFF; font-weight: 800; font-size: 11px; letter-spacing: 1.2px; padding: 6px 18px; border-radius: 999px; text-transform: uppercase; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                    ORDER PLACED SUCCESSFULLY
                  </div>
                  <h1 style="margin: 14px 0 6px; font-size: 24px; font-weight: 800; color: #064E3B; line-height: 1.25;">
                    Thank You for Your Order!
                  </h1>
                  <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.5;">
                    Your order #${cleanId} has been successfully placed at Rajendra Studio &amp; Framing. Our team will review your order and notify you once it has been accepted.
                  </p>
                  <div style="display: inline-block; margin-top: 14px; background-color: #FFFFFF; border: 1px solid #6EE7B7; border-radius: 8px; padding: 7px 16px; font-size: 13px; color: #065F46; font-weight: 700;">
                    Order ID: <span style="color: #D97706;">#${cleanId}</span> &bull; Placed on ${timeIST}
                  </div>
                </td>
              </tr>

              <!-- Order Journey Tracker (Visual Lifecycle) -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 22px 24px; border-bottom: 1px solid #F3F4F6;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; text-align: center; margin-bottom: 14px;">
                    ORDER LIFECYCLE &bull; REAL-TIME PROGRESS
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <!-- Step 1: Placed -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #059669; color: #FFFFFF; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">✓</div>
                        <div style="font-size: 12px; font-weight: 800; color: #065F46;">1. Order Placed</div>
                        <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 2px;">Completed</div>
                      </td>
                      <!-- Step 2: In Review & Framing -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px; border-left: 2px dashed #E5E7EB; border-right: 2px dashed #E5E7EB;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #FEF3C7; color: #D97706; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px; border: 1px solid #FCD34D;">⏳</div>
                        <div style="font-size: 12px; font-weight: 700; color: #1F2937;">2. Acceptance</div>
                        <div style="font-size: 10px; color: #D97706; font-weight: 700; margin-top: 2px;">Awaiting Acceptance</div>
                      </td>
                      <!-- Step 3: Fulfilment -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #F3F4F6; color: #9CA3AF; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px;">📦</div>
                        <div style="font-size: 12px; font-weight: 600; color: #6B7280;">3. Ready for Pickup</div>
                        <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">Pickup or Delivery</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Customer Greeting & Notice Box -->
              <tr>
                <td style="padding: 24px 28px 0;">
                  <!-- Clear Notice: Placed but NOT yet accepted -->
                  <div style="background-color: #FEF9C3; border: 1.5px solid #FDE047; border-radius: 10px; padding: 18px 20px; margin-bottom: 20px; color: #854D0E; font-size: 14px; line-height: 1.6;">
                    <p style="margin: 0 0 10px; font-size: 15px; color: #111827;">Hello <strong>${customerName}</strong>,</p>
                    <p style="margin: 0 0 10px; font-size: 15px; color: #854D0E; font-weight: 700;">Thank You for Your Order!</p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #1F2937; line-height: 1.5;">Your order <strong>#${cleanId}</strong> has been successfully placed at Rajendra Studio &amp; Framing. Our team will review your order and notify you once it has been accepted.</p>
                    <p style="margin: 10px 0 0; font-size: 14px; color: #4B5563;">Thank you for shopping with us!</p>
                  </div>

                  <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 0 0 18px;">
                    Our team will review your order details shortly. Once accepted, we will notify you with the pickup date.
                  </p>
                  ${uploadedPhoto ? `
                    <div style="background-color: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="64" style="vertical-align: middle;">
                            <img src="${uploadedPhoto}" alt="Uploaded Photo" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #D8B4FE; display: block;" />
                          </td>
                          <td style="padding-left: 14px; vertical-align: middle;">
                            <div style="font-size: 11px; font-weight: 700; color: #7E22CE; text-transform: uppercase; letter-spacing: 0.5px;">✓ Custom Photo Received</div>
                            <div style="font-size: 13px; font-weight: 600; color: #1F2937; margin-top: 2px;">${photoName}</div>
                            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">High-resolution file queued for fine-art print &amp; framing</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Order Items Table -->
              <tr>
                <td style="padding: 0 28px 20px;">
                  <div style="font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">
                    Order Summary (${items.length} Item${items.length === 1 ? '' : 's'})
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; margin-bottom: 16px;">
                    <thead>
                      <tr style="background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                        <th style="padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                        <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                        <th style="padding: 12px 14px; text-align: right; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                        <td colspan="2" style="padding: 10px 14px; font-size: 13px; color: #4B5563; text-align: right;">Subtotal:</td>
                        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="background-color: #F9FAFB;">
                        <td colspan="2" style="padding: 6px 14px; font-size: 13px; color: #4B5563; text-align: right;">Custom Framing &amp; Packaging:</td>
                        <td style="padding: 6px 14px; font-size: 12px; font-weight: 700; color: #059669; text-align: right;">FREE</td>
                      </tr>
                      <tr style="background-color: #F9FAFB;">
                        <td colspan="2" style="padding: 6px 14px; font-size: 13px; color: #4B5563; text-align: right;">Estimated Delivery:</td>
                        <td style="padding: 6px 14px; font-size: 12px; font-weight: 700; color: #059669; text-align: right;">FREE</td>
                      </tr>
                      <tr style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                        <td colspan="2" style="padding: 12px 14px; font-size: 15px; font-weight: 800; color: #111827; text-align: right;">Grand Total:</td>
                        <td style="padding: 12px 14px; font-size: 18px; font-weight: 800; color: #D97706; text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Delivery & Payment Information Cards -->
              <tr>
                <td style="padding: 0 28px 24px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="48%" style="vertical-align: top; background-color: #FAF8F5; border: 1px solid #EAE5DB; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8B7355; margin-bottom: 6px; letter-spacing: 0.5px;">📍 Delivery Details</div>
                        <div style="font-size: 13px; font-weight: 700; color: #111827;">${customerName}</div>
                        <div style="font-size: 12px; color: #4B5563; margin-top: 3px; line-height: 1.4;">${deliveryAddress}</div>
                        <div style="font-size: 12px; color: #4B5563; margin-top: 3px;">📞 ${customerPhone || 'N/A'}</div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="vertical-align: top; background-color: #FAF8F5; border: 1px solid #EAE5DB; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8B7355; margin-bottom: 6px; letter-spacing: 0.5px;">💳 Payment Details</div>
                        <div style="font-size: 13px; font-weight: 700; color: #111827;">${paymentMethod}</div>
                        <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 3px;">Status: Order Recorded</div>
                        ${upiUtr ? `<div style="font-size: 11px; color: #6B7280; margin-top: 3px;">UPI UTR: <strong style="color: #111827;">${upiUtr}</strong></div>` : ''}
                        <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Turnaround: 24–48 Hours</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Action Buttons -->
              <tr>
                <td align="center" style="padding: 0 28px 28px;">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="border-radius: 8px; background: #0F172A; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
                        <a href="${trackingUrl}" target="_blank" style="font-size: 14px; font-weight: 800; color: #F59E0B; text-decoration: none; padding: 13px 28px; display: inline-block; border-radius: 8px; letter-spacing: 0.3px; border: 1px solid #D97706;">
                          Track Order Live &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top: 16px;">
                    <a href="${STUDIO_INFO.whatsapp}?text=${encodeURIComponent('Hello Rajendra Studio, I placed order #' + cleanId + ' and want to check details.')}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 999px; margin: 0 4px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);">
                      💬 WhatsApp Support
                    </a>
                    <a href="tel:${STUDIO_INFO.phone.replace(/[^0-9+]/g, '')}" style="display: inline-block; background-color: #FFFFFF; color: #1F2937; border: 1px solid #D1D5DB; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 999px; margin: 0 4px;">
                      📞 Helpline: ${STUDIO_INFO.phone}
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Studio Footer -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 22px 28px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; line-height: 1.5;">
                  <div style="font-weight: 700; color: #111827; margin-bottom: 4px;">
                    ${STUDIO_INFO.name} &bull; Dahej Support
                  </div>
                  <div>${STUDIO_INFO.address}</div>
                  <div style="margin-top: 4px;">Studio Hours: ${STUDIO_INFO.hours} &bull; Direct Order Desk: ${ORDER_SENDER_EMAIL}</div>
                  <div style="margin-top: 10px; font-size: 11px; color: #9CA3AF;">
                    Handcrafted with care &bull; Precision photo printing &amp; custom picture framing
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // B) Order Admin Alert Email (sent to order@rajendrastudioandgifts.in)
  const orderAlertSubject = `🛒 [New Online Order] #${cleanId} from ${customerName} (₹${total})`;
  const orderAlertHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5;">
        <div style="background: #111; padding: 20px 24px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 18px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO ORDERS</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px;">New Online Order Alert</div>
        </div>
        <div style="padding: 24px;">
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 14px;">
            🛒 NEW ORDER PLACED
          </div>
          <h3 style="margin: 0 0 10px;">Order #${cleanId} Placed Online</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border: 1px solid #EFEAE0; margin: 14px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Total Amount:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">₹${total}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Payment:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${paymentMethod}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">Delivery Address:</td><td style="padding: 10px 14px; color: #111;">${deliveryAddress}</td></tr>
          </table>
          <div style="text-align: center; margin-top: 18px;">
            <a href="https://rajendrastudioandgifts.in/admin#orders" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 700;">Open in Admin Panel &rarr;</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  let customerEmailResult = { success: false, reason: 'No customer email provided' };
  let adminEmailResult = { success: false };

  const adminPromise = sendOrderBrevoEmail({
    to: ORDER_ALERT_EMAIL,
    subject: orderAlertSubject,
    htmlContent: orderAlertHtml,
    textContent: `Order #${cleanId} Placed Online by ${customerName} (${customerPhone}). Total: ₹${total}`
  }).then(res => {
    adminEmailResult = res;
    return res;
  }).catch(err => {
    adminEmailResult = { success: false, error: err.message };
    return adminEmailResult;
  });

  let customerPromise = Promise.resolve(customerEmailResult);
  if (customerEmail && customerEmail.includes('@')) {
    customerPromise = sendOrderBrevoEmail({
      to: customerEmail,
      subject: customerSubject,
      htmlContent: customerHtml,
      textContent: `Hello ${customerName},\n\nThank You for Your Order!\n\nYour order #${cleanId} has been successfully placed at Rajendra Studio & Framing. Our team will review your order and notify you once it has been accepted.\n\nThank you for shopping with us!`
    }).then(res => {
      customerEmailResult = res;
      if (res && res.success) {
        console.log(`✅ [ORDER PLACED RECEIPT DELIVERED TO CUSTOMER] #${cleanId} -> ${customerEmail}`);
      } else {
        console.warn(`⚠️ [ORDER PLACED RECEIPT DELIVERY FAILED] #${cleanId} -> ${customerEmail}:`, res ? (res.error || res.statusCode) : 'Unknown');
      }
      return res;
    }).catch(err => {
      customerEmailResult = { success: false, error: err.message };
      console.error(`❌ [ORDER PLACED RECEIPT ERROR] #${cleanId} -> ${customerEmail}:`, err.message);
      return customerEmailResult;
    });
  } else {
    console.warn(`⚠️ [notifyOrderConfirmation] Order #${cleanId} does not have a valid customer email on file (Found: "${customerEmail}")`);
  }

  await Promise.allSettled([adminPromise, customerPromise]);
  const customerSent = Boolean(customerEmailResult && customerEmailResult.success);

  return {
    success: customerSent,
    sent: customerSent,
    recipient: customerEmail,
    customerResult: customerEmailResult,
    adminResult: adminEmailResult,
    orderNotified: true
  };
}

/**
 * 8. ORDER CONFIRMED BY ADMIN (via order@rajendrastudioandgifts.in)
 * Dispatched strictly when Admin confirms an order in the Admin Panel
 */
async function notifyOrderAcceptedByAdmin({ order, pickupDate = null, confirmationDate = null, notes = '', req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');
  const customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  const rawEmail = (order.customer && order.customer.email) || order.email || order.customerEmail || '';
  const customerEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();
  const customerPhone = (order.customer && order.customer.phone) || order.phone || '';
  const total = Number(order.total || order.estimatedValue || 0);
  const subtotal = Number(order.subtotal || total);
  const paymentMethod = order.paymentMethod || 'Pick up from shop';
  const upiUtr = order.upiUtr || null;

  const rawPickupDate = pickupDate || confirmationDate || (order && (order.pickupDate || order.pickup_date || order.confirmationDate || order.confirmation_date));
  const formattedPickupDate = formatDateDisplay(rawPickupDate) || new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  const deliveryAddress = (order.customer && order.customer.address 
    ? `${order.customer.address}${order.customer.city ? ', ' + order.customer.city : ''}${order.customer.pincode ? ' (' + order.customer.pincode + ')' : ''}` 
    : (order.deliveryAddress || order.address || 'Studio Counter Pickup, Dahej'));

  const protocol = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https';
  const host = (req && req.get('host')) || 'rajendrastudioandgifts.in';
  const trackingUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(cleanId)}`;

  const timeIST = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  }) + ' IST';

  let items = [];
  if (order.items && Array.isArray(order.items)) {
    items = order.items;
  } else if (order.product) {
    items = [{
      name: order.product.replace('[ONLINE ORDER]', '').trim(),
      quantity: order.quantity || 1,
      price: order.estimatedValue || total
    }];
  }

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 12px 14px; font-size: 13px; color: #111827; vertical-align: top;">
        <strong style="display: block; font-size: 14px; color: #111827;">${item.name || 'Custom Photo Frame'}</strong>
        ${item.size ? `<span style="display: inline-block; font-size: 11px; color: #6B7280; margin-top: 2px;">Size: ${item.size}</span>` : ''}
        ${item.finish ? `<span style="display: inline-block; font-size: 11px; color: #6B7280; margin-left: 6px; margin-top: 2px;">• Finish: ${item.finish}</span>` : ''}
      </td>
      <td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #4B5563; font-weight: 600; vertical-align: middle;">x${item.quantity || 1}</td>
      <td style="padding: 12px 14px; font-size: 14px; text-align: right; font-weight: 700; color: #111827; vertical-align: middle;">₹${Number(item.price || (total / (item.quantity || 1))).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  // A) Customer Acceptance Email (Triggered strictly on Admin Acceptance)
  const customerSubject = 'Your Order Has Been Confirmed!';
  const customerHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
      <title>Your Order Has Been Confirmed!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111827;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 24px 12px;">
        <tr>
          <td align="center">
            <!-- Main Email Container (600px Max) -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);">
              
              <!-- Brand Header -->
              <tr>
                <td style="background-color: #0F172A; padding: 28px 24px; text-align: center; border-bottom: 3px solid #D97706;">
                  <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF; text-transform: uppercase;">
                    RAJENDRA <span style="color: #F59E0B;">STUDIO &amp; FRAMING</span>
                  </div>
                  <div style="font-size: 11px; letter-spacing: 1.5px; color: #94A3B8; text-transform: uppercase; margin-top: 6px; font-weight: 600;">
                    CUSTOMER ORDER DESK &bull; DAHEJ SUPPORT
                  </div>
                </td>
              </tr>

              <!-- Status Hero Banner -->
              <tr>
                <td style="background: #ECFDF5; padding: 26px 24px 22px; text-align: center; border-bottom: 1px solid #A7F3D0;">
                  <div style="display: inline-block; background-color: #059669; color: #FFFFFF; font-weight: 800; font-size: 11px; letter-spacing: 1.2px; padding: 6px 18px; border-radius: 999px; text-transform: uppercase; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.25);">
                    ORDER CONFIRMED
                  </div>
                  <h1 style="margin: 14px 0 6px; font-size: 24px; font-weight: 800; color: #064E3B; line-height: 1.25;">
                    Your Order Has Been Confirmed!
                  </h1>
                  <p style="margin: 0; font-size: 14px; color: #047857; line-height: 1.5;">
                    Your order #${cleanId} has been successfully confirmed by our team.
                  </p>
                  <div style="display: inline-block; margin-top: 14px; background-color: #FFFFFF; border: 1px solid #6EE7B7; border-radius: 8px; padding: 7px 16px; font-size: 13px; color: #065F46; font-weight: 700;">
                    Order ID: <span style="color: #D97706;">#${cleanId}</span> &bull; Scheduled Pickup: ${formattedPickupDate}
                  </div>
                </td>
              </tr>

              <!-- Order Journey Tracker (Visual Lifecycle) -->
              <tr>
                <td style="background-color: #FFFFFF; padding: 22px 24px; border-bottom: 1px solid #F3F4F6;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6B7280; text-align: center; margin-bottom: 14px;">
                    ORDER LIFECYCLE &bull; REAL-TIME PROGRESS
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <!-- Step 1: Placed -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #059669; color: #FFFFFF; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px;">✓</div>
                        <div style="font-size: 12px; font-weight: 700; color: #065F46;">1. Order Placed</div>
                        <div style="font-size: 10px; color: #059669; margin-top: 2px;">Completed</div>
                      </td>
                      <!-- Step 2: Accepted & In Production -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px; border-left: 2px dashed #059669; border-right: 2px dashed #E5E7EB;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #059669; color: #FFFFFF; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">✓</div>
                        <div style="font-size: 12px; font-weight: 800; color: #065F46;">2. Accepted</div>
                        <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 2px;">Pickup Scheduled</div>
                      </td>
                      <!-- Step 3: Fulfilment -->
                      <td width="33%" align="center" style="vertical-align: top; padding: 0 4px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #F3F4F6; color: #9CA3AF; line-height: 32px; font-size: 14px; font-weight: 800; margin: 0 auto 6px;">📦</div>
                        <div style="font-size: 12px; font-weight: 600; color: #6B7280;">3. Ready for Pickup</div>
                        <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">Collection Date: ${formattedPickupDate}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Customer Greeting & Acceptance Message -->
              <tr>
                <td style="padding: 24px 28px 0;">
                  <!-- Official Acceptance Message Box -->
                  <div style="background-color: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: 12px; padding: 20px 22px; margin-bottom: 22px; color: #065F46; font-size: 15px; line-height: 1.6;">
                    <p style="margin: 0 0 10px; font-size: 15px; color: #111827;">Hello <strong>${customerName}</strong>,</p>
                    <p style="margin: 0 0 10px; font-size: 15px; color: #064E3B; font-weight: 700;">Your order <strong>#${cleanId}</strong> has been successfully confirmed by our team.</p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #111827;"><strong>Your Pickup Date:</strong> <span style="color: #059669; font-weight: 700; font-size: 15px;">${formattedPickupDate}</span></p>
                    <p style="margin: 0 0 10px; font-size: 14px; color: #065F46;">Please visit our shop on the scheduled date to collect your order.</p>
                    <p style="margin: 10px 0 0; font-size: 14px; color: #4B5563;">Thank you for shopping with Rajendra Studio &amp; Framing!</p>
                  </div>

                  <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin: 0 0 18px;">
                    Our master framing team has verified your specifications for Order <strong>#${cleanId}</strong>. Custom printing, frame moulding, and artisanal mounting are now in progress.
                  </p>
                  ${notes ? `
                    <div style="background-color: #FFFDF7; border-left: 4px solid #C99A3D; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #333; border: 1px solid #F5E8D0; border-left-width: 4px;">
                      <strong style="color: #8B7355; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase;">Note from Studio Team:</strong>
                      ${notes}
                    </div>
                  ` : ''}
                </td>
              </tr>

              <!-- Order Items Table -->
              <tr>
                <td style="padding: 0 28px 20px;">
                  <div style="font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">
                    Order Details (${items.length} Item${items.length === 1 ? '' : 's'})
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; margin-bottom: 16px;">
                    <thead>
                      <tr style="background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                        <th style="padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                        <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                        <th style="padding: 12px 14px; text-align: right; font-size: 11px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                      <tr style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                        <td colspan="2" style="padding: 10px 14px; font-size: 13px; color: #4B5563; text-align: right;">Subtotal:</td>
                        <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #111827; text-align: right;">₹${subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style="background-color: #F9FAFB;">
                        <td colspan="2" style="padding: 6px 14px; font-size: 13px; color: #4B5563; text-align: right;">Custom Framing &amp; Packaging:</td>
                        <td style="padding: 6px 14px; font-size: 12px; font-weight: 700; color: #059669; text-align: right;">FREE</td>
                      </tr>
                      <tr style="background-color: #F9FAFB;">
                        <td colspan="2" style="padding: 6px 14px; font-size: 13px; color: #4B5563; text-align: right;">Estimated Delivery:</td>
                        <td style="padding: 6px 14px; font-size: 12px; font-weight: 700; color: #059669; text-align: right;">FREE</td>
                      </tr>
                      <tr style="background-color: #F9FAFB; border-top: 1px solid #E5E7EB;">
                        <td colspan="2" style="padding: 12px 14px; font-size: 15px; font-weight: 800; color: #111827; text-align: right;">Grand Total:</td>
                        <td style="padding: 12px 14px; font-size: 18px; font-weight: 800; color: #D97706; text-align: right;">₹${total.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Delivery & Payment Information Cards -->
              <tr>
                <td style="padding: 0 28px 24px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="48%" style="vertical-align: top; background-color: #FAF8F5; border: 1px solid #EAE5DB; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8B7355; margin-bottom: 6px; letter-spacing: 0.5px;">📍 Delivery Details</div>
                        <div style="font-size: 13px; font-weight: 700; color: #111827;">${customerName}</div>
                        <div style="font-size: 12px; color: #4B5563; margin-top: 3px; line-height: 1.4;">${deliveryAddress}</div>
                        <div style="font-size: 12px; color: #4B5563; margin-top: 3px;">📞 ${customerPhone || 'N/A'}</div>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="vertical-align: top; background-color: #FAF8F5; border: 1px solid #EAE5DB; border-radius: 10px; padding: 14px 16px;">
                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #8B7355; margin-bottom: 6px; letter-spacing: 0.5px;">💳 Payment Details</div>
                        <div style="font-size: 13px; font-weight: 700; color: #111827;">${paymentMethod}</div>
                        <div style="font-size: 12px; color: #059669; font-weight: 600; margin-top: 3px;">Status: Confirmed &bull; Processing</div>
                        ${upiUtr ? `<div style="font-size: 11px; color: #6B7280; margin-top: 3px;">UPI UTR: <strong style="color: #111827;">${upiUtr}</strong></div>` : ''}
                        <div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Turnaround: 24–48 Hours</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Action Buttons -->
              <tr>
                <td align="center" style="padding: 0 28px 28px;">
                  <table border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="border-radius: 8px; background: #0F172A; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">
                        <a href="${trackingUrl}" target="_blank" style="font-size: 14px; font-weight: 800; color: #F59E0B; text-decoration: none; padding: 13px 28px; display: inline-block; border-radius: 8px; letter-spacing: 0.3px; border: 1px solid #D97706;">
                          Track Order Live &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top: 16px;">
                    <a href="${STUDIO_INFO.whatsapp}?text=${encodeURIComponent('Hello Rajendra Studio, I am following up on my confirmed order #' + cleanId)}." target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 999px; margin: 0 4px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);">
                      💬 WhatsApp Support
                    </a>
                    <a href="tel:${STUDIO_INFO.phone.replace(/[^0-9+]/g, '')}" style="display: inline-block; background-color: #FFFFFF; color: #1F2937; border: 1px solid #D1D5DB; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 999px; margin: 0 4px;">
                      📞 Helpline: ${STUDIO_INFO.phone}
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Studio Footer -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 22px 28px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 12px; color: #6B7280; line-height: 1.5;">
                  <div style="font-weight: 700; color: #111827; margin-bottom: 4px;">
                    ${STUDIO_INFO.name} &bull; Dahej Support
                  </div>
                  <div>${STUDIO_INFO.address}</div>
                  <div style="margin-top: 4px;">Studio Hours: ${STUDIO_INFO.hours} &bull; Direct Order Desk: ${ORDER_SENDER_EMAIL}</div>
                  <div style="margin-top: 10px; font-size: 11px; color: #9CA3AF;">
                    Handcrafted with care &bull; Precision photo printing &amp; custom picture framing
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // B) Order Admin Alert (sent to order@rajendrastudioandgifts.in)
  const adminSubject = `🎨 [Order Accepted by Admin] #${cleanId} - ${customerName}`;
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid #E5E0D5;">
        <div style="background: #111; padding: 20px 24px; border-bottom: 3px solid #C99A3D; text-align: center;">
          <h2 style="color: #fff; margin:0; font-size: 18px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO ORDERS</span>
          </h2>
          <div style="color: #A0A5B1; font-size: 11px;">Admin Order Acceptance Log</div>
        </div>
        <div style="padding: 24px;">
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 14px;">
            ✓ ORDER ACCEPTED BY ADMIN
          </div>
          <h3 style="margin: 0 0 10px;">Order #${cleanId} Accepted</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5;">
            The order was accepted by the admin with scheduled pickup date: <strong>${formattedPickupDate}</strong>.
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border: 1px solid #EFEAE0; margin: 14px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Pickup Date:</td><td style="padding: 10px 14px; font-weight: 700; color: #059669; border-bottom: 1px solid #EFEAE0;">${formattedPickupDate}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Total:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">₹${total}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">Status:</td><td style="padding: 10px 14px; color: #047857; font-weight: 700;">confirmed (${timeIST})</td></tr>
          </table>
          ${notes ? `<div style="font-size: 13px; color: #555; background: #FFFBEB; padding: 10px 14px; border-radius: 6px; border: 1px solid #FDE68A; margin-bottom: 18px;"><strong>Note:</strong> ${notes}</div>` : ''}
          <div style="text-align: center; margin-top: 18px;">
            <a href="https://rajendrastudioandgifts.in/admin#orders" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13px; font-weight: 700;">View in Admin Panel &rarr;</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  let adminEmailResult = { success: false };
  let customerEmailResult = { success: false, reason: 'No valid customer email' };

  // Dispatch admin log email
  const adminPromise = sendOrderBrevoEmail({
    to: ORDER_ALERT_EMAIL,
    subject: adminSubject,
    htmlContent: adminHtml,
    textContent: `Order #${cleanId} accepted by admin. Pickup Date: ${formattedPickupDate}. Customer: ${customerName} (${customerPhone}). Total: ₹${total}`
  }).then(res => {
    adminEmailResult = res;
    return res;
  }).catch(err => {
    adminEmailResult = { success: false, error: err.message };
    return adminEmailResult;
  });

  // Dispatch customer acceptance email (Strict user specification text)
  let customerPromise = Promise.resolve(customerEmailResult);
  if (customerEmail && customerEmail.includes('@')) {
    customerPromise = sendOrderBrevoEmail({
      to: customerEmail,
      subject: customerSubject,
      htmlContent: customerHtml,
      textContent: `Hello ${customerName},\n\nYour order #${cleanId} has been successfully confirmed by our team.\n\nYour Pickup Date: ${formattedPickupDate}\n\nPlease visit our shop on the scheduled date to collect your order.\n\nThank you for shopping with Rajendra Studio & Framing!`
    }).then(res => {
      customerEmailResult = res;
      if (res && res.success) {
        console.log(`✅ [ORDER ACCEPTED EMAIL DELIVERED TO CUSTOMER] #${cleanId} -> ${customerEmail}`);
      } else {
        console.warn(`⚠️ [ORDER ACCEPTED EMAIL FAILED] #${cleanId} -> ${customerEmail}:`, res ? (res.error || res.statusCode) : 'Unknown');
      }
      return res;
    }).catch(err => {
      customerEmailResult = { success: false, error: err.message };
      console.error(`❌ [ORDER ACCEPTED EMAIL ERROR] #${cleanId} -> ${customerEmail}:`, err.message);
      return customerEmailResult;
    });
  } else {
    console.warn(`⚠️ [notifyOrderAcceptedByAdmin] Order #${cleanId} does not have a valid customer email on file (Found: "${customerEmail}")`);
  }

  await Promise.allSettled([adminPromise, customerPromise]);
  const isCustomerSent = Boolean(customerEmailResult && customerEmailResult.success);

  return {
    success: isCustomerSent,
    sent: isCustomerSent,
    recipient: customerEmail,
    customerResult: customerEmailResult,
    adminResult: adminEmailResult,
    orderNotified: isCustomerSent
  };
}

const notifyOrderConfirmedByAdmin = notifyOrderAcceptedByAdmin;

module.exports = {
  sendBrevoEmail,
  sendOrderBrevoEmail,
  notifyOrderConfirmation,
  notifyOrderPlaced: notifyOrderConfirmation,
  notifyOrderConfirmedByAdmin,
  notifyOrderAcceptedByAdmin,
  notifyCustomerLogin,
  notifyAdminLogin,
  notifyOrderPickupReady,
  notifyOrderReadyForPickup: notifyOrderPickupReady,
  notifyOrderCancelledByAdmin,
  sendCustomerOtpEmail,
  sendAdminOtpEmail,
  notifyNewOrderPlaced: notifyOrderConfirmation,
  BREVO_API_KEY,
  SENDER_EMAIL,
  SHOP_ALERT_EMAIL,
  STUDIO_INFO
};
