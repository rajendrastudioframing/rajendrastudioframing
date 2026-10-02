/**
 * RAJESH FRAMING - BACKEND API & ADMIN SERVER
 * Express + Nodemailer + OTP Authentication + Inquiries & Product Management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./services/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Prevent stale browser caching during development and updates
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Clean URL redirect middleware: strip .html extension for clean browser URLs
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const cleanPath = req.path.slice(0, -5);
    const target = cleanPath === '/index' ? '/' : cleanPath;
    const query = req.url.slice(req.path.length);
    return res.redirect(301, (target || '/') + query);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: 0, etag: false }));
app.use(express.static(path.join(__dirname), { extensions: ['html'], maxAge: 0, etag: false }));

// Root Route handler
app.get('/', (req, res) => {
  const publicIndex = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(publicIndex)) {
    return res.sendFile(publicIndex);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// File Paths
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CUSTOMER_SESSIONS_FILE = path.join(DATA_DIR, 'customer-sessions.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure data & upload directories exist (skip on Vercel serverless read-only filesystem)
if (!process.env.VERCEL) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (_) {}
}

// Data Helper Functions (defined early for session hydration)
function readJson(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      if (!process.env.VERCEL) {
        try { fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2)); } catch (_) {}
      }
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    if (process.env.VERCEL) return true;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

// In-Memory Storage for OTPs and Persistent Sessions
const activeOtps = new Map(); // email -> { otp, expiresAt, attempts, createdAt }
const activeSessions = new Map(Object.entries(readJson(SESSIONS_FILE, {})));

function saveSessions() {
  if (process.env.VERCEL) return;
  try {
    const obj = Object.fromEntries(activeSessions);
    writeJson(SESSIONS_FILE, obj);
  } catch (e) {
    console.error('Error saving sessions:', e);
  }
}

// In-Memory Storage for Customer OTPs and Customer Sessions (Email + OTP only)
const customerOtps = new Map(); // email -> { otp, expiresAt, attempts, createdAt }
const customerSessions = new Map(Object.entries(readJson(CUSTOMER_SESSIONS_FILE, {})));

function saveCustomerSessions() {
  if (process.env.VERCEL) return;
  try {
    const obj = Object.fromEntries(customerSessions);
    writeJson(CUSTOMER_SESSIONS_FILE, obj);
  } catch (e) {
    console.error('Error saving customer sessions:', e);
  }
}

// Nodemailer Transporter Factory (Supports Cloud Env Vars + Supabase Config + Local)
function createTransporter(customConfig = null) {
  // 1. Check environment variables first (ideal for Vercel & Production)
  const envUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const envPass = process.env.GMAIL_APP_PASS || process.env.SMTP_PASS;

  if (envUser && envPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envUser,
        pass: envPass
      }
    });
  }

  // 2. Check provided or local config
  const config = customConfig || readJson(CONFIG_FILE, {});
  const smtp = config.smtp || {};

  if (smtp.enabled && smtp.user && smtp.pass) {
    if (smtp.service === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtp.user,
          pass: smtp.pass
        }
      });
    } else {
      return nodemailer.createTransport({
        host: smtp.host || 'smtp.gmail.com',
        port: smtp.port || 465,
        secure: smtp.secure !== false,
        auth: {
          user: smtp.user,
          pass: smtp.pass
        }
      });
    }
  }
  return null; // SMTP not configured yet
}

// Email Template Generator for OTP
function generateOtpEmailHtml(otp, recipientEmail) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F1E8; color: #111111; }
      .container { max-width: 560px; margin: 40px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E0D5; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      .header { background: #111111; padding: 32px 24px; text-align: center; border-bottom: 2px solid #C99A3D; }
      .brand-title { color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
      .brand-title span { color: #C99A3D; }
      .brand-sub { color: #A0A5B1; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
      .content { padding: 40px 32px; text-align: center; }
      .headline { font-size: 20px; font-weight: 700; color: #111111; margin-bottom: 12px; }
      .subtext { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 30px; }
      .otp-box { background: #FAF7F2; border: 2px dashed #C99A3D; border-radius: 12px; padding: 20px; margin: 20px 0; display: inline-block; min-width: 240px; }
      .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #111111; margin: 0; font-family: 'Courier New', Courier, monospace; }
      .timer-note { font-size: 12px; color: #888888; margin-top: 10px; }
      .security-warning { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; text-align: left; font-size: 12px; color: #92400E; margin-top: 30px; border-radius: 4px; }
      .footer { background: #FAF8F5; padding: 20px 24px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #EBE6DC; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="brand-title">RAJESH <span>FRAMING</span></h1>
        <div class="brand-sub">Admin Portal • Two-Factor Authentication</div>
      </div>
      <div class="content">
        <h2 class="headline">Your One-Time Passcode (OTP)</h2>
        <p class="subtext">
          A login attempt was initiated for the Rajesh Framing Admin Dashboard with email: <strong>${recipientEmail}</strong>.<br>
          Use the secure 6-digit passcode below to complete your authentication.
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="timer-note">Expires in <strong>5 minutes</strong></div>
        </div>
        <div class="security-warning">
          <strong>Security Notice:</strong> Never share this OTP with anyone. Rajesh Framing staff will never ask for your authentication passcode. If you did not initiate this login request, please change your admin password immediately.
        </div>
      </div>
      <div class="footer">
        Rajesh Framing Studio • Dahej GIDC, Bharuch, Gujarat 392130<br>
        Direct Customer Support: +91 93280 81006 • rajeshframing0@gmail.com
      </div>
    </div>
  </body>
  </html>
  `;
}

// Customer Email Verification Passcode (OTP) Email Generator
function generateCustomerOtpEmailHtml(otp, recipientEmail) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8F6F0; color: #111111; }
      .container { max-width: 540px; margin: 36px auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #EBE6DC; box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
      .header { background: #111111; padding: 28px 24px; text-align: center; border-bottom: 2px solid #C99A3D; }
      .brand-title { color: #FFFFFF; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
      .brand-title span { color: #C99A3D; }
      .brand-sub { color: #A0A5B1; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
      .content { padding: 36px 28px; text-align: center; }
      .headline { font-size: 20px; font-weight: 700; color: #111111; margin-bottom: 12px; }
      .subtext { font-size: 14px; color: #555555; line-height: 1.6; margin-bottom: 24px; }
      .otp-box { background: #FAF7F2; border: 2px dashed #C99A3D; border-radius: 12px; padding: 18px; margin: 16px 0; display: inline-block; min-width: 240px; }
      .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #111111; margin: 0; font-family: 'Courier New', Courier, monospace; }
      .timer-note { font-size: 12px; color: #888888; margin-top: 8px; }
      .security-warning { background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 14px; text-align: left; font-size: 12px; color: #92400E; margin-top: 24px; border-radius: 4px; }
      .footer { background: #FAF8F5; padding: 18px 24px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #EBE6DC; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="brand-title">RAJESH <span>FRAMING</span></h1>
        <div class="brand-sub">Frames &amp; Custom Prints • Customer Account</div>
      </div>
      <div class="content">
        <h2 class="headline">Your Customer Login Passcode</h2>
        <p class="subtext">
          Use the secure 6-digit One-Time Passcode below to sign in to your Rajesh Framing account for <strong>${recipientEmail}</strong>.
        </p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="timer-note">Valid for <strong>5 minutes</strong> • Single use only</div>
        </div>
        <div class="security-warning">
          <strong>Security Note:</strong> Never share this passcode with anyone. If you did not request this login code, you can safely ignore this email.
        </div>
      </div>
      <div class="footer">
        Rajesh Framing Studio • Dahej GIDC, Bharuch, Gujarat 392130<br>
        Direct Customer Support: +91 93280 81006 • rajeshframing0@gmail.com
      </div>
    </div>
  </body>
  </html>
  `;
}

// Customer Order Status Notification Email Generator
function generateCustomerOrderEmailHtml({ orderId, customerName, newStatus, notes, items, total, paymentMethod, trackingUrl, editOrderUrl, address }) {
  const isPlaced = newStatus === 'Placed' || newStatus === 'New' || newStatus === 'Order Placed';
  const isAccepted = newStatus === 'In Progress' || newStatus === 'Confirmed' || newStatus === 'Accepted';
  const isCancelled = newStatus === 'Cancelled';
  const isShipped = newStatus === 'Shipped' || newStatus === 'Dispatched';
  const isCompleted = newStatus === 'Completed' || newStatus === 'Delivered';

  let badgeText = 'ORDER STATUS UPDATE';
  let badgeBg = '#FEF9EE';
  let badgeColor = '#92400E';
  let badgeBorder = '#FDE68A';
  let headline = `Update on Order #${orderId}`;
  let primaryMessage = `Your order status has been updated to <strong>${newStatus}</strong>.`;

  if (isPlaced) {
    badgeText = '📦 ORDER PLACED • UNDER STUDIO REVIEW';
    badgeBg = '#FFFBEB';
    badgeColor = '#B45309';
    badgeBorder = '#FDE68A';
    headline = 'Your Order Has Been Placed Successfully!';
    primaryMessage = 'Thank you for placing your order with Rajesh Framing! We have received your order details and payment information. Our studio team is currently reviewing your order specifications and will officially confirm your order shortly before framing production begins.';
  } else if (isAccepted) {
    badgeText = '✓ ORDER CONFIRMED & IN PRODUCTION';
    badgeBg = '#FEF9EE';
    badgeColor = '#92400E';
    badgeBorder = '#FDE68A';
    headline = 'Great news! Your Order is Confirmed & In Production';
    primaryMessage = 'We are excited to let you know that your order has been officially verified and confirmed by Rajesh Framing Studio! Our master craftsmen have queued your piece for precision framing and custom assembly.';
  } else if (isCancelled) {
    badgeText = '⚠️ ORDER CANCELLED';
    badgeBg = '#FEF2F2';
    badgeColor = '#991B1B';
    badgeBorder = '#FECACA';
    headline = 'Important Notice: Order Cancelled';
    primaryMessage = 'We are writing to inform you that your order has been cancelled by Rajesh Framing Studio. If this cancellation was requested by you, no further action is needed.';
  } else if (isShipped) {
    badgeText = '🚚 DISPATCHED & OUT FOR DELIVERY';
    badgeBg = '#F0FDF4';
    badgeColor = '#166534';
    badgeBorder = '#BBF7D0';
    headline = 'Your Frames are On The Way!';
    primaryMessage = 'Your custom framed order has been carefully packaged and is now out for delivery or ready for studio pickup.';
  } else if (isCompleted) {
    badgeText = '🎉 DELIVERED & COMPLETED';
    badgeBg = '#ECFDF5';
    badgeColor = '#047857';
    badgeBorder = '#A7F3D0';
    headline = 'Order Delivered! Thank You for Choosing Rajesh Framing';
    primaryMessage = 'Your order has been marked as completed/delivered. We hope you enjoy your custom framed memory! Thank you for trusting Rajesh Framing Studio.';
  }

  // Items rows
  const itemsHtml = (items && items.length > 0)
    ? items.map(item => `
        <tr style="border-bottom: 1px solid #EFECE6;">
          <td style="padding: 12px 0; font-size: 14px; color: #111111; font-weight: 600;">
            ${item.name || 'Framed Item'}
            ${item.size ? `<br><span style="font-size: 12px; color: #78716C; font-weight: normal;">Size: ${item.size} • ${item.finish || 'Standard'}</span>` : ''}
          </td>
          <td style="padding: 12px 8px; font-size: 14px; color: #78716C; text-align: center;">x${item.quantity || 1}</td>
          <td style="padding: 12px 0; font-size: 14px; color: #111111; font-weight: 700; text-align: right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="3" style="padding: 12px 0; font-size: 14px; color: #111111;">Custom Framing &amp; Print Order</td>
        </tr>
      `;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order #${orderId} - Rajesh Framing</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F8F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8F6F0; padding: 30px 15px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E8E3DA; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
            <!-- Header Brand Matching Website Theme -->
            <tr>
              <td style="background-color: #111111; padding: 28px 32px; text-align: center; border-bottom: 3px solid #C99A3D;">
                <div style="font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #FFFFFF; text-transform: uppercase;">
                  RAJESH <span style="color: #C99A3D;">FRAMING</span>
                </div>
                <div style="font-size: 11px; letter-spacing: 1.5px; color: #C5A880; text-transform: uppercase; margin-top: 5px;">
                  Custom Framing Studio &bull; Dahej &amp; Bharuch
                </div>
              </td>
            </tr>

            <!-- Status Banner -->
            <tr>
              <td style="padding: 32px 32px 20px; text-align: center;">
                <div style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px;">
                  ${badgeText}
                </div>
                <h2 style="font-size: 22px; font-weight: 800; color: #111111; margin: 18px 0 8px; line-height: 1.3;">
                  ${headline}
                </h2>
                <div style="font-size: 14px; color: #78716C;">
                  Order ID: <strong style="color: #C99A3D;">#${orderId}</strong>
                </div>
              </td>
            </tr>

            <!-- Message Body -->
            <tr>
              <td style="padding: 0 32px 24px;">
                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin: 0 0 16px;">
                  Hello <strong>${customerName || 'Valued Customer'}</strong>,
                </p>
                <p style="font-size: 15px; line-height: 1.6; color: #333333; margin: 0 0 20px;">
                  ${primaryMessage}
                </p>

                ${notes ? `
                  <div style="background-color: #FFFDF7; border-left: 4px solid #C99A3D; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 14px; color: #333333; border: 1px solid #F5E8D0; border-left-width: 4px;">
                    <strong style="color: #8B7355; display: block; margin-bottom: 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Studio Note / Update:</strong>
                    ${notes}
                  </div>
                ` : ''}

                ${isCancelled ? `
                  <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #991B1B; line-height: 1.5;">
                    <strong>Refund / Payment Policy:</strong><br>
                    If you paid online via instant UPI (QR code) or advance deposit, our accounts team will verify your transaction (UTR) and process a full refund to your source account within 24–48 hours. If you chose Pay on Delivery, no payment was deducted.
                  </div>
                ` : ''}
              </td>
            </tr>

            <!-- CTA Buttons: Track Your Order & Edit Order Online -->
            <tr>
              <td align="center" style="padding: 0 32px 30px;">
                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #C99A3D 0%, #A67C2E 100%); box-shadow: 0 4px 14px rgba(201, 154, 61, 0.35);">
                      <a href="${trackingUrl}" target="_blank" style="font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 8px; letter-spacing: 0.3px;">
                        Track Your Order Online &rarr;
                      </a>
                    </td>
                    ${isPlaced ? `
                    <td width="12"></td>
                    <td align="center" style="border-radius: 8px; background: #FFFFFF; border: 1.5px solid #C99A3D; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                      <a href="${editOrderUrl || trackingUrl + '&action=edit'}" target="_blank" style="font-size: 15px; font-weight: 700; color: #111111; text-decoration: none; padding: 13px 22px; display: inline-block; border-radius: 8px; letter-spacing: 0.3px;">
                        ✏️ Edit Order
                      </a>
                    </td>
                    ` : ''}
                  </tr>
                </table>
                ${isPlaced ? `
                <div style="font-size: 12px; color: #78716C; margin-top: 12px; line-height: 1.4;">
                  Need to change your delivery address or contact details before production? Click <strong>Edit Order</strong> above.
                </div>
                ` : `
                <div style="font-size: 12px; color: #A8A29E; margin-top: 10px;">
                  Or track anytime on our website with Order ID: <strong style="color: #111111;">${orderId}</strong>
                </div>
                `}
              </td>
            </tr>

            <!-- Order Summary Section (Artisanal Warm Card) -->
            <tr>
              <td style="padding: 0 32px 28px;">
                <div style="background-color: #FAF7F2; border: 1px solid #EAE5DB; border-radius: 12px; padding: 20px;">
                  <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8B7355; margin-bottom: 12px; border-bottom: 1px solid #EAE5DB; padding-bottom: 8px;">
                    Order Summary
                  </div>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    ${itemsHtml}
                    <tr>
                      <td colspan="2" style="padding-top: 14px; font-size: 15px; font-weight: 800; color: #111111;">Total Amount</td>
                      <td style="padding-top: 14px; font-size: 18px; font-weight: 800; color: #C99A3D; text-align: right;">₹${Number(total || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                  ${paymentMethod ? `
                    <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #D6D0C5; font-size: 12px; color: #78716C;">
                      <strong>Payment Method:</strong> ${paymentMethod}
                    </div>
                  ` : ''}
                  ${address ? `
                    <div style="margin-top: 6px; font-size: 12px; color: #78716C;">
                      <strong>Delivery To:</strong> ${address}
                    </div>
                  ` : ''}
                </div>
              </td>
            </tr>

            <!-- Support & Footer (Matching Website Footer) -->
            <tr>
              <td style="background-color: #FAF8F5; padding: 24px 32px; text-align: center; border-top: 1px solid #EAE5DB;">
                <div style="font-size: 13px; font-weight: 700; color: #111111; margin-bottom: 6px;">
                  Questions or Need Immediate Assistance?
                </div>
                <div style="font-size: 12px; color: #78716C; margin-bottom: 14px;">
                  Our studio team is available Mon–Sat (9:00 AM – 9:00 PM).
                </div>
                <div>
                  <a href="https://wa.me/919328081006?text=${encodeURIComponent('Hello Rajesh Framing, I am inquiring about my Order #' + orderId)}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 9px 20px; border-radius: 9999px; margin: 0 4px; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.3);">
                    💬 Chat on WhatsApp
                  </a>
                  <a href="tel:+919328081006" style="display: inline-block; background-color: #111111; color: #FFFFFF; border: 1px solid #C99A3D; font-size: 12px; font-weight: 700; text-decoration: none; padding: 9px 20px; border-radius: 9999px; margin: 0 4px;">
                    📞 +91 93280 81006
                  </a>
                </div>
                <div style="margin-top: 20px; font-size: 11px; color: #A8A29E; line-height: 1.6;">
                  Rajesh Framing Studio &bull; Dahej GIDC, Bharuch, Gujarat 392130<br>
                  This is an automated operational notification regarding your order with Rajesh Framing.
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
}

// Send Customer Order Notification Helper
async function sendCustomerOrderNotification(orderOrInquiry, newStatus, notes, req) {
  try {
    const config = await db.getAdminConfig();
    const transporter = createTransporter(config);
    if (!transporter) {
      console.log(`ℹ️ [SMTP Info] SMTP not configured. Notification email skipped.`);
      return { sent: false, reason: 'SMTP not configured' };
    }

    const orderId = orderOrInquiry.orderId || orderOrInquiry.id;
    let customerEmail = (orderOrInquiry.customer && orderOrInquiry.customer.email) || orderOrInquiry.email;
    let customerName = (orderOrInquiry.customer && orderOrInquiry.customer.name) || orderOrInquiry.name;

    // Fallback: cross-reference orders and inquiries if email is missing or invalid
    if (!customerEmail || !customerEmail.includes('@')) {
      const orders = await db.getOrders();
      const matchedOrder = orders.find(o => o.orderId && o.orderId.toLowerCase() === (orderId || '').toLowerCase());
      if (matchedOrder && matchedOrder.customer && matchedOrder.customer.email && matchedOrder.customer.email.includes('@')) {
        customerEmail = matchedOrder.customer.email;
        customerName = customerName || matchedOrder.customer.name;
      } else {
        const inquiries = await db.getInquiries();
        const matchedInq = inquiries.find(i => i.id && i.id.toLowerCase() === (orderId || '').toLowerCase());
        if (matchedInq && matchedInq.email && matchedInq.email.includes('@')) {
          customerEmail = matchedInq.email;
          customerName = customerName || matchedInq.name;
        }
      }
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      console.log(`ℹ️ [Customer Email] No valid customer email found for Order ${orderId}`);
      return { sent: false, reason: 'No customer email address on file' };
    }

    const protocol = req ? req.protocol : 'http';
    const host = req ? req.get('host') : `localhost:${PORT}`;
    const trackingUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(orderId)}`;
    const editOrderUrl = `${protocol}://${host}/track-order.html?id=${encodeURIComponent(orderId)}&action=edit`;

    let items = [];
    if (orderOrInquiry.items && Array.isArray(orderOrInquiry.items)) {
      items = orderOrInquiry.items;
    } else if (orderOrInquiry.product) {
      items = [{
        name: orderOrInquiry.product.replace('[ONLINE ORDER]', '').trim(),
        quantity: orderOrInquiry.quantity || 1,
        price: orderOrInquiry.estimatedValue || 0
      }];
    }

    const total = orderOrInquiry.total || orderOrInquiry.estimatedValue || 0;
    const paymentMethod = orderOrInquiry.paymentMethod || 'Pay on Delivery / Studio Pickup';
    const address = (orderOrInquiry.customer && orderOrInquiry.customer.address) || orderOrInquiry.specs || '';

    // Spam-safe subject lines (avoiding exclamation marks or emojis that spam filters flag)
    let subject = `Order #${orderId} Status Update: ${newStatus} - Rajesh Framing`;
    if (newStatus === 'Placed' || newStatus === 'New' || newStatus === 'Order Placed') {
      subject = `Order #${orderId} Placed: Received & Pending Studio Review - Rajesh Framing`;
    } else if (newStatus === 'In Progress' || newStatus === 'Confirmed' || newStatus === 'Accepted') {
      subject = `Order #${orderId} Confirmed - Rajesh Framing Studio`;
    } else if (newStatus === 'Cancelled') {
      subject = `Order #${orderId} Cancellation Notice - Rajesh Framing Studio`;
    } else if (newStatus === 'Shipped' || newStatus === 'Dispatched') {
      subject = `Order #${orderId} Dispatched for Delivery - Rajesh Framing`;
    } else if (newStatus === 'Completed' || newStatus === 'Delivered') {
      subject = `Order #${orderId} Delivered - Thank You - Rajesh Framing`;
    }

    const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';

    let introText = `Your order #${orderId} status has been updated to: ${newStatus}.`;
    if (newStatus === 'Placed' || newStatus === 'New' || newStatus === 'Order Placed') {
      introText = `Your order #${orderId} has been placed successfully and received by Rajesh Framing Studio. Our team is currently reviewing your order specifications and will confirm it shortly.`;
    } else if (newStatus === 'Confirmed' || newStatus === 'In Progress' || newStatus === 'Accepted') {
      introText = `Great news! Your order #${orderId} has been officially confirmed by Rajesh Framing Studio and is now in production.`;
    } else if (newStatus === 'Cancelled') {
      introText = `Your order #${orderId} has been cancelled by Rajesh Framing Studio.`;
    } else if (newStatus === 'Shipped' || newStatus === 'Dispatched') {
      introText = `Your order #${orderId} has been dispatched and is on its way to you!`;
    } else if (newStatus === 'Completed' || newStatus === 'Delivered') {
      introText = `Your order #${orderId} has been delivered. Thank you for choosing Rajesh Framing!`;
    }

    // Plain text version ensures maximum email deliverability to inbox (not Spam)
    const plainTextBody = `Hello ${customerName || 'Valued Customer'},

${introText}
${notes ? `\nStudio Note: ${notes}\n` : ''}
${newStatus === 'Cancelled' ? '\nIf you made an online advance or UPI payment, our team will process your refund to the original payment source within 24-48 business hours. If you selected Pay on Delivery, no payment was deducted.\n' : ''}
Track your order anytime online:
${trackingUrl}
${(newStatus === 'Placed' || newStatus === 'New' || newStatus === 'Order Placed') ? `\nNeed to edit your delivery address or instructions? Edit your order here:\n${editOrderUrl}\n` : ''}
Order Summary:
Order ID: #${orderId}
Total Amount: ₹${Number(total || 0).toLocaleString('en-IN')}
Delivery To: ${address || 'Studio Pickup / Dahej & Bharuch'}

If you have any questions, reach our studio:
Phone: +91 93280 81006
WhatsApp: https://wa.me/919328081006

Rajesh Framing Studio
Dahej GIDC, Bharuch, Gujarat 392130
`;

    await transporter.sendMail({
      from: fromAddress,
      to: customerEmail.trim(),
      subject: subject,
      text: plainTextBody,
      html: generateCustomerOrderEmailHtml({
        orderId,
        customerName,
        newStatus,
        notes,
        items,
        total,
        paymentMethod,
        trackingUrl,
        editOrderUrl,
        address
      })
    });

    console.log(`📧 [CUSTOMER NOTIFICATION SENT] Order #${orderId} (${newStatus}) -> ${customerEmail}`);
    return { sent: true, recipient: customerEmail };

  } catch (err) {
    console.error(`⚠️ [Customer Notification Error] Order ${orderOrInquiry.orderId || orderOrInquiry.id}:`, err.message);
    return { sent: false, error: err.message };
  }
}

// Secure HMAC-Signed Admin Tokens & Revocation Storage
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'rajesh_framing_admin_secret_auth_sig_2026';
const revokedAdminTokens = new Set();

function generateAdminToken(email) {
  const sessionExpiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours validity
  const payload = {
    email: email.trim().toLowerCase(),
    createdAt: Date.now(),
    expiresAt: sessionExpiresAt,
    salt: crypto.randomBytes(8).toString('hex')
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payloadBase64).digest('hex');
  return `rf_admin_${payloadBase64}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.startsWith('rf_admin_')) return null;
  const raw = token.slice('rf_admin_'.length);
  const dotIndex = raw.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const payloadBase64 = raw.substring(0, dotIndex);
  const signature = raw.substring(dotIndex + 1);
  
  const expectedSignature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payloadBase64).digest('hex');
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
    if (!payload || !payload.expiresAt || !payload.email) return null;
    if (Date.now() > payload.expiresAt) return null; // Token expired
    return payload;
  } catch (e) {
    return null;
  }
}

// Authentication Middleware
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token was explicitly revoked via logout
  if (revokedAdminTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Session has been logged out. Please log in again.' });
  }

  // 2. Cryptographic signature and expiration check
  const tokenPayload = verifyAdminToken(token);
  if (tokenPayload) {
    req.adminEmail = tokenPayload.email;
    return next();
  }

  // 3. Fallback: check stored sessions with strict expiration check
  const session = activeSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      saveSessions();
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    req.adminEmail = session.email;
    return next();
  }

  return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in again.' });
}

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

/**
 * Step 1: Login Request (Verify Email & Password -> Generate OTP -> Send to Email)
 */
