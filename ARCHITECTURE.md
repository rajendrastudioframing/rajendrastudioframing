# Rajendra Studio & Framing - Technical Architecture & Developer Guide

> **Welcome to the codebase!** This document provides an exhaustive, crystal-clear architectural overview for any software engineer working on this repository.

---

## 🧭 1. Repository Directory Structure

```text
rajendra-studio-and-framing/
│
├── api/                       # Vercel Serverless Function entry point
│   ├── index.js               # Express adapter for Vercel (/api/* rewrite)
│   └── categories.js          # Standalone serverless handler for categories
│
├── assets/                    # Static Assets (Images, Icons, Logos)
│   ├── images/                # Product photos, mockups, banners, branding
│   │   ├── uploads/           # Admin-uploaded product images
│   │   └── IMAGE_CATALOG.md   # Visual mapping & catalog of all 38+ images
│   └── icons/                 # SVG icon assets
│
├── css/                       # Design System & Page Stylesheets
│   ├── style.css              # Global tokens, typography, navbar, footer
│   ├── components.css         # UI components (buttons, modals, badges, cards)
│   ├── ecom-ui.css            # E-commerce elements, product grids, wishlist
│   ├── cart.css               # Slide-out cart drawer & notification toasts
│   ├── orders.css             # Customer orders history & timeline styling
│   ├── track-order.css        # Multi-stage live delivery tracker styling
│   ├── admin.css              # Studio administration dashboard layout
│   ├── admin-login.css        # Secure admin gateway styling
│   └── animations.css         # Micro-interactions, skeleton loaders, bumps
│
├── data/                      # Local JSON Database (Offline / Fallback Store)
│   ├── categories.json        # Main product categories
│   ├── products.json          # Catalog items, variants, frame sizes & prices
│   ├── customers.json         # Customer profiles with private cart & wishlist
│   ├── orders.json            # Customer placed orders with line items & status
│   ├── inquiries.json         # Custom framing quotation leads
│   ├── messages.json          # Contact inquiries from visitors
│   ├── reviews.json           # Verified customer ratings & reviews
│   ├── admin-config.json      # Business settings, UPI details, WhatsApp link
│   ├── sessions.json          # Admin session tokens
│   ├── customer-sessions.json # Customer OTP verification records
│   ├── backups/               # Archived raw data snapshots (*.backup.json)
│   └── README.md              # Local storage schema guide
│
├── js/                        # Frontend JavaScript Modules
│   ├── main.js                # Global interactions, drawer toggles, navbar
│   ├── cart.js                # Cart state, user-scoped storage & server sync
│   ├── wishlist.js            # Wishlist state, heart icons & server sync
│   ├── customer-auth.js       # Customer Email+OTP login modal & auth events
│   ├── checkout.js            # Checkout stepper, UPI QR modal & order placement
│   ├── catalog.js             # Dynamic catalog filtering, search & pagination
│   ├── product-detail.js      # Frame sizing, standoff previews, price calc
│   ├── orders.js              # Customer order history viewer & reordering
│   ├── track-order.js         # Public tracking by Order ID / Phone number
│   ├── contact.js             # Contact form AJAX submission
│   ├── quote-modal.js         # Custom frame quotation popup calculator
│   ├── admin.js               # Studio management dashboard SPA logic
│   └── admin-login.js         # Admin authentication handler
│
├── public/                    # Production Static Mirror for Vercel
│   ├── assets/                # Mirror of assets/
│   ├── css/                   # Mirror of css/
│   ├── js/                    # Mirror of js/
│   └── *.html                 # Mirror of all root HTML pages
│
├── scripts/                   # Operations & Maintenance Utilities
│   ├── sync-public.js         # Syncs Root frontend files with public/
│   ├── sync-supabase.js       # Syncs local JSON database with Supabase Cloud
│   ├── sync-admin-to-website.js # Admin to website catalog validator
│   ├── generate-catalog.js    # Initial catalog generator
│   └── README.md              # Index of all active & historical scripts
│
├── services/                  # Backend Business Logic & External Adapters
│   ├── db.js                  # Hybrid Database Layer (Supabase + JSON Fallback)
│   └── email.js               # Nodemailer Gmail SMTP notification service
│
├── uploads/                   # Runtime customer photo & artwork uploads
│   ├── .gitkeep               # Keeps folder tracked in Git
│   └── README.md              # Uploads usage instructions
│
├── scratch/                   # Developer scratchpad (git-ignored)
│   └── README.md              # Purpose of scratch folder
│
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Template for environment credentials
├── .gitignore                 # Excluded files & directories
├── package.json               # NPM metadata & developer scripts
├── server.js                  # Express.js Application & REST API
├── supabase-schema.sql        # Supabase PostgreSQL DDL schema & tables
├── vercel.json                # Vercel Serverless Function & cleanUrl config
└── README.md                  # High-level project overview
```

---

## 🌐 2. The "Root vs Public" Architecture (Important!)

When working on frontend files (HTML, JS, CSS, Assets), you will notice they exist in both the **Root directory (`/`)** and the **`public/` directory**:

* **Why does `public/` exist?**
  * In production, **Vercel** treats `public/` as the default static asset folder.
  * In local development, `server.js` serves both `public/` and `__dirname`.
