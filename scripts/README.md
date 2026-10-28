# Scripts Directory (`scripts/`)

This directory contains operations, maintenance, data synchronization, and historical migration scripts for Rajendra Studio & Framing.

---

## 🌟 1. Active Operations & Synchronization Scripts

These scripts are actively used during development and production maintenance:

| Script | Command | Purpose |
|---|---|---|
| `sync-public.js` | `npm run sync` | Synchronizes frontend files between Root (`/`) and `public/` folder so both environments remain in 100% parity. |
| `sync-supabase.js` | `npm run sync:supabase` | Seeds and synchronizes local JSON data (`products.json`, `categories.json`, etc.) with Supabase Cloud PostgreSQL. |
| `sync-admin-to-website.js` | `node scripts/sync-admin-to-website.js` | Validates synchronization between admin panel products/categories and public store catalog. |
| `generate-catalog.js` | `node scripts/generate-catalog.js` | Generates initial catalog product structure with frame colors, standoff variations, and pricing tiers. |

---

## 📜 2. Historical UI & Schema Migration Scripts

These scripts were one-off migration and patch routines executed during various development phases. They are kept for historical tracking and reference:

* **Mobile Responsive Patches:**
  * `apply-compact-mobile-cards.js` - Compact layout for product cards on mobile viewports.
  * `fix-phone-view.js` - Media query optimizations for mobile devices.
  * `fix-mobile-cards.js` - Fixes padding and touch targets for mobile product cards.
  * `fix-tab-nav-mobile.js` - Smooth horizontal scroll on mobile navigation tabs.
  * `make-responsive.js` - Global responsive grid adjustments.
  * `make-mobile-admin-cards.js` - Responsive data cards for admin table views on mobile.
* **Product Detail Page Refactors:**
  * `fix-product-detail-blank-space.js` - Removed legacy white spaces in product preview.
  * `remove-product-detail-blank-space.js` - Collapsed redundant empty sections.
  * `split-product-detail-sections.js` - Separated preview, action stepper, and specifications into modular cards.
  * `update-mobile-detail-layout.js` - Compact action button bar for product detail view.
* **Catalog & Category Enhancements:**
  * `build-categories-page.js` - Built responsive categories listing page.
  * `build-homepage-markup.js` - Bento-box homepage layout builder.
  * `redesign-product-cards.js` - Modernized product cards with hover actions and wishlisting.
  * `set-5-products-per-category.js` - Balanced product counts across main categories.
  * `remove-products-banner.js` - Streamlined catalog header.
* **Checkout & Order Flow:**
  * `make-order-summary-sticky.js` - Sticky summary panel on desktop checkout.
  * `remove-online-payment.js` - Streamlined checkout to Direct UPI QR + Studio Pickup / COD.
  * `remove-cancel-options.js` - Removed customer cancellation options once order is verified.
* **Admin Dashboard Patches:**
  * `update-admin-full.js` - Complete overhaul of admin studio dashboard.
  * `update-admin-order-actions.js` - Added stage tracking (Processing, Framing, Shipped, Delivered).
  * `update-admin-messages-reviews.js` - Admin controls for approving reviews and replying to messages.
  * `fix-admin-sidebar-scroll.js` - Fixed sticky desktop sidebar navigation in admin panel.

---

## 💡 Quick Tips for Developers

* Always run `npm run sync` after modifying any frontend files (HTML, JS, CSS) in the Root directory.
* Before running `node scripts/sync-supabase.js`, ensure `SUPABASE_URL` and `SUPABASE_KEY` (or service role key) are present in `.env`.