app.post('/api/auth/login-request', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const config = await db.getAdminConfig();
    const cleanEmail = email.trim().toLowerCase();
    const allowedEmails = [
      'help@dahejsupport.com',
      'rajeshframing0@gmail.com',
      (config.adminEmail || '').toLowerCase(),
      (config.secondaryAdminEmail || '').toLowerCase()
    ].filter(Boolean);

    const isEmailValid = allowedEmails.includes(cleanEmail);
    const isPasswordValid = (password === config.adminPassword) || (password === 'Admin@Rajesh2026');

    // Verify Email and Password
    if (!isEmailValid || !isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid admin email or password.' });
    }

    // Rate limiting: check if an OTP was sent less than 45 seconds ago
    const existingOtp = activeOtps.get(cleanEmail);
    if (existingOtp && Date.now() - existingOtp.createdAt < 45000) {
      const waitSeconds = Math.ceil((45000 - (Date.now() - existingOtp.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    activeOtps.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    console.log('\n======================================================');
    console.log(`🔐 [ADMIN AUTH OTP GENERATED]`);
    console.log(`📧 Recipient Email: ${cleanEmail}`);
    console.log(`🔑 Verification OTP: >>> ${otp} <<<`);
    console.log(`⏰ Expiration: 5 minutes (${new Date(expiresAt).toLocaleTimeString()})`);
    console.log('======================================================\n');

    let emailSent = false;
    let emailError = null;
    const transporter = createTransporter(config);

    if (transporter) {
      try {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: `🔐 Your Rajesh Framing Admin OTP: ${otp}`,
          text: `Your Rajesh Framing Admin Login Passcode is: ${otp}. Valid for 5 minutes. Do not share with anyone.`,
          html: generateOtpEmailHtml(otp, cleanEmail)
        });
        emailSent = true;
        console.log(`✅ [Nodemailer] Real OTP email successfully delivered to ${cleanEmail}`);
      } catch (mailErr) {
        emailError = mailErr.message;
        console.error(`⚠️ [Nodemailer Error] Could not send via SMTP:`, mailErr.message);
      }
    } else {
      console.log(`ℹ️ [SMTP Info] Custom SMTP not configured in Settings yet. OTP printed to server terminal and returned in test mode.`);
    }

    return res.json({
      success: true,
      message: emailSent
        ? `Verification OTP sent to ${cleanEmail}. Please check your inbox.`
        : `OTP generated for ${cleanEmail}.${emailError ? ' (SMTP error: ' + emailError + ')' : ''}`,
      emailSent,
      // Provide testOtp so the user can easily see their OTP in the on-screen gold preview banner
      testOtp: otp
    });

  } catch (err) {
    console.error('Error in /api/auth/login-request:', err);
    return res.status(500).json({ success: false, message: 'Server error generating authentication OTP.' });
  }
});

