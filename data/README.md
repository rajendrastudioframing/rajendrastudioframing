# Data Directory (Local JSON Storage)

This directory serves as the local database store for Rajendra Studio & Framing when running in offline/fallback mode or during initial local development.

## 🗃️ Active Data Files

| File | Purpose | Supabase Equivalent Table |
|---|---|---|
| `categories.json` | Catalog categories (Glass Frames, Acrylic, Mugs, etc.) | `public.categories` |
| `products.json` | Catalog products with prices, dimensions, finishes | `public.products` |
| `customers.json` | Registered customer profiles, private carts, and wishlists | `public.customers` |
| `orders.json` | Placed customer orders, status, line items, totals | `public.orders` |
| `inquiries.json` | Custom framing quotes & custom print requests | `public.inquiries` |
| `messages.json` | Contact form inquiries from customers | `public.messages` |
| `reviews.json` | Verified customer reviews and ratings | `public.reviews` |
| `admin-config.json` | Studio business settings, UPI IDs, address, WhatsApp | `public.settings` |
| `sessions.json` | Admin login session tracking | In-memory / DB |
| `customer-sessions.json` | Customer OTP session tracking | In-memory / DB |

## 📁 `backups/` Subfolder
Contains historical raw snapshots and recovery checkpoints (`*.backup.json`).

## 🔄 Dual-Mode Persistence
All database read and write methods in [`services/db.js`](../services/db.js) check for Supabase cloud credentials first. If Supabase is connected, data is synced directly to PostgreSQL; otherwise, it transparently falls back to these local JSON files.
