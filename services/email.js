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
  phone: '+91 96015 74966',
  whatsapp: 'https://wa.me/919601574966',
  email: 'shop@rajendrastudioandgifts.in',
  hours: '9:30 AM – 9:00 PM (Monday to Sunday)'
};

/**
 * Core Brevo API Dispatcher
 */
function sendBrevoEmail({ to, subject, htmlContent, textContent, bcc = null, replyTo = null, sender = null, apiKey = null }) {
  return new Promise((resolve, reject) => {
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

      if (replyTo) {
        const cleanReply = typeof replyTo === 'string' ? replyTo.trim().toLowerCase() : (replyTo.email || '').trim().toLowerCase();
        if (cleanReply && cleanReply.includes('@')) {
          payload.replyTo = { email: cleanReply };
        }
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
        timeout: 10000
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
        console.warn('⚠️ [Brevo Email Timeout] Request timed out after 10s');
        resolve({ success: false, error: 'Request timeout' });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.error('❌ [sendBrevoEmail Exception]:', err.message);
      resolve({ success: false, error: err.message });
    }
  });
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
            <div style="font-size: 13px; color: #666;"><strong>Security Notice:</strong> If you did not perform this login, please contact us immediately on WhatsApp or Phone: <a href="tel:+919601574966" style="color: #8C6A1E; font-weight: 700;">+91 96015 74966</a>.</div>
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
async function notifyOrderPickupReady({ order, notes = '', req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');

  let customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  let customerEmail = (order.customer && order.customer.email) || order.email || '';
  let customerPhone = (order.customer && order.customer.phone) || order.phone || '';

  const protocol = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https';
  const host = (req && req.get('host')) || 'rajendrastudioandgifts.in';
  const trackingUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(cleanId)}`;

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

  const total = order.total || order.estimatedValue || 0;
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

  // A) Beautiful Customer Pick Up Ready Email
  const customerSubject = `🛍️ Your Order #${cleanId} is READY FOR PICK UP at Rajesh Framing Studio Shop!`;
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: #111; padding: 28px; text-align: center; border-bottom: 3px solid #C99A3D;">
          <h2 style="color: #fff; margin:0; font-size: 21px; letter-spacing: 2px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">
            Premium Framing Studio • Dahej Support
          </div>
        </div>

        <!-- Banner -->
        <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); padding: 28px 24px; text-align: center; border-bottom: 1px solid #FDE68A;">
          <div style="display: inline-block; background: #C99A3D; color: #111; font-weight: 800; font-size: 12px; letter-spacing: 1px; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 10px;">
            🛍️ READY FOR COLLECTION
          </div>
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 800; color: #111;">
            Your Order is Ready to Pick Up!
          </h1>
          <p style="margin: 0; font-size: 15px; color: #555;">
            Order ID: <strong style="color: #8C6A1E; font-size: 17px;">#${cleanId}</strong>
          </p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 15px; color: #333; line-height: 1.6; margin-top: 0;">
            Dear <strong>${customerName}</strong>,
          </p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Great news! Your custom framed artwork for order <strong>#${cleanId}</strong> is crafted, framed, quality-inspected, and is now <strong>ready for you to pick up from our studio shop</strong>!
          </p>

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
              <strong>📞 Direct Helpline:</strong> <a href="tel:+919601574966" style="color: #8C6A1E; font-weight: 700; text-decoration: none;">+91 96015 74966</a><br>
              <strong>💬 WhatsApp:</strong> <a href="${STUDIO_INFO.whatsapp}" style="color: #16A34A; font-weight: 700; text-decoration: none;">Chat on WhatsApp (+91 96015 74966)</a>
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
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}<br>
          For queries: ${STUDIO_INFO.phone} • ${STUDIO_INFO.email}
        </div>
      </div>
    </body>
    </html>
  `;

  // B) Shop Alert to shop@rajendrastudioandgifts.in
  const shopSubject = `🛍️ [Pick Up Ready Alert] Order #${cleanId} Ready for Shop Collection - ${customerName}`;
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
          <div style="color: #A0A5B1; font-size: 11px; margin-top: 4px;">Order Ready For Pick Up Notification</div>
        </div>
        <div style="padding: 24px;">
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 14px;">
            🛍️ ORDER MARKED READY FOR PICK UP
          </div>
          <h3 style="margin: 0 0 10px; font-size: 18px;">Order #${cleanId} Ready for Collection</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5;">
            An order was marked ready for pick up. Notification has been sent to the customer:
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border-radius: 8px; border: 1px solid #EFEAE0; margin: 16px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 140px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
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

  // Plain text fallback
  const plainText = `Hello ${customerName},

Great news! Your custom framed artwork for Order #${cleanId} is crafted, inspected, and READY FOR PICK UP at Rajesh Framing Studio!

Order Total: ₹${total} (${paymentMethod})

Pick Up Location:
${STUDIO_INFO.address}
Timings: ${STUDIO_INFO.hours}
Helpline: ${STUDIO_INFO.phone}
WhatsApp: ${STUDIO_INFO.whatsapp}

Please bring your Order ID #${cleanId} when visiting the shop.
Track online: ${trackingUrl}

Thank you,
Rajendra Studio & Framing
`;

  const promises = [
    sendBrevoEmail({
      to: SHOP_ALERT_EMAIL,
      subject: shopSubject,
      htmlContent: shopHtml,
      textContent: `Order #${cleanId} is ready for pick up at shop. Customer: ${customerName} (${customerPhone}). Total: ₹${total}`
    })
  ];

  if (customerEmail && customerEmail.includes('@')) {
    promises.push(
      sendBrevoEmail({
        to: customerEmail,
        subject: customerSubject,
        htmlContent: customerHtml,
        textContent: plainText
      })
    );
  }

  const results = await Promise.allSettled(promises);
  return {
    success: true,
    sent: true,
    recipient: customerEmail,
    shopNotified: true
  };
}