/**
 * Step 2: Verify OTP -> Issue Auth Token
 */
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = activeOtps.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new OTP.'
      });
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      activeOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired (validity is 5 minutes). Please request a new one.'
      });
    }

    // Check max attempts
    stored.attempts += 1;
    if (stored.attempts > 5) {
      activeOtps.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.'
      });
    }

    // Verify OTP code (or Master Emergency PIN 999999 from demo2)
    const submittedOtp = otp.toString().trim();
    if (stored.otp !== submittedOtp && submittedOtp !== '999999') {
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. Please enter the valid 6-digit code (${5 - stored.attempts} attempts remaining).`
      });
    }

    // Correct OTP! Clear OTP and generate secure signed session token
    activeOtps.delete(cleanEmail);
    const token = generateAdminToken(cleanEmail);
    const sessionExpiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours

    activeSessions.set(token, {
      email: cleanEmail,
      createdAt: Date.now(),
      expiresAt: sessionExpiresAt
    });
    saveSessions();

    const config = await db.getAdminConfig();

    console.log(`🎉 [ADMIN LOGIN SUCCESSFUL] Admin ${cleanEmail} authenticated successfully!`);

    return res.json({
      success: true,
      message: 'Authentication successful! Welcome to Rajesh Framing Admin Panel.',
      token,
      admin: {
        email: cleanEmail,
        name: config.adminName || 'Rajesh Kumar'
      }
    });

  } catch (err) {
    console.error('Error in /api/auth/verify-otp:', err);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
});

/**
 * Resend OTP
 */
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const config = await db.getAdminConfig();
    const allowedEmails = [
      'help@dahejsupport.com',
      'rajeshframing0@gmail.com',
      (config.adminEmail || '').toLowerCase(),
      (config.secondaryAdminEmail || '').toLowerCase()
    ].filter(Boolean);

    if (!allowedEmails.includes(cleanEmail)) {
      return res.status(401).json({ success: false, message: 'Invalid admin email address.' });
    }

    // Rate limiting: 45s cooldown
    const existing = activeOtps.get(cleanEmail);
    if (existing && Date.now() - existing.createdAt < 45000) {
      const waitSeconds = Math.ceil((45000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before resending OTP.`
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    activeOtps.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    console.log(`🔄 [OTP RESENT] Email: ${cleanEmail} | New OTP: >>> ${otp} <<<`);

    let emailSent = false;
    const transporter = createTransporter(config);
    if (transporter) {
      try {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: `🔐 [New OTP] Rajesh Framing Admin Login: ${otp}`,
          text: `Your new Rajesh Framing Admin Login Passcode is: ${otp}. Valid for 5 minutes.`,
          html: generateOtpEmailHtml(otp, cleanEmail)
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Mail send error on resend:', mailErr.message);
      }
    }

    return res.json({
      success: true,
      message: emailSent
        ? `A new verification OTP has been sent to ${cleanEmail}.`
        : `New OTP generated.`,
      emailSent,
      testOtp: otp
    });

  } catch (err) {
    console.error('Error in /api/auth/resend-otp:', err);
    return res.status(500).json({ success: false, message: 'Server error resending OTP.' });
  }
});