* **How to keep them in sync?**
  * You can edit in either location. Whenever you make changes, run:
    ```bash
    npm run sync
    ```
  * The script [`scripts/sync-public.js`](scripts/sync-public.js) automatically compares modified timestamps and copies the newest versions back and forth, ensuring 100% parity with zero manual effort.

---

## 📦 3. Hybrid Database Architecture (`services/db.js`)

The application features a resilient **dual-mode persistence architecture**:

```text
[Incoming API Request]
         │
         ▼
 ┌───────────────┐
 │ services/db.js│
 └───────┬───────┘
         │
         ├──► 1. Check Supabase Cloud (PostgreSQL)
         │       ├── If connected & table exists: Execute SQL query via Supabase SDK.
         │       └── Protected by 3500ms timeout (avoids hangs if paused).
         │
         └──► 2. Automatic Local JSON Fallback
                 └── If Supabase credentials missing or slow, reads/writes
                     to `data/*.json` atomically.
```

### Supported Supabase Environment Variables
The application supports both standard Node.js and Vercel Next.js-style variable names:
* `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
* `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

---

## 🔐 4. Authentication & Per-Customer Account Isolation

### A. Studio Admin Panel Authentication
* **Endpoint:** `POST /api/admin/login`
* **Mechanism:** Validates admin password against environment credentials, returns a signed JWT or session token.
* **Protection:** Express middleware `requireAdminAuth` verifies the token on all `/api/admin/*` routes.

### B. Customer Authentication (Passwordless OTP)
* **Endpoints:**
  * `POST /api/customer/auth/send-otp` (sends a 6-digit OTP via Nodemailer Gmail SMTP)
  * `POST /api/customer/auth/verify-otp` (validates OTP, returns signed JWT)
  * `POST /api/customer/auth/direct-login` (convenient one-click email login)
  * `POST /api/customer/auth/logout`

### C. Strict Per-Customer Cart & Wishlist Isolation
* **Mandatory Rule:** Customers **must** sign in before clicking *Add to Cart*, *Buy Now*, or *Like (Wishlist)*.
* **Storage Scoping:** Instead of a generic `rf_cart`, the browser uses `rf_cart_${email}` and `rf_wishlist_${email}`.
* **Zero Leak Guarantee:** If no customer is logged in, `getCart()` and `getWishlist()` strictly return `[]`.
* **Cloud Sync:**
  * `GET /api/customer/sync` fetches only the authenticated customer's private cart & wishlist.
  * `POST /api/customer/cart` and `POST /api/customer/wishlist` persist updates to `public.customers` (`cart` and `wishlist` JSONB columns).
  * Another user logging in on the same browser will **never** see or access items saved by another customer.

---

## 🔌 5. Core API Endpoints Reference

All API routes are served by [`server.js`](server.js):

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/products` | `GET` | Public | Returns catalog products (with optional `?category=` filter) |
| `/api/categories` | `GET` | Public | Returns all active categories with counts |
| `/api/products/:id` | `GET` | Public | Returns detailed product information and variant pricing |
| `/api/orders` | `POST` | Public / Customer | Submits a new customer order (UPI / Cash on Delivery) |
| `/api/orders/track` | `GET` | Public | Tracks order status by Order ID and Phone |
| `/api/inquiries` | `POST` | Public | Submits a custom framing quotation inquiry |
| `/api/reviews` | `GET`, `POST` | Public | Retrieves verified reviews / submits customer feedback |
| `/api/customer/sync` | `GET` | Customer Auth | Synchronizes logged-in customer's private cart & wishlist |
| `/api/customer/cart` | `POST` | Customer Auth | Persists customer cart to database |
| `/api/customer/wishlist` | `POST` | Customer Auth | Persists customer wishlist to database |
| `/api/customer/orders` | `GET` | Customer Auth | Returns logged-in customer's order history |
| `/api/admin/data` | `GET` | Admin Auth | Returns full analytics, orders, products, reviews, inquiries |
| `/api/admin/product/add` | `POST` | Admin Auth | Adds a new product to the catalog |
| `/api/admin/product/update` | `PUT` | Admin Auth | Updates existing product details, price, or stock |
| `/api/admin/product/:id` | `DELETE` | Admin Auth | Deletes a product from the catalog |
| `/api/admin/category/add` | `POST` | Admin Auth | Creates a new category |
| `/api/admin/category/:id` | `DELETE` | Admin Auth | Removes an empty category |
| `/api/admin/order-status` | `PUT` | Admin Auth | Updates order fulfillment stage (Framing, Shipped, etc.) |
| `/api/admin/settings` | `PUT` | Admin Auth | Updates UPI ID, WhatsApp number, studio contact details |
| `/api/db-status` | `GET` | Public | Live diagnostic check for Cloud Supabase connection & ping |

---

## 🛠️ 6. Developer Workflow Cheatsheet

### 1. Running Locally
```bash
npm install
npm run dev
```
Open `http://localhost:5000` in your browser.

### 2. Synchronizing Frontend Files
After making edits to any HTML, JS, or CSS:
```bash
npm run sync
```

### 3. Synchronizing Database to Supabase Cloud
To seed or push catalog data to Supabase:
```bash
npm run sync:supabase
```

### 4. Deploying to Production
Changes pushed to the `main` branch are automatically built and deployed by Vercel:
```bash
git add -A
git commit -m "feat: your feature description"
git push origin main
```
Live Production Website: **[https://www.rajendrastudioandgifts.in](https://www.rajendrastudioandgifts.in)**