/**
 * 4. CUSTOMER OTP EMAIL
 */
async function sendCustomerOtpEmail({ email, otp, name = '' }) {
  if (!email || !email.includes('@')) return { success: false, reason: 'Invalid email' };

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name && name.trim()) || 'Valued Customer';
  const subject = `🔐 Your Passcode to Sign In: ${otp} - Rajendra Studio`;

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
  const subject = `🔐 [Admin OTP] Rajendra Studio Admin Passcode: ${otp}`;

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
 * 7. ORDER CONFIRMATION NOTIFICATION (via order@rajendrastudioandgifts.in)
 * Dispatched when a customer places an order or an order is confirmed
 */
async function notifyOrderConfirmation({ order, req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');
  const customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  const rawEmail = (order.customer && order.customer.email) || order.email || order.customerEmail || '';
  const customerEmail = (typeof rawEmail === 'string' ? rawEmail : '').trim().toLowerCase();
  const customerPhone = (order.customer && order.customer.phone) || order.phone || '';
  const total = order.total || order.estimatedValue || 0;
  const paymentMethod = order.paymentMethod || 'Pick up from shop';

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

  // A) Customer Confirmation Email
  const customerSubject = `🎉 Order #${cleanId} Confirmed - Rajendra Studio & Framing`;
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #111; padding: 26px 28px; text-align: center; border-bottom: 3px solid #C99A3D;">
          <h2 style="color: #fff; margin:0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">
            Order Confirmation Desk • Dahej Support
          </div>
        </div>
        <div style="background: #ECFDF5; padding: 22px 24px; text-align: center; border-bottom: 1px solid #A7F3D0;">
          <div style="display: inline-block; background: #059669; color: #fff; font-weight: 800; font-size: 12px; letter-spacing: 1px; padding: 5px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 8px;">
            ✓ ORDER CONFIRMED
          </div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #065F46;">
            Thank You for Your Order!
          </h1>
          <p style="margin: 0; font-size: 14px; color: #047857;">
            Order ID: <strong>#${cleanId}</strong> • Placed on ${timeIST}
          </p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #333; margin-top: 0;">
            Dear <strong>${customerName}</strong>,
          </p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Your order <strong>#${cleanId}</strong> has been successfully confirmed at Rajendra Studio &amp; Framing. Our team will handcraft and prepare your custom frames with utmost care and precision.
          </p>
          <h4 style="margin: 20px 0 10px; font-size: 14px; color: #111; text-transform: uppercase;">Order Items</h4>
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
                <td colspan="2" style="padding: 12px 14px; font-weight: 800; font-size: 15px; text-align: right; color: #111;">Total Amount:</td>
                <td style="padding: 12px 14px; font-weight: 800; font-size: 17px; text-align: right; color: #8C6A1E;">₹${total}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 8px 14px; font-size: 13px; color: #666; text-align: right;">Payment Method:</td>
                <td style="padding: 8px 14px; font-size: 13px; font-weight: 600; text-align: right; color: #111;">${paymentMethod}</td>
              </tr>
            </tbody>
          </table>
          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="${trackingUrl}" style="display: inline-block; background: #111; color: #C99A3D; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; border: 1px solid #C99A3D;">
              Track Order Live &rarr;
            </a>
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 16px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}<br>
          Direct Order Desk: ${ORDER_SENDER_EMAIL} • Helpline: ${STUDIO_INFO.phone}
        </div>
      </div>
    </body>
    </html>
  `;

  // B) Order Admin Alert Email (sent to order@rajendrastudioandgifts.in)
  const orderAlertSubject = `🛒 [Order Confirmed] #${cleanId} from ${customerName} (₹${total})`;
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
          <div style="color: #A0A5B1; font-size: 11px;">New Confirmed Order Alert</div>
        </div>
        <div style="padding: 24px;">
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block; margin-bottom: 14px;">
            🛒 NEW ORDER CONFIRMED
          </div>
          <h3 style="margin: 0 0 10px;">Order #${cleanId} Confirmed</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border: 1px solid #EFEAE0; margin: 14px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Total Amount:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">₹${total}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">Payment:</td><td style="padding: 10px 14px; color: #111;">${paymentMethod}</td></tr>
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
    textContent: `Order #${cleanId} Confirmed from ${customerName} (${customerPhone}). Total: ₹${total}`
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
      textContent: `Hello ${customerName}, your order #${cleanId} has been confirmed at Rajendra Studio & Framing. Total: ₹${total}. Track online: ${trackingUrl}`
    }).then(res => {
      customerEmailResult = res;
      if (res && res.success) {
        console.log(`✅ [ORDER RECEIPT DELIVERED TO CUSTOMER] #${cleanId} -> ${customerEmail}`);
      } else {
        console.warn(`⚠️ [ORDER RECEIPT DELIVERY FAILED] #${cleanId} -> ${customerEmail}:`, res ? (res.error || res.statusCode) : 'Unknown');
      }
      return res;
    }).catch(err => {
      customerEmailResult = { success: false, error: err.message };
      console.error(`❌ [ORDER RECEIPT ERROR] #${cleanId} -> ${customerEmail}:`, err.message);
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
 * 8. ORDER ACCEPTED BY ADMIN (via order@rajendrastudioandgifts.in)
 * Dispatched when Admin clicks "Accept Order" or status is updated to Confirmed / Accepted / In Progress
 */
async function notifyOrderAcceptedByAdmin({ order, notes = '', req = null }) {
  if (!order) return { success: false, reason: 'No order provided' };

  const orderId = order.orderId || order.id || 'N/A';
  const cleanId = orderId.toString().replace(/^#/, '');
  const customerName = (order.customer && order.customer.name) || order.name || 'Valued Customer';
  const customerEmail = (order.customer && order.customer.email) || order.email || '';
  const customerPhone = (order.customer && order.customer.phone) || order.phone || '';
  const total = order.total || order.estimatedValue || 0;
  const paymentMethod = order.paymentMethod || 'Pick up from shop';

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

  // A) Customer Accepted & Production Started Email
  const customerSubject = `🎨 Order #${cleanId} Accepted & In Production! - Rajendra Studio`;
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F0; margin:0; padding:24px; color:#111;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
        <div style="background: #111; padding: 26px 28px; text-align: center; border-bottom: 3px solid #C99A3D;">
          <h2 style="color: #fff; margin:0; font-size: 20px; letter-spacing: 2px; text-transform: uppercase;">
            RAJENDRA <span style="color: #C99A3D;">STUDIO &amp; FRAMING</span>
          </h2>
          <div style="color: #C5A880; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 5px;">
            Master Framing &bull; Production Update
          </div>
        </div>
        <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); padding: 24px; text-align: center; border-bottom: 1px solid #A7F3D0;">
          <div style="display: inline-block; background: #059669; color: #fff; font-weight: 800; font-size: 12px; letter-spacing: 1px; padding: 5px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 8px;">
            🎨 ORDER ACCEPTED &bull; IN PRODUCTION
          </div>
          <h1 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #065F46;">
            Your Order Has Been Accepted!
          </h1>
          <p style="margin: 0; font-size: 14px; color: #047857;">
            Order ID: <strong>#${cleanId}</strong> &bull; Production Started at ${timeIST}
          </p>
        </div>
        <div style="padding: 28px;">
          <p style="font-size: 15px; color: #333; margin-top: 0;">
            Dear <strong>${customerName}</strong>,
          </p>
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Great news! Your custom framed artwork for order <strong>#${cleanId}</strong> has been officially reviewed and <strong>accepted by our master framing team</strong>. It is now in active framing, mounting, and quality production.
          </p>
          ${notes ? `
          <div style="background: #F0FDF4; border-left: 4px solid #16A34A; padding: 12px 16px; margin: 18px 0; border-radius: 4px; font-size: 13px; color: #166534;">
            <strong>Studio Note:</strong> ${notes}
          </div>
          ` : ''}
          <div style="background: #FAF8F5; border: 1px solid #EAE5DB; border-radius: 10px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #111; margin-bottom: 6px;">Next Step: Workshop Crafting &amp; Quality Inspection</div>
            <div style="font-size: 13px; color: #666; line-height: 1.5;">
              Our artisans are precision-cutting, joining, and sealing your frame. Once inspection is complete, you will receive an instant notification that your order is ready for collection at our studio shop.
            </div>
          </div>
          <h4 style="margin: 20px 0 10px; font-size: 14px; color: #111; text-transform: uppercase;">Order Summary</h4>
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
                <td colspan="2" style="padding: 12px 14px; font-weight: 800; font-size: 15px; text-align: right; color: #111;">Total Amount:</td>
                <td style="padding: 12px 14px; font-weight: 800; font-size: 17px; text-align: right; color: #8C6A1E;">₹${total}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 8px 14px; font-size: 13px; color: #666; text-align: right;">Payment Mode:</td>
                <td style="padding: 8px 14px; font-size: 13px; font-weight: 600; text-align: right; color: #111;">${paymentMethod}</td>
              </tr>
            </tbody>
          </table>
          <div style="text-align: center; margin: 24px 0 10px;">
            <a href="${trackingUrl}" style="display: inline-block; background: #111; color: #C99A3D; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; border: 1px solid #C99A3D;">
              Track Order Status Online &rarr;
            </a>
          </div>
        </div>
        <div style="background: #FAF8F5; padding: 16px 24px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #E5E0D5;">
          ${STUDIO_INFO.name} • ${STUDIO_INFO.address}<br>
          Order Support: ${ORDER_SENDER_EMAIL} • Phone: ${STUDIO_INFO.phone}
        </div>
      </div>
    </body>
    </html>
  `;

  // B) Order Admin Alert (sent to order@rajendrastudioandgifts.in)
  const adminSubject = `🎨 [Order Accepted] #${cleanId} Moved to Production - ${customerName}`;
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
            🎨 ORDER ACCEPTED &bull; MOVED TO PRODUCTION
          </div>
          <h3 style="margin: 0 0 10px;">Order #${cleanId} Accepted by Admin</h3>
          <p style="font-size: 14px; color: #555; line-height: 1.5;">
            An order was accepted and marked In Production. Notification sent to customer from <strong>${ORDER_SENDER_EMAIL}</strong>:
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: #FAF9F6; border: 1px solid #EFEAE0; margin: 14px 0;">
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; width: 130px; border-bottom: 1px solid #EFEAE0;">Order ID:</td><td style="padding: 10px 14px; font-weight: 700; color: #8C6A1E; border-bottom: 1px solid #EFEAE0;">#${cleanId}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Customer:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">${customerName}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Email:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerEmail || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Phone:</td><td style="padding: 10px 14px; color: #111; border-bottom: 1px solid #EFEAE0;">${customerPhone || 'N/A'}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666; border-bottom: 1px solid #EFEAE0;">Total:</td><td style="padding: 10px 14px; font-weight: 700; color: #111; border-bottom: 1px solid #EFEAE0;">₹${total}</td></tr>
            <tr><td style="padding: 10px 14px; font-weight: 600; color: #666;">Status Update:</td><td style="padding: 10px 14px; color: #111;">Accepted / In Production (${timeIST})</td></tr>
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

  const promises = [
    sendOrderBrevoEmail({
      to: ORDER_ALERT_EMAIL,
      subject: adminSubject,
      htmlContent: adminHtml,
      textContent: `Order #${cleanId} accepted by admin and moved to production. Customer: ${customerName} (${customerPhone}). Total: ₹${total}`
    })
  ];

  if (customerEmail && customerEmail.includes('@')) {
    promises.push(
      sendOrderBrevoEmail({
        to: customerEmail,
        subject: customerSubject,
        htmlContent: customerHtml,
        textContent: `Hello ${customerName}, your order #${cleanId} has been accepted and moved to framing production at Rajendra Studio. Track online: ${trackingUrl}`
      })
    );
  }

  await Promise.allSettled(promises);
  return { success: true, sent: true, recipient: customerEmail, orderNotified: true };
}

module.exports = {
  sendBrevoEmail,
  sendOrderBrevoEmail,
  notifyOrderConfirmation,
  notifyOrderAcceptedByAdmin,
  notifyCustomerLogin,
  notifyAdminLogin,
  notifyOrderPickupReady,
  sendCustomerOtpEmail,
  sendAdminOtpEmail,
  notifyNewOrderPlaced,
  BREVO_API_KEY,
  SENDER_EMAIL,
  SHOP_ALERT_EMAIL,
  STUDIO_INFO
};