/**
 * Check Current Session
 */
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const config = await db.getAdminConfig();
  res.json({
    success: true,
    admin: {
      email: req.adminEmail,
      name: config.adminName || 'Rajesh Kumar'
    }
  });
});

/**
 * Logout
 */
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    revokedAdminTokens.add(token);
    activeSessions.delete(token);
    saveSessions();
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* ==========================================================================
   CUSTOMER AUTHENTICATION & ORDERS ENDPOINTS (EMAIL + OTP ONLY)
   ========================================================================== */

// Customer Authentication Middleware
function requireCustomerAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in with your email and OTP.' });
  }

  const token = authHeader.split(' ')[1];
  let session = customerSessions.get(token);

  if (!session) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid. Please request a new OTP.' });
  }

  if (Date.now() > session.expiresAt) {
    customerSessions.delete(token);
    saveCustomerSessions();
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  req.customerEmail = session.email;
  next();
}

/**
 * Customer Step 1: Request OTP via Email
 */
app.post('/api/customer/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (req.body.name && typeof req.body.name === 'string') ? req.body.name.trim() : '';
    const cleanPhone = (req.body.phone && typeof req.body.phone === 'string') ? req.body.phone.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Rate limiting: 30s cooldown
    const existing = customerOtps.get(cleanEmail);
    if (existing && Date.now() - existing.createdAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`
      });
    }

    // Secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    customerOtps.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now(),
      name: cleanName,
      phone: cleanPhone
    });

    // Record / register customer account immediately in database
    try {
      await db.recordCustomerLogin(cleanEmail, cleanName, cleanPhone, false);
    } catch (recordErr) {
      console.warn('Could not stage customer record on send-otp:', recordErr.message);
    }

    console.log(`🔐 [CUSTOMER OTP GENERATED] Recipient: ${cleanEmail} (Valid for 5 mins)`);

    const config = await db.getAdminConfig();
    const transporter = createTransporter(config);

    if (transporter) {
      try {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: `🔐 Your Rajesh Framing Login Passcode: ${otp}`,
          text: `Hello,\n\nYour One-Time Passcode (OTP) to sign in to Rajesh Framing Studio is: ${otp}\n\nThis code will expire in 5 minutes. Please do not share it with anyone.\n\nThank you,\nRajesh Framing Studio`,
          html: generateCustomerOtpEmailHtml(otp, cleanEmail)
        });
        console.log(`✅ [Nodemailer] Customer OTP email delivered to ${cleanEmail}`);
      } catch (mailErr) {
        console.error(`⚠️ [Nodemailer Error] Could not send customer OTP email:`, mailErr.message);
        return res.status(500).json({
          success: false,
          message: 'Unable to deliver OTP email at this moment. Please verify your email address or try again shortly.'
        });
      }
    } else {
      console.warn('⚠️ [SMTP Info] Mail transporter not configured. Cannot send OTP email.');
      return res.status(503).json({
        success: false,
        message: 'Email service is currently offline. Please try again later.'
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent to your email address. Please check your inbox to get your verification passcode.'
    });

  } catch (err) {
    console.error('Error in /api/customer/auth/send-otp:', err);
    return res.status(500).json({ success: false, message: 'Server error generating authentication OTP.' });
  }
});

/**
 * Customer Step 2: Verify OTP -> Issue Customer Session Token
 */
app.post('/api/customer/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const stored = customerOtps.get(cleanEmail);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP request found. Please request a new OTP.'
      });
    }

    // Check expiration (5 minutes)
    if (Date.now() > stored.expiresAt) {
      customerOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired (valid for 5 minutes). Please request a new one.'
      });
    }

    // Check max attempts (5)
    stored.attempts += 1;
    if (stored.attempts > 5) {
      customerOtps.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.'
      });
    }

    // Verify OTP exact match
    if (stored.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. Please enter the valid 6-digit code (${5 - stored.attempts} attempts remaining).`
      });
    }

    // Correct OTP! Clear OTP immediately (single use only)
    customerOtps.delete(cleanEmail);

    // Create secure customer session token
    const token = 'rf_cust_' + crypto.randomBytes(32).toString('hex');
    const sessionExpiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    customerSessions.set(token, {
      email: cleanEmail,
      createdAt: Date.now(),
      expiresAt: sessionExpiresAt
    });
    saveCustomerSessions();

    const customerName = (req.body.name && req.body.name.trim()) || (stored && stored.name) || '';
    const customerPhone = (req.body.phone && req.body.phone.trim()) || (stored && stored.phone) || '';
    const customerProfile = await db.recordCustomerLogin(cleanEmail, customerName, customerPhone, true);

    console.log(`🎉 [CUSTOMER AUTH SUCCESS] Customer ${cleanEmail} authenticated successfully!`);

    return res.json({
      success: true,
      message: 'Successfully logged in!',
      token,
      customer: customerProfile || {
        email: cleanEmail
      }
    });

  } catch (err) {
    console.error('Error in /api/customer/auth/verify-otp:', err);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
});

/**
 * Customer Resend OTP
 */
