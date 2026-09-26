-- =============================================================================
-- RAJESH FRAMING - SUPABASE CLOUD DATABASE SCHEMA
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PRODUCTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT,
  price NUMERIC NOT NULL,
  price_display TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 100,
  badge TEXT,
  image TEXT,
  short_description TEXT,
  description TEXT,
  material TEXT,
  printing_type TEXT,
  status TEXT DEFAULT 'In Stock',
  lead_time TEXT DEFAULT '24 - 48 Hours',
  sizes JSONB DEFAULT '[]'::jsonb,
  finishes JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. ORDERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  order_id TEXT PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  notes TEXT,
  order_photo JSONB,
  payment_method TEXT DEFAULT 'Instant UPI Payment (QR Code)',
  payment_status TEXT DEFAULT 'Pending',
  upi_utr TEXT,
  status TEXT DEFAULT 'Confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast order lookups by ID and customer phone/email
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- -----------------------------------------------------------------------------
-- 3. INQUIRIES & LEADS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  product TEXT,
  specs TEXT,
  quantity INTEGER DEFAULT 1,
  estimated_value NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'New',
  has_upload BOOLEAN DEFAULT FALSE,
  upload_file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. CONTACT MESSAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'Unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. ADMIN CONFIG & SETTINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  admin_email TEXT DEFAULT 'rajeshframing0@gmail.com',
  admin_password TEXT DEFAULT 'Admin@Rajesh2026',
  admin_name TEXT DEFAULT 'Rajesh Kumar',
  smtp JSONB DEFAULT '{
    "enabled": true,
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "user": "rajeshframing0@gmail.com",
    "pass": "uywvukwsotrtuevb",
    "fromEmail": "Rajesh Framing <rajeshframing0@gmail.com>"
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allow public read access to products & allow public inserts for orders & inquiries
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read catalog
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role All Products" ON public.products;
CREATE POLICY "Service Role All Products" ON public.products USING (true) WITH CHECK (true);

-- Orders: Public can insert orders, public can read order if they know Order ID
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Track Orders" ON public.orders;
CREATE POLICY "Public Track Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role All Orders" ON public.orders;
CREATE POLICY "Service Role All Orders" ON public.orders USING (true) WITH CHECK (true);

-- Inquiries: Public can submit inquiries
DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
CREATE POLICY "Public Insert Inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Inquiries" ON public.inquiries;
CREATE POLICY "Service Role All Inquiries" ON public.inquiries USING (true) WITH CHECK (true);

-- Messages: Public can submit contact messages
DROP POLICY IF EXISTS "Public Insert Messages" ON public.messages;
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Messages" ON public.messages;
CREATE POLICY "Service Role All Messages" ON public.messages USING (true) WITH CHECK (true);

-- Config: Service Role only for admin config
DROP POLICY IF EXISTS "Service Role Admin Config" ON public.admin_config;
CREATE POLICY "Service Role Admin Config" ON public.admin_config USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED INITIAL CATALOG DATA (7 MASTER PRODUCTS)
-- =============================================================================
INSERT INTO public.products (id, name, category, category_label, price, price_display, rating, reviews_count, badge, image, short_description, description, material, printing_type, status, lead_time)
VALUES
('glass-frame-classic', 'Glass Photo Frame', 'frames', 'Glass Frames', 650, 'Starting from ₹650', 4.9, 128, 'Bestseller', 'assets/images/glass_frame.jpg', 'Elegant glass frames designed to preserve your favorite memories with beveled edges and modern metallic standoffs.', 'Our signature Glass Photo Frame is crafted from optically refined, ultra-clear float glass with diamond-polished beveled edges.', 'Optically Clear Float Glass (4mm / 6mm) with Diamond Beveled Edge', '12-Color Archival Pigment Print (Fade-resistant 50+ yrs)', 'In Stock', '24 - 48 Hours'),

