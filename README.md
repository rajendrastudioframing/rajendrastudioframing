# Rajendra Studio & Framing

> **Premium Custom Framing & Professional Merchandise Printing Business Platform**

A production web application and studio management platform for Rajendra Studio & Framing featuring customer quote requests, personalized merchandise printing (mugs, bottles, acrylics, glass frames), live order tracking, customer authentication with passwordless email OTP, per-customer cart & wishlist isolation, and a secure studio administration dashboard.

Live Production Website: **[https://www.rajendrastudioandgifts.in](https://www.rajendrastudioandgifts.in)**

---

## 📚 Developer Documentation Quick Links

If you are a software engineer joining or working on this codebase, start with these guides:

* 🧭 **[Technical Architecture & Directory Guide (`ARCHITECTURE.md`)](ARCHITECTURE.md)** - Full directory layout, dual-static serving model, API reference, authentication & database design.
* 🖼️ **[Image Assets Catalog (`assets/IMAGE_CATALOG.md`)](assets/IMAGE_CATALOG.md)** - Visual catalog of all 38+ product images, frame finishes, mockups, and banners.
* 📜 **[Scripts & Maintenance Guide (`scripts/README.md`)](scripts/README.md)** - Detailed index of all active utilities and historical migration routines.
* 🗄️ **[Local Data Storage Guide (`data/README.md`)](data/README.md)** - Schema and fallback guide for local JSON data files.

---

## 🚀 Key Features

* **Interactive Catalog & Frame Preview:** Material selection, custom dimensions, standoff hardware styles, and dynamic price calculator.
* **Customer Authentication & Isolation:** Passwordless Email + One-Time Passcode (OTP) sign-in with 60-day stateless HMAC sessions.
* **Private Cart & Wishlist Sync:** Strict per-customer data isolation (`rf_cart_${email}`, `rf_wishlist_${email}`) synced to Cloud PostgreSQL.
* **Online Orders & Tracking:** Real-time customer order placement with Dynamic UPI QR codes, multi-stage delivery tracking.
* **Studio Admin Panel:** Complete CMS for catalog products, inventory, customer orders, leads, and reviews.
* **Hybrid Database Architecture:** Dual-mode persistence powered by Supabase Cloud (PostgreSQL) with seamless offline local JSON fallback.
* **Email Notification Gateway:** Automated order confirmations, quote updates, and OTP passcodes via Google Gmail SMTP (Nodemailer).

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla HTML5, Vanilla CSS3 Design System with CSS Tokens, Vanilla JavaScript (ES6+ Modules)
* **Backend:** Node.js, Express 4, Nodemailer
* **Database & Storage:** Supabase Cloud (PostgreSQL + Supabase Storage) with local JSON fallback
* **Deployment:** Vercel Serverless Function (`/api` rewrite handler)

---

## 🏃 Quick Start for Developers

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5000` in your browser.

3. **Synchronize Root & Public frontend files:**
   After editing any HTML, JS, CSS, or Assets:
   ```bash
   npm run sync
   ```

4. **Seed or Sync Database with Supabase Cloud:**
   ```bash
   npm run sync:supabase
   ```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Supabase Cloud Database & Storage
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Nodemailer / Gmail SMTP Configuration
GMAIL_USER=rajendrastudioframing@gmail.com
GMAIL_APP_PASS=your-16-char-gmail-app-password

# Session Security
CUSTOMER_SESSION_SECRET=your-random-32-char-secret

# Server Port (default 5000)
PORT=5000
```

---

## 🗄️ Database Setup (Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create a project.
2. In the **SQL Editor**, open [`supabase-schema.sql`](supabase-schema.sql), copy the content, and click **Run**.
3. In **Storage**, create a public bucket named `photos`.
4. (Optional) Run `npm run sync:supabase` to seed your initial product catalog.

---

## 📄 License

Proprietary © Rajendra Studio & Framing. All rights reserved.