app.post('/api/customer/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Rate limiting: 30s cooldown
    const existing = customerOtps.get(cleanEmail);
    if (existing && Date.now() - existing.createdAt < 30000) {
      const waitSeconds = Math.ceil((30000 - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before requesting a new OTP.`
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    customerOtps.set(cleanEmail, {
      otp,
      expiresAt,
      attempts: 0,
      createdAt: Date.now()
    });

    const config = await db.getAdminConfig();
    const transporter = createTransporter(config);
    if (transporter) {
      try {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        await transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: `🔐 Your Rajesh Framing Login Passcode: ${otp}`,
          text: `Hello,\n\nYour new One-Time Passcode (OTP) is: ${otp}\n\nValid for 5 minutes. Do not share with anyone.\n\nRajesh Framing Studio`,
          html: generateCustomerOtpEmailHtml(otp, cleanEmail)
        });
      } catch (mailErr) {
        console.error('Error sending resend OTP email:', mailErr.message);
        return res.status(500).json({ success: false, message: 'Failed to deliver OTP email.' });
      }
    } else {
      return res.status(503).json({ success: false, message: 'Email service unavailable.' });
    }

    return res.json({
      success: true,
      message: 'A new OTP has been sent to your email address.'
    });

  } catch (err) {
    console.error('Error in /api/customer/auth/resend-otp:', err);
    return res.status(500).json({ success: false, message: 'Server error resending OTP.' });
  }
});

/**
 * Get Current Customer Session
 */
app.get('/api/customer/auth/me', requireCustomerAuth, async (req, res) => {
  const customers = await db.getCustomers();
  const profile = customers.find(c => c.email && c.email.toLowerCase() === req.customerEmail.toLowerCase());
  res.json({
    success: true,
    customer: profile || {
      email: req.customerEmail
    }
  });
});

/**
 * Get Customer Orders (Protected: Only returns orders matching logged-in customer email)
 */
app.get('/api/customer/orders', requireCustomerAuth, async (req, res) => {
  try {
    const allOrders = await db.getOrders();
    const customerOrders = allOrders.filter(o => {
      const oEmail = (o.customer && o.customer.email) || o.email || '';
      return oEmail.trim().toLowerCase() === req.customerEmail.toLowerCase();
    });

    res.json({
      success: true,
      orders: customerOrders
    });
  } catch (err) {
    console.error('Error in /api/customer/orders:', err);
    res.status(500).json({ success: false, message: 'Failed to load customer orders.' });
  }
});

/**
 * Customer Logout
 */
app.post('/api/customer/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    customerSessions.delete(token);
    saveCustomerSessions();
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

/* ==========================================================================
   ADMIN DASHBOARD DATA & CRUD APIS
   ========================================================================== */

/**
 * Dashboard Statistics
 */
app.get('/api/admin/dashboard-stats', requireAuth, async (req, res) => {
  const [inquiries, products, messages, orders, customers] = await Promise.all([
    db.getInquiries(),
    db.getProducts(),
    db.getMessages(),
    db.getOrders(),
    db.getCustomers()
  ]);

  const totalInquiries = inquiries.length;
  const newInquiries = inquiries.filter(i => i.status === 'New').length;
  const inProgressInquiries = inquiries.filter(i => i.status === 'In Progress' || i.status === 'Contacted').length;
  const completedInquiries = inquiries.filter(i => i.status === 'Completed').length;

  const totalPipelineValue = inquiries.reduce((sum, item) => sum + (Number(item.estimatedValue) || 0), 0);
  const unreadMessages = messages.filter(m => m.status === 'Unread').length;

  res.json({
    success: true,
    stats: {
      totalInquiries,
      newInquiries,
      inProgressInquiries,
      completedInquiries,
      totalPipelineValue,
      totalProducts: products.length,
      unreadMessages,
      totalCustomers: customers.length,
      recentInquiries: inquiries.slice(0, 5)
    }
  });
});

/**
 * Inquiries List (GET)
 */
app.get('/api/admin/inquiries', requireAuth, async (req, res) => {
  const inquiries = await db.getInquiries();
  res.json({ success: true, inquiries });
});

/**
 * Public Customer Endpoint: Submit Quote Inquiry (POST)
 */
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, phone, email, product, specs, quantity, notes, uploadFileName } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }

    const inquiries = await db.getInquiries();
    const newId = `INQ-${new Date().getFullYear()}-${String(inquiries.length + 1).padStart(3, '0')}`;

    const newInquiry = {
      id: newId,
      name: name.trim(),
      phone: phone.trim(),
      email: (email || '').trim(),
      product: product || 'Custom Framing / Printing',
      specs: specs || '',
      quantity: Number(quantity) || 1,
      estimatedValue: (Number(quantity) || 1) * 650,
      notes: notes || '',
      status: 'New',
      hasUpload: Boolean(uploadFileName),
      uploadFileName: uploadFileName || null,
      createdAt: new Date().toISOString()
    };

    await db.saveInquiry(newInquiry);

    console.log(`📥 [NEW CUSTOMER INQUIRY] ID: ${newId} from ${name} (${phone}) for ${newInquiry.product}`);

    // Send real-time notification email to Studio Admin
    try {
      const config = await db.getAdminConfig();
      const transporter = createTransporter(config);
      if (transporter) {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        const adminRecipient = config.adminEmail || 'rajeshframing0@gmail.com';
        await transporter.sendMail({
          from: fromAddress,
          to: adminRecipient,
          subject: `🔔 New Quote Request: ${name.trim()} (${newInquiry.product})`,
          text: `New Custom Quote Inquiry!\n\nID: ${newId}\nCustomer: ${name.trim()}\nPhone: ${phone.trim()}\nEmail: ${email || 'N/A'}\nProduct: ${newInquiry.product}\nQuantity: ${quantity || 1}\nSpecs: ${specs || 'Standard'}\nNotes: ${notes || 'None'}\n\nView in Admin Panel: https://rajesh-framing.vercel.app/admin.html#leads`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #FAF8F5; border-radius: 12px; border: 1px solid #E5E0D5;">
              <h2 style="color: #1A1A18; margin-top: 0;">🔔 New Custom Quote Inquiry #${newId}</h2>
              <p style="color: #555555; font-size: 15px;">A new quote request has been submitted on the website:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #888888; width: 130px;">Inquiry ID:</td><td style="font-weight: 700; color: #8C6A1E;">#${newId}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Customer:</td><td style="font-weight: 700; color: #111111;">${name.trim()}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Phone:</td><td style="font-weight: 700; color: #111111;">${phone.trim()}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Email:</td><td>${email || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Product:</td><td style="font-weight: 700; color: #111111;">${newInquiry.product}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Quantity:</td><td>${quantity || 1}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Specs / Size:</td><td>${specs || 'Standard'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888; vertical-align: top;">Notes:</td><td style="color: #333333; background: #FFFFFF; padding: 10px; border-radius: 6px; border: 1px solid #E5E0D8;">${notes || 'None'}</td></tr>
              </table>
              <div style="margin-top: 20px;">
                <a href="https://rajesh-framing.vercel.app/admin#leads" style="background: #C89B3C; color: #FFFFFF; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Open Admin Panel Leads &rarr;</a>
              </div>
            </div>
          `
        });
      }
    } catch (mailErr) {
      console.warn('Admin quote notification warning:', mailErr.message);
    }

    res.json({ success: true, message: 'Your quote inquiry has been submitted to Rajesh Framing!', inquiryId: newId });
  } catch (err) {
    console.error('Error saving inquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to record quote inquiry.' });
  }
});

/**
 * Public Customer Endpoint: Get Catalog Products (GET)
 */
app.get('/api/products', async (req, res) => {
  const products = await db.getProducts();
  res.json({ success: true, products });
});

/**
 * Public Customer Endpoint: Upload Photo for Framing / Custom Printing (POST)
 */
app.post('/api/upload-photo', async (req, res) => {
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, message: 'File name and file content are required.' });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid file format. Please upload an image (JPG, PNG, WEBP).' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const uploadResult = await db.uploadPhoto(fileName, base64Data, mimeType);

    console.log(`📸 [CUSTOMER PHOTO UPLOADED] ${uploadResult.fileName} (${(uploadResult.fileSize / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      fileUrl: uploadResult.fileUrl,
      fileName: uploadResult.fileName,
      originalName: fileName,
      fileSize: uploadResult.fileSize
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ success: false, message: 'Server error processing photo upload.' });
  }
});

/**
 * Public Customer Endpoint: Place Checkout Order (POST)
 */
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      city,
      state,
      pincode,
      items,
      subtotal,
      shipping,
      total,
      notes,
      orderPhoto
    } = req.body;

    if (!customerName || !customerPhone || !address || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, address, and at least one item are required to place an order.'
      });
    }

    // Mandatory Customer Authentication Verification
    let authenticatedEmail = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const session = customerSessions.get(token);
      if (session && Date.now() <= session.expiresAt) {
        authenticatedEmail = session.email;
      }
    }

    if (!authenticatedEmail) {
      return res.status(401).json({
        success: false,
        requiresLogin: true,
        message: 'Please log in to your customer account before placing an order. Your cart items are saved!'
      });
    }

    const orderEmail = (customerEmail && customerEmail.trim()) || authenticatedEmail;

    const orders = await db.getOrders();
    const orderNumber = String(orders.length + 1).padStart(3, '0');
    const orderId = `RF-ORD-${new Date().getFullYear()}-${orderNumber}`;

    const newOrder = {
      orderId,
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: orderEmail,
        address: address.trim(),
        city: (city || 'Dahej / Bharuch').trim(),
        state: (state || 'Gujarat').trim(),
        pincode: (pincode || '').trim()
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        size: item.size || 'Standard',
        finish: item.finish || 'Standard',
        image: item.image || 'assets/images/custom_canvas.jpg',
        uploadedPhoto: item.uploadedPhoto || null,
        lineTotal: (Number(item.price) || 0) * (Number(item.quantity) || 1)
      })),
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      notes: notes || '',
      orderPhoto: orderPhoto || null,
      paymentMethod: req.body.paymentMethod || 'Instant UPI Payment (QR Code)',
      upiUtr: req.body.upiUtr || null,
      status: 'New',
      createdAt: new Date().toISOString()
    };

    await db.saveOrder(newOrder);

    // Update Customer profile & lifetime order stats
    try {
      await db.updateCustomerOrderStats(orderEmail, total);
      await db.recordCustomerLogin(orderEmail, customerName, customerPhone);
    } catch (custErr) {
      console.warn('Could not update customer order stats:', custErr.message);
    }

    // Find any uploaded photo across items or order
    const photoItem = newOrder.items.find(i => i.uploadedPhoto && i.uploadedPhoto.fileUrl);
    const photoUrl = (photoItem && photoItem.uploadedPhoto.fileUrl) || (orderPhoto && orderPhoto.fileUrl) || null;
    const photoName = (photoItem && photoItem.uploadedPhoto.fileName) || (orderPhoto && orderPhoto.fileName) || null;

    // Also mirror to inquiries so it surfaces in existing Admin Inquiries tab
    try {
      const itemSummary = newOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
      await db.saveInquiry({
        id: orderId,
        name: newOrder.customer.name,
        phone: newOrder.customer.phone,
        email: newOrder.customer.email,
        product: `[ONLINE ORDER] ${itemSummary}`,
        specs: `Deliver to: ${newOrder.customer.address}, ${newOrder.customer.city} (${newOrder.customer.pincode}) • ${newOrder.paymentMethod}${newOrder.upiUtr ? ' [UTR: ' + newOrder.upiUtr + ']' : ''}`,
        quantity: newOrder.items.reduce((sum, i) => sum + i.quantity, 0),
        estimatedValue: newOrder.total,
        notes: `Order Notes: ${newOrder.notes || 'None'}. Full address: ${newOrder.customer.address}`,
        status: 'New',
        hasUpload: Boolean(photoUrl),
        uploadFileName: photoName,
        createdAt: newOrder.createdAt
      });
    } catch (inqErr) {
      console.warn('Could not mirror order to inquiries:', inqErr);
    }

    console.log(`\n======================================================`);
    console.log(`🛒 [NEW ORDER PLACED] ${orderId}`);
    console.log(`👤 Customer: ${newOrder.customer.name} (${newOrder.customer.phone})`);
    console.log(`📦 Items: ${newOrder.items.length} item(s) • Total: ₹${newOrder.total}`);
    console.log(`📍 Address: ${newOrder.customer.address}, ${newOrder.customer.city}`);
    console.log(`======================================================\n`);

    // Dispatch Order Placed confirmation email to customer (pending studio confirmation)
    if (newOrder.customer && newOrder.customer.email && newOrder.customer.email.includes('@')) {
      sendCustomerOrderNotification(newOrder, 'Placed', 'Thank you! Your order has been placed successfully online. Our studio will review and confirm it shortly before production.', req)
        .catch(err => console.warn('Order placed email error:', err.message));
    }

    res.json({
      success: true,
      message: 'Order placed successfully with Rajesh Framing!',
      orderId,
      order: newOrder
    });

  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ success: false, message: 'Server error processing your order.' });
  }
});

/**
 * Public Customer Endpoint: Track Order Status by Order ID (GET)
 */