('plastic-frame-gallery', 'Plastic Photo Frame', 'frames', 'Plastic Frames', 450, 'Starting from ₹450', 4.8, 94, 'Popular', 'assets/images/plastic_frame.jpg', 'Durable, lightweight customized polymer frames with archival museum mat board in timeless matte finishes.', 'Manufactured from high-density, eco-friendly structural polymer, our Plastic Photo Frames deliver clean architectural lines without excessive weight.', 'High-density Engineered Polymer with Conservation Mat', 'Ultra HD Fine Art Photographic Printing (300 DPI)', 'In Stock', 'Same Day / 24 Hours'),

('printed-water-bottle-steel', 'Bottle Printing', 'personalized', 'Personalized Printing', 499, 'Starting from ₹499', 4.9, 112, 'Trending', 'assets/images/printed_bottle.jpg', 'Personalized printing on insulated stainless steel bottles for corporate branding, personal gifts, and fitness events.', 'Constructed from food-grade 304 stainless steel with double-wall vacuum insulation.', 'Food-Grade 304 Stainless Steel (Double-Wall Vacuum)', 'Full 360° Rotary UV Color Print or Laser Engraving', 'In Stock', '1 - 2 Business Days'),

('customized-coffee-mug', 'Mug Printing', 'personalized', 'Personalized Printing', 249, 'Starting from ₹249', 4.9, 230, 'Bestseller', 'assets/images/custom_mug.jpg', 'Customized ceramic mugs with photos, names, logos or designs. Microwave safe with brilliant high-gloss sublimation.', 'Our custom mugs are crafted from premium grade-A ceramic with an ultra-glossy AAA coating.', 'Grade AAA Coated Ceramic (Microwave & Dishwasher Safe)', 'Full-Surface High-Definition Heat Sublimation Transfer', 'In Stock', 'Same Day / 24 Hours'),

('custom-file-printing', 'File Printing', 'office', 'Office Printing', 150, 'Starting from ₹150', 4.8, 65, 'Office Essential', 'assets/images/printed_file.jpg', 'Custom printed office document files, clip files, and corporate tender files with branded graphics and metal bindings.', 'Ensure your company, hospital, or institutional files project clean authority.', '350-450 GSM Heavy Board / Polypropylene with Metal Clip', 'High-Speed Offset & Screen Print with Matte Lamination', 'In Stock', '2 - 3 Business Days'),

('printed-office-folder-executive', 'Folder Printing', 'office', 'Office Printing', 180, 'Starting from ₹180', 4.9, 88, 'Corporate Choice', 'assets/images/printed_folder.jpg', 'Executive presentation folders with metallic gold foil stamping, debossed logos, and precision die-cut card pockets.', 'Make an unforgettable first impression at client presentations, proposal pitches, and conferences.', '400 GSM Imperial Art Card / Textured Leatherette', 'Metallic Hot Foil Stamping, Debossing & Spot UV', 'In Stock', '2 - 4 Business Days'),

('custom-fine-art-canvas', 'Custom Printing', 'custom', 'Custom Printing', 850, 'Starting from ₹850', 5.0, 145, 'Artisanal', 'assets/images/custom_canvas.jpg', 'Bespoke fine art canvas gallery wraps, floating acrylic prints, and customized personalized gifting sets.', 'Transform your favorite photography or artwork into museum-grade statement pieces.', '380 GSM Pure Cotton Canvas or 5mm Optical Cast Acrylic', '12-Color Giclée Fine Art Archival Printing (1440 DPI)', 'In Stock', '2 - 3 Business Days')

ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  price_display = EXCLUDED.price_display,
  status = EXCLUDED.status;

-- Seed Default Admin Configuration
INSERT INTO public.admin_config (id, admin_email, admin_password, admin_name, smtp)
VALUES (
  'default',
  'rajeshframing0@gmail.com',
  'Admin@Rajesh2026',
  'Rajesh Kumar',
  '{
    "enabled": true,
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "user": "rajeshframing0@gmail.com",
    "pass": "uywvukwsotrtuevb",
    "fromEmail": "Rajesh Framing <rajeshframing0@gmail.com>"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  smtp = EXCLUDED.smtp;