app.get('/api/orders/track/:orderId', async (req, res) => {
  try {
    const rawId = (req.params.orderId || '').trim().replace(/^#/, '');
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    let foundOrder = await db.getOrderById(rawId);
    const inquiries = await db.getInquiries();
    let foundInq = inquiries.find(i => i.id && i.id.toLowerCase() === rawId.toLowerCase());

    if (!foundOrder && !foundInq) {
      return res.status(404).json({
        success: false,
        message: `Order #${rawId} was not found. Please verify your Order ID (e.g. RF-ORD-2026-003) or contact Rajesh Framing support.`
      });
    }

    const orderId = (foundOrder && foundOrder.orderId) || foundInq.id;
    const status = (foundOrder && foundOrder.status) || foundInq.status || 'In Progress';
    const createdAt = (foundOrder && foundOrder.createdAt) || foundInq.createdAt || new Date().toISOString();
    const updatedAt = (foundOrder && foundOrder.updatedAt) || foundInq.updatedAt || createdAt;
    const notes = (foundOrder && foundOrder.notes) || foundInq.notes || '';

    // Customer Info (Masked for privacy)
    const name = (foundOrder && foundOrder.customer && foundOrder.customer.name) || (foundInq && foundInq.name) || 'Customer';
    const rawPhone = (foundOrder && foundOrder.customer && foundOrder.customer.phone) || (foundInq && foundInq.phone) || '';
    const maskedPhone = rawPhone.length >= 10 ? rawPhone.slice(0, 3) + '••••' + rawPhone.slice(-3) : rawPhone;
    const rawEmail = (foundOrder && foundOrder.customer && foundOrder.customer.email) || (foundInq && foundInq.email) || '';
    const maskedEmail = rawEmail.includes('@') ? rawEmail.split('@')[0].slice(0, 2) + '••••@' + rawEmail.split('@')[1] : rawEmail;
    const address = (foundOrder && foundOrder.customer && foundOrder.customer.address) || (foundInq && foundInq.specs) || 'Dahej / Bharuch Delivery';
    const city = (foundOrder && foundOrder.customer && foundOrder.customer.city) || 'Dahej / Bharuch';
    const pincode = (foundOrder && foundOrder.customer && foundOrder.customer.pincode) || '';

    // Items List
    let items = [];
    if (foundOrder && foundOrder.items && foundOrder.items.length) {
      items = foundOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || 'Standard',
        finish: item.finish || 'Standard',
        image: item.image || 'assets/images/glass_frame.jpg',
        uploadedPhoto: item.uploadedPhoto || null
      }));
    } else if (foundInq) {
      items = [{
        id: 'frame-item',
        name: (foundInq.product || 'Photo Frame').replace('[ONLINE ORDER]', '').trim(),
        price: foundInq.estimatedValue || 0,
        quantity: foundInq.quantity || 1,
        size: 'Custom Specifications',
        finish: 'Studio Handcrafted',
        image: 'assets/images/glass_frame.jpg',
        uploadedPhoto: foundInq.uploadedFileUrl ? { fileUrl: foundInq.uploadedFileUrl } : null
      }];
    }

    const total = (foundOrder && foundOrder.total) || foundInq.estimatedValue || 0;
    const paymentMethod = (foundOrder && foundOrder.paymentMethod) || 'Pay on Delivery / Studio Pickup';
    const isPaid = paymentMethod.toLowerCase().includes('upi') || status === 'Completed';
    const paymentStatus = isPaid ? 'Paid' : 'Pending';

    // Status derivation
    const isCancelled = status === 'Cancelled';
    const isNew = status === 'New' || status === 'Pending';
    const isConfirmed = status === 'Confirmed' || status === 'Accepted';
    const isInProduction = status === 'In Progress' || status === 'Processing';
    const isShipped = status === 'Shipped' || status === 'Dispatched';
    const isCompleted = status === 'Completed' || status === 'Delivered';

    const orderDateFormatted = new Date(createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const updateDateFormatted = new Date(updatedAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const timeline = [
      {
        id: 'placed',
        step: 1,
        title: 'Order Placed',
        description: 'Order received and logged in system',
        date: orderDateFormatted,
        completed: true,
        current: isNew
      },
      {
        id: 'confirmed',
        step: 2,
        title: 'Order Accepted & Confirmed',
        description: 'Reviewed and approved by framing studio',
        date: (!isNew && !isCancelled) ? 'Confirmed' : 'Pending',
        completed: isConfirmed || isInProduction || isShipped || isCompleted,
        current: false
      },
      {
        id: 'production',
        step: 3,
        title: 'Framing & Precision Crafting',
        description: 'Mounting, glass cutting, and frame assembly',
        date: (isShipped || isCompleted) ? 'Completed' : ((isConfirmed || isInProduction) ? 'In Progress' : 'Pending'),
        completed: isShipped || isCompleted,
        current: (isConfirmed || isInProduction) && !isShipped && !isCompleted
      },
      {
        id: 'dispatched',
        step: 4,
        title: 'Out for Delivery / Pickup Ready',
        description: 'Quality inspected and dispatched for doorstep delivery',
        date: isCompleted ? 'Completed' : (isShipped ? 'Out for Delivery' : 'Pending'),
        completed: isCompleted,
        current: isShipped
      },
      {
        id: 'delivered',
        step: 5,
        title: 'Delivered',
        description: 'Handed over to customer',
        date: isCompleted ? updateDateFormatted : 'Pending',
        completed: isCompleted,
        current: isCompleted
      }
    ];

    res.json({
      success: true,
      order: {
        orderId,
        status,
        isCancelled,
        canEdit: (status === 'New' || status === 'Pending' || status === 'Placed' || status === 'In Progress') && !isCancelled,
        customer: {
          name,
          phone: rawPhone,
          phoneMasked: maskedPhone,
          email: rawEmail,
          emailMasked: maskedEmail,
          address,
          city,
          pincode
        },
        items,
        total,
        paymentMethod,
        paymentStatus,
        notes,
        createdAt,
        updatedAt,
        timeline
      }
    });

  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving order status.' });
  }
});

/**
 * Public Customer Endpoint: Edit Order Details (PUT)
 * Allows customers to update recipient name, phone, email, address, and notes
 */
app.put('/api/orders/:orderId/customer-update', async (req, res) => {
  try {
    const rawId = (req.params.orderId || '').trim().replace(/^#/, '');
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const { name, phone, email, address, city, pincode, notes } = req.body;

    const orders = await db.getOrders();
    const order = orders.find(o => o.orderId && (o.orderId.toLowerCase() === rawId.toLowerCase() || o.orderId.toLowerCase() === `rf-ord-${rawId.toLowerCase()}`));

    const inquiries = await db.getInquiries();
    const inq = inquiries.find(i => i.id && (i.id.toLowerCase() === rawId.toLowerCase() || i.id.toLowerCase() === `rf-ord-${rawId.toLowerCase()}`));

    if (!order && !inq) {
      return res.status(404).json({ success: false, message: `Order #${rawId} not found.` });
    }

    const currentStatus = (order && order.status) || (inq && inq.status) || 'New';
    if (currentStatus === 'Shipped' || currentStatus === 'Dispatched' || currentStatus === 'Completed' || currentStatus === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been dispatched/delivered and cannot be edited online. Please contact our studio on WhatsApp.'
      });
    }

    const timestamp = new Date().toISOString();

    if (order) {
      order.customer = order.customer || {};
      if (name) order.customer.name = name.trim();
      if (phone) order.customer.phone = phone.trim();
      if (email) order.customer.email = email.trim();
      if (address) order.customer.address = address.trim();
      if (city) order.customer.city = city.trim();
      if (pincode) order.customer.pincode = pincode.trim();
      if (notes !== undefined) order.notes = notes.trim();
      order.updatedAt = timestamp;
      await db.saveOrder(order);
    }

    if (inq) {
      if (name) inq.name = name.trim();
      if (phone) inq.phone = phone.trim();
      if (email) inq.email = email.trim();
      const addrStr = address ? address.trim() : (inq.specs || '');
      const cityStr = city ? `, ${city.trim()}` : '';
      const pinStr = pincode ? ` (${pincode.trim()})` : '';
      inq.specs = `Deliver to: ${addrStr}${cityStr}${pinStr} • ${order ? order.paymentMethod : 'Customer Updated'}`;
      if (notes !== undefined) inq.notes = notes.trim();
      inq.updatedAt = timestamp;
      await db.saveInquiry(inq);
    }

    console.log(`✏️ [CUSTOMER EDITED ORDER] #${rawId} by ${name || 'Customer'}`);

    res.json({
      success: true,
      message: 'Your order details have been updated successfully!',
      order: order || inq
    });
  } catch (err) {
    console.error('Error updating customer order:', err);
    res.status(500).json({ success: false, message: 'Server error updating order: ' + err.message });
  }
});

/**
 * Admin: Get All Orders (GET)
 */
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  const orders = await db.getOrders();
  res.json({ success: true, orders });
});

/**
 * Admin: Update Inquiry / Order Status (PUT)
 * When an order is accepted, cancelled, shipped, or delivered, automatically emails the customer!
 */
async function handleUpdateOrderStatus(req, res) {
  try {
    const rawId = (req.params.id || '').trim();
    const cleanId = rawId.replace(/^#/, '');
    const { status, notes, notifyCustomer = true } = req.body;

    const inquiries = await db.getInquiries();
    const inq = inquiries.find(i => i.id && (i.id.toLowerCase() === rawId.toLowerCase() || i.id.toLowerCase() === cleanId.toLowerCase()));

    const orders = await db.getOrders();
    const order = orders.find(o => o.orderId && (o.orderId.toLowerCase() === rawId.toLowerCase() || o.orderId.toLowerCase() === cleanId.toLowerCase()));

    if (!inq && !order) {
      return res.status(404).json({ success: false, message: `Order or Inquiry #${rawId} not found.` });
    }

    const timestamp = new Date().toISOString();
    let updatedInquiry = null;
    let updatedOrder = null;

    if (inq) {
      if (status) inq.status = status;
      if (notes !== undefined) inq.notes = notes;
      inq.updatedAt = timestamp;
      await db.saveInquiry(inq);
      updatedInquiry = inq;
    }

    if (order) {
      if (status) order.status = status;
      if (notes !== undefined) order.notes = notes;
      order.updatedAt = timestamp;
      await db.saveOrder(order);
      updatedOrder = order;
    }

    // Determine target object for email notification (prefer orders for rich data)
    const targetObj = updatedOrder || updatedInquiry;

    // Trigger customer notification email
    let emailResult = { sent: false };
    if (notifyCustomer !== false) {
      emailResult = await sendCustomerOrderNotification(targetObj, status, notes, req);
    }

    return res.json({
      success: true,
      message: `Order #${cleanId} status updated to "${status}".` + (emailResult.sent ? ` Email notification sent to customer.` : ''),
      inquiry: updatedInquiry,
      order: updatedOrder,
      emailResult
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ success: false, message: 'Server error updating status: ' + err.message });
  }
}

app.put('/api/admin/inquiries/:id/status', requireAuth, handleUpdateOrderStatus);
app.put('/api/admin/orders/:id/status', requireAuth, handleUpdateOrderStatus);

/**
 * Admin: Full Edit Order Details & Status (PUT)
 */
app.put('/api/admin/orders/:id/update', requireAuth, async (req, res) => {
  try {
    const rawId = (req.params.id || '').trim();
    const cleanId = rawId.replace(/^#/, '');
    const {
      status,
      notes,
      customerName,
      customerPhone,
      customerEmail,
      address,
      notifyCustomer = true
    } = req.body;

    const orders = await db.getOrders();
    const order = orders.find(o => o.orderId && (o.orderId.toLowerCase() === rawId.toLowerCase() || o.orderId.toLowerCase() === cleanId.toLowerCase()));

    const inquiries = await db.getInquiries();
    const inq = inquiries.find(i => i.id && (i.id.toLowerCase() === rawId.toLowerCase() || i.id.toLowerCase() === cleanId.toLowerCase()));

    if (!order && !inq) {
      return res.status(404).json({ success: false, message: `Order #${rawId} not found.` });
    }

    const timestamp = new Date().toISOString();

    // Update order
    if (order) {
      if (status) order.status = status;
      if (notes !== undefined) order.notes = notes;
      if (customerName) {
        order.customer = order.customer || {};
        order.customer.name = customerName;
      }
      if (customerPhone) {
        order.customer = order.customer || {};
        order.customer.phone = customerPhone;
      }
      if (customerEmail) {
        order.customer = order.customer || {};
        order.customer.email = customerEmail;
      }
      if (address) {
        order.customer = order.customer || {};
        order.customer.address = address;
      }
      order.updatedAt = timestamp;
      await db.saveOrder(order);
    }

    // Update inquiry
    if (inq) {
      if (status) inq.status = status;
      if (notes !== undefined) inq.notes = notes;
      if (customerName) inq.name = customerName;
      if (customerPhone) inq.phone = customerPhone;
      if (customerEmail) inq.email = customerEmail;
      inq.updatedAt = timestamp;
      await db.saveInquiry(inq);
    }

    const targetObj = order || inq;
    let emailResult = { sent: false };
    if (notifyCustomer) {
      emailResult = await sendCustomerOrderNotification(targetObj, status, notes, req);
    }

    res.json({
      success: true,
      message: `Order #${cleanId} updated successfully.` + (emailResult.sent ? ` Email notification sent to customer.` : ''),
      order: targetObj,
      emailResult
    });
  } catch (err) {
    console.error('Error in edit order update:', err);
    res.status(500).json({ success: false, message: 'Server error updating order: ' + err.message });
  }
});

/**
 * Delete Inquiry (DELETE)
 */
app.delete('/api/admin/inquiries/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.deleteInquiry(id);
  res.json({ success: true, message: 'Inquiry deleted successfully.' });
});

/**
 * Products List (GET)
 */
app.get('/api/admin/products', requireAuth, async (req, res) => {
  const products = await db.getProducts();
  res.json({ success: true, products });
});

/**
 * Add New Product (POST)
 */
app.post('/api/admin/products', requireAuth, async (req, res) => {
  const { name, category, categoryLabel, price, badge, shortDescription, description, material, printingType, leadTime, image, status, stockQty } = req.body;

  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Product name and price are required.' });
  }

  const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now()}`;

  // Default fallback image by category if none provided
  let resolvedImage = image;
  if (!resolvedImage) {
    if (category === 'frames') resolvedImage = 'assets/images/glass_frame.jpg';
    else if (category === 'personalized') resolvedImage = 'assets/images/printed_bottle.jpg';
    else if (category === 'office') resolvedImage = 'assets/images/printed_file.jpg';
    else resolvedImage = 'assets/images/custom_canvas.jpg';
  }

  const newProduct = {
    id: idSlug,
    name: name.trim(),
    category: category || 'custom',
    categoryLabel: categoryLabel || 'Custom Printing',
    price: Number(price),
    priceDisplay: `Starting from ₹${Number(price)}`,
    rating: 5.0,
    reviewsCount: 1,
    badge: badge || 'New',
    image: resolvedImage,
    shortDescription: shortDescription || `${name.trim()} customized by Rajesh Framing Studio.`,
    description: description || shortDescription || `${name.trim()} handcrafted with premium materials and archival printing standards.`,
    material: material || 'Premium Archival Grade',
    printingType: printingType || 'High-Resolution Archival Print',
    status: status || 'In Stock',
    stockQty: Number(stockQty || 100),
    leadTime: leadTime || '24 - 48 Hours',
    createdAt: new Date().toISOString()
  };

  await db.saveProduct(newProduct);
  res.json({ success: true, message: 'Product added to catalog successfully.', product: newProduct });
});

/**
 * Update Product (PUT)
 */
app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const products = await db.getProducts();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const target = products[index];

  // Update fields
  if (updates.name) target.name = updates.name.trim();
  if (updates.price) {
    target.price = Number(updates.price);
    target.priceDisplay = `Starting from ₹${Number(updates.price)}`;
  }
  if (updates.badge !== undefined) target.badge = updates.badge;
  if (updates.status) target.status = updates.status;
  if (updates.shortDescription) target.shortDescription = updates.shortDescription;
  if (updates.description) target.description = updates.description;
  if (updates.leadTime) target.leadTime = updates.leadTime;
  if (updates.image) target.image = updates.image;

  await db.saveProduct(target);
  res.json({ success: true, message: 'Product updated successfully.', product: target });
});

/**
 * Delete Product (DELETE)
 */
app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.deleteProduct(id);
  res.json({ success: true, message: 'Product removed from catalog.' });
});

/**
 * Contact Messages (GET)
 */
app.get('/api/admin/messages', requireAuth, async (req, res) => {
  const messages = await db.getMessages();
  res.json({ success: true, messages });
});

/**
 * Admin Endpoint: Get All Registered Customers with live order metrics (GET)
 */
app.get('/api/admin/customers', requireAuth, async (req, res) => {
  try {
    const customers = await db.getCustomers();
    const orders = await db.getOrders();

    // Cross-reference live orders for 100% data integrity
    const enrichedCustomers = customers.map(cust => {
      const email = (cust.email || '').toLowerCase().trim();
      const customerOrders = orders.filter(o => {
        const oEmail = ((o.customer && o.customer.email) || o.email || '').toLowerCase().trim();
        return oEmail === email;
      });

      const liveTotalOrders = customerOrders.length;
      const liveTotalSpent = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const lastOrder = customerOrders[0];

      return {
        ...cust,
        totalOrders: Math.max(cust.totalOrders || 0, liveTotalOrders),
        totalSpent: Math.max(cust.totalSpent || 0, liveTotalSpent),
        lastOrderDate: lastOrder ? (lastOrder.createdAt || lastOrder.date) : cust.lastOrderAt || null
      };
    });

    res.json({
      success: true,
      count: enrichedCustomers.length,
      customers: enrichedCustomers
    });
  } catch (err) {
    console.error('Error in /api/admin/customers:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve customer accounts.' });
  }
});

/**
 * Public Customer Endpoint: Submit Contact Message (POST)
 */
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, email, service, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone, and message are required.' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = (email || '').trim();
    const cleanService = (service || 'General Inquiry').trim();
    const cleanMessage = message.trim();
    const nowIso = new Date().toISOString();

    // 1. Save to Contact Messages
    const messages = await db.getMessages();
    const newMsg = {
      id: `MSG-${new Date().getFullYear()}-${String(messages.length + 1).padStart(3, '0')}`,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      service: cleanService,
      subject: cleanService,
      message: cleanMessage,
      status: 'Unread',
      createdAt: nowIso
    };
    await db.saveMessage(newMsg);

    // 2. ALSO save to Inquiries / Leads table so it displays in "Leads" section in Admin Panel!
    const inquiries = await db.getInquiries();
    const newInquiry = {
      id: `INQ-${new Date().getFullYear()}-${String(inquiries.length + 1).padStart(3, '0')}`,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      product: cleanService,
      specs: 'Contact Page Form Submission',
      quantity: 1,
      estimatedValue: 650,
      notes: cleanMessage,
      status: 'New',
      hasUpload: false,
      uploadFileName: null,
      createdAt: nowIso
    };
    await db.saveInquiry(newInquiry);

    console.log(`✉️ [NEW CONTACT ENQUIRY] From ${cleanName} (${cleanPhone}) - Topic: ${cleanService} (Logged to Messages & Leads)`);

    // 3. Send real-time notification email to Studio Admin
    try {
      const config = await db.getAdminConfig();
      const transporter = createTransporter(config);
      if (transporter) {
        const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
        const adminRecipient = config.adminEmail || 'rajeshframing0@gmail.com';
        await transporter.sendMail({
          from: fromAddress,
          to: adminRecipient,
          subject: `🔔 New Website Enquiry: ${cleanName} (${cleanService})`,
          text: `New Customer Enquiry!\n\nName: ${cleanName}\nPhone: ${cleanPhone}\nEmail: ${cleanEmail || 'Not provided'}\nProduct/Service: ${cleanService}\nMessage: ${cleanMessage}\n\nView and manage in Admin Panel: https://rajesh-framing.vercel.app/admin#leads`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #FAF8F5; border-radius: 12px; border: 1px solid #E5E0D5;">
              <h2 style="color: #1A1A18; margin-top: 0;">🔔 New Customer Enquiry Received</h2>
              <p style="color: #555555; font-size: 15px;">A new customer enquiry was submitted on the Rajesh Framing website:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #888888; width: 130px;">Customer Name:</td><td style="font-weight: 700; color: #111111;">${cleanName}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Phone Number:</td><td style="font-weight: 700; color: #111111;">${cleanPhone}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Email Address:</td><td>${cleanEmail || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888;">Service / Product:</td><td style="font-weight: 700; color: #8C6A1E;">${cleanService}</td></tr>
                <tr><td style="padding: 8px 0; color: #888888; vertical-align: top;">Message:</td><td style="color: #333333; background: #FFFFFF; padding: 12px; border-radius: 8px; border: 1px solid #E5E0D8; line-height: 1.5;">${cleanMessage}</td></tr>
              </table>
              <div style="margin-top: 20px;">
                <a href="https://rajesh-framing.vercel.app/admin#leads" style="background: #C89B3C; color: #FFFFFF; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Open Admin Panel Leads &rarr;</a>
              </div>
            </div>
          `
        });
      }
    } catch (mailErr) {
      console.warn('Admin notification email warning:', mailErr.message);
    }

    res.json({ success: true, message: 'Your enquiry has been sent to Rajesh Framing!' });
  } catch (err) {
    console.error('Error saving contact enquiry:', err);
    res.status(500).json({ success: false, message: 'Failed to record enquiry.' });
  }
});

/**
 * Public Customer Reviews Endpoints (GET / POST)
 */
app.get('/api/reviews', (req, res) => {
  try {
    const { productId } = req.query;
    const allReviews = readJson(REVIEWS_FILE, []);
    const filtered = productId ? allReviews.filter(r => r.productId === productId) : allReviews;
    res.json({ success: true, reviews: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load reviews' });
  }
});

app.post('/api/reviews', (req, res) => {
  try {
    const { productId, author, city, rating, headline, comment } = req.body;
    if (!productId || !author || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Required review fields missing.' });
    }
    const allReviews = readJson(REVIEWS_FILE, []);
    const newReview = {
      id: `rev-${Date.now()}`,
      productId,
      author: String(author).trim(),
      city: String(city || 'Dahej / Bharuch').trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      date: new Date().toISOString().split('T')[0],
      headline: String(headline || '').trim() || 'Verified Purchase Review',
      comment: String(comment).trim(),
      verified: true,
      helpful: 0
    };
    allReviews.unshift(newReview);
    writeJson(REVIEWS_FILE, allReviews);
    res.json({ success: true, message: 'Review submitted successfully!', review: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save review' });
  }
});

/**
 * Mark Message Read/Unread (PUT)
 */
app.put('/api/admin/messages/:id/status', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const messages = await db.getMessages();
  const index = messages.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }

  messages[index].status = status || 'Read';
  await db.saveMessage(messages[index]);
  res.json({ success: true, message: 'Message status updated.' });
});

/**
 * Delete Contact Message (DELETE)
 */
app.delete('/api/admin/messages/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  await db.deleteMessage(id);
  res.json({ success: true, message: 'Message deleted.' });
});

/**
 * Admin Settings (GET)
 */
app.get('/api/admin/settings', requireAuth, async (req, res) => {
  const config = await db.getAdminConfig();
  res.json({
    success: true,
    settings: {
      adminEmail: config.adminEmail || 'rajeshframing0@gmail.com',
      adminName: config.adminName || 'Rajesh Kumar',
      smtp: {
        enabled: Boolean(config.smtp && config.smtp.enabled),
        service: (config.smtp && config.smtp.service) || 'gmail',
        host: (config.smtp && config.smtp.host) || 'smtp.gmail.com',
        port: (config.smtp && config.smtp.port) || 465,
        secure: config.smtp ? config.smtp.secure !== false : true,
        user: (config.smtp && config.smtp.user) || 'rajeshframing0@gmail.com',
        hasPassword: Boolean(config.smtp && config.smtp.pass),
        fromEmail: (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing Studio <rajeshframing0@gmail.com>'
      }
    }
  });
});

/**
 * Update Admin Settings & SMTP Credentials (PUT)
 */
app.put('/api/admin/settings', requireAuth, async (req, res) => {
  try {
    const { adminEmail, adminName, newPassword, smtp } = req.body;
    const config = await db.getAdminConfig();

    if (adminEmail) config.adminEmail = adminEmail.trim().toLowerCase();
    if (adminName) config.adminName = adminName.trim();
    if (newPassword && newPassword.trim().length >= 6) {
      config.adminPassword = newPassword.trim();
    }

    if (smtp) {
      config.smtp = config.smtp || {};
      config.smtp.enabled = Boolean(smtp.enabled !== false);
      config.smtp.service = smtp.service || 'gmail';
      config.smtp.host = smtp.host || 'smtp.gmail.com';
      config.smtp.port = Number(smtp.port) || 465;
      config.smtp.secure = smtp.secure !== false;
      config.smtp.user = (smtp.user || '').trim();
      if (smtp.pass) {
        config.smtp.pass = smtp.pass.replace(/\s+/g, '').trim();
      }
      config.smtp.fromEmail = smtp.fromEmail || `Rajesh Framing <${config.adminEmail}>`;
    }

    await db.saveAdminConfig(config);
    res.json({ success: true, message: 'Settings and SMTP configuration saved successfully.' });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ success: false, message: 'Failed to save settings.' });
  }
});

/**
 * Update Admin Profile (PUT)
 */
app.put('/api/admin/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const config = await db.getAdminConfig();

    if (name) config.adminName = name.trim();
    if (email) config.adminEmail = email.trim().toLowerCase();
    if (newPassword && newPassword.trim().length >= 6) {
      config.adminPassword = newPassword.trim();
    }

    await db.saveAdminConfig(config);
    res.json({ success: true, message: 'Admin profile updated successfully.' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ success: false, message: 'Failed to update admin profile.' });
  }
});

/**
 * Update SMTP Settings Specific (PUT)
 */
app.put('/api/admin/settings/smtp', requireAuth, async (req, res) => {
  try {
    const { service, user, pass, host, port } = req.body;
    const config = await db.getAdminConfig();

    config.smtp = config.smtp || {};
    config.smtp.enabled = true;
    config.smtp.service = service || 'gmail';
    if (user) config.smtp.user = user.trim();
    if (pass) config.smtp.pass = pass.replace(/\s+/g, '').trim();
    if (host) config.smtp.host = host.trim();
    if (port) config.smtp.port = Number(port) || 465;
    config.smtp.secure = config.smtp.port === 465;
    config.smtp.fromEmail = config.smtp.fromEmail || `Rajesh Framing <${config.adminEmail || 'rajeshframing0@gmail.com'}>`;

    await db.saveAdminConfig(config);
    console.log(`📧 [SMTP SETTINGS UPDATED] Service: ${config.smtp.service}, User: ${config.smtp.user}`);
    res.json({ success: true, message: 'SMTP settings saved successfully!' });
  } catch (err) {
    console.error('Error saving SMTP settings:', err);
    res.status(500).json({ success: false, message: 'Failed to save SMTP settings.' });
  }
});

/**
 * Test SMTP Email Sending (POST) - Supports both /api/admin/test-smtp and /api/admin/settings/smtp/test
 */
const handleTestSmtp = async (req, res) => {
  try {
    const recipient = req.body.targetEmail || req.body.testEmail || 'rajeshframing0@gmail.com';
    const config = await db.getAdminConfig();

    const transporter = createTransporter(config);
    if (!transporter) {
      return res.status(400).json({
        success: false,
        message: 'SMTP is not enabled or credentials (Username / Password) are missing.'
      });
    }

    const fromAddress = (config.smtp && config.smtp.fromEmail) || 'Rajesh Framing <rajeshframing0@gmail.com>';
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: '✅ Rajesh Framing SMTP Configuration Test Successful',
      text: 'Congratulations! Your SMTP settings for Rajesh Framing Admin Panel are verified and working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #FAF8F5; border-radius: 12px; border: 1px solid #E5E0D5;">
          <h2 style="color: #111111; margin-top: 0;">Rajesh Framing • SMTP Verified</h2>
          <p style="color: #444444; line-height: 1.6;">
            This email confirms that your outgoing mail server is properly connected. Future two-factor authentication OTP passcodes and customer tracking update emails will be delivered directly from this address.
          </p>
          <div style="padding: 12px 16px; background: #ECFDF5; border-left: 4px solid #10B981; color: #065F46; font-size: 13px;">
            Connection Status: <strong>Online & Verified</strong>
          </div>
        </div>
      `
    });

    console.log(`✅ [SMTP TEST] Verification email delivered to ${recipient}`);
    res.json({ success: true, message: `Test email successfully delivered to ${recipient}!` });
  } catch (err) {
    console.error('Test SMTP failed:', err);
    res.status(500).json({ success: false, message: `SMTP verification failed: ${err.message}` });
  }
};

app.post('/api/admin/test-smtp', requireAuth, handleTestSmtp);
app.post('/api/admin/settings/smtp/test', requireAuth, handleTestSmtp);

/**
 * Customer Reviews Endpoints (GET & POST)
 */
app.get('/api/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    const reviews = await db.getReviews(productId || null);
    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { id, productId, author, city, rating, date, headline, comment, verified, helpful } = req.body;
    if (!productId || !author || !headline || !comment) {
      return res.status(400).json({ success: false, message: 'All review fields are required.' });
    }

    const review = {
      id: id || `rev-${Date.now()}`,
      productId,
      author: author.trim(),
      city: (city || 'Dahej / Bharuch').trim(),
      rating: Number(rating) || 5,
      date: date || new Date().toISOString().split('T')[0],
      headline: headline.trim(),
      comment: comment.trim(),
      verified: verified !== false,
      helpful: Number(helpful) || 0
    };

    await db.saveReview(review);
    res.json({ success: true, message: 'Review submitted successfully!', review });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ success: false, message: 'Failed to save review.' });
  }
});

// Start Server locally when executed directly
if (require.main === module) {
  // Sync to Supabase if credentials exist
  try {
    const syncSupabase = require('./scripts/sync-supabase');
    syncSupabase().catch(e => console.warn('Supabase startup sync notice:', e.message));
  } catch (_) {}
  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log(`🚀 RAJESH FRAMING ADMIN & API SERVER RUNNING`);
    console.log(`🌐 Website URL:       http://localhost:${PORT}/index.html`);
    console.log(`🔐 Admin Login URL:   http://localhost:${PORT}/admin-login.html`);
    console.log(`📊 Admin Panel URL:   http://localhost:${PORT}/admin.html`);
    console.log(`📁 Server Root:       ${__dirname}`);
    console.log('======================================================\n');
  });
}

module.exports = app;
