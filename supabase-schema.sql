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
-- 5. CUSTOMERS TABLE (Accounts, OTP Logins & Statistics)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- -----------------------------------------------------------------------------
-- 6. REVIEWS TABLE (Customer Reviews & Ratings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  city TEXT DEFAULT 'Dahej / Bharuch',
  rating INTEGER DEFAULT 5,
  date TEXT,
  headline TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

-- -----------------------------------------------------------------------------
-- 7. ADMIN CONFIG & SETTINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  admin_email TEXT DEFAULT 'rajendrastudioframing@gmail.com',
  admin_password TEXT DEFAULT 'Admin@Rajesh2026',
  admin_name TEXT DEFAULT 'Rajendra Studio Admin',
  smtp JSONB DEFAULT '{
    "enabled": true,
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "user": "rajendrastudioframing@gmail.com",
    "pass": "",
    "fromEmail": "Rajendra Studio <rajendrastudioframing@gmail.com>"
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can read catalog
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service Role All Products" ON public.products;
CREATE POLICY "Service Role All Products" ON public.products USING (true) WITH CHECK (true);

-- Orders: Public can insert orders, public can read order by ID
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

-- Customers: Public can authenticate and read customer record
DROP POLICY IF EXISTS "Public Customers All" ON public.customers;
CREATE POLICY "Public Customers All" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Reviews: Public can read and write reviews
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Reviews" ON public.reviews;
CREATE POLICY "Public Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role All Reviews" ON public.reviews;
CREATE POLICY "Service Role All Reviews" ON public.reviews USING (true) WITH CHECK (true);

-- Config: Service Role only for admin config
DROP POLICY IF EXISTS "Service Role Admin Config" ON public.admin_config;
CREATE POLICY "Service Role Admin Config" ON public.admin_config USING (true) WITH CHECK (true);

-- =============================================================================
-- SEED INITIAL CATALOG DATA (7 MASTER PRODUCTS WITH VERIFIED DISTINCT PRICING)
-- =============================================================================
INSERT INTO public.products (id, name, category, category_label, price, price_display, rating, reviews_count, badge, image, short_description, description, material, printing_type, status, lead_time, sizes, finishes)
VALUES
(
  'glass-frame-classic',
  'Glass Photo Frame',
  'frames',
  'Glass Frames',
  655,
  'Starting from ₹655',
  4.9,
  128,
  'Bestseller',
  'assets/images/glass_frame.jpg',
  'Elegant glass frames designed to preserve your favorite memories with beveled edges and modern metallic standoffs.',
  'Our signature Glass Photo Frame is crafted from optically refined, ultra-clear float glass with diamond-polished beveled edges. Designed to elevate portraits, wedding milestones, and fine art, it features solid brass or gold-finished standoffs that create an elegant floating presence on any desk or wall.',
  'Optically Clear Float Glass (4mm / 6mm) with Diamond Beveled Edge',
  '12-Color Archival Pigment Print (Fade-resistant 50+ yrs)',
  'In Stock',
  '24 - 48 Hours',
  '[{"name":"6\" × 8\"","price":655},{"name":"8\" × 10\"","price":955},{"name":"10\" × 12\"","price":1355},{"name":"12\" × 18\"","price":1855},{"name":"Custom Size","price":2255}]'::jsonb,
  '[{"id":"gold-standoffs","name":"Warm Gold Standoffs","color":"#C99A3D","image":"assets/images/glass_frame.jpg","priceDelta":0},{"id":"royal-blue-glass","name":"Royal Sapphire Blue Accent","color":"#1E3A8A","image":"assets/images/glass_frame_blue.jpg","priceDelta":30},{"id":"silver-standoffs","name":"Brushed Silver Standoffs","color":"#CBD5E1","image":"assets/images/glass_frame_silver.jpg","priceDelta":60},{"id":"black-standoffs","name":"Matte Black Standoffs","color":"#111111","image":"assets/images/glass_frame_black.jpg","priceDelta":90}]'::jsonb
),
(
  'plastic-frame-gallery',
  'Plastic Photo Frame',
  'frames',
  'Plastic Frames',
  439,
  'Starting from ₹439',
  4.8,
  94,
  'Popular',
  'assets/images/plastic_frame_black.jpg',
  'Durable, lightweight customized polymer frames with archival museum mat board in timeless matte finishes.',
  'Manufactured from high-density, eco-friendly structural polymer, our Plastic Photo Frames deliver clean architectural lines without excessive weight. Paired with 1.5mm archival conservation mat board and crystal-clear glazing, these frames are ideal for expansive gallery walls, corridors, and family travel photos.',
  'High-density Engineered Polymer with Conservation Mat',
  'Ultra HD Fine Art Photographic Printing (300 DPI)',
  'In Stock',
  'Same Day / 24 Hours',
  '[{"name":"8\" × 10\"","price":439},{"name":"10\" × 12\"","price":619},{"name":"12\" × 18\"","price":909},{"name":"16\" × 24\"","price":1439},{"name":"20\" × 30\"","price":2039}]'::jsonb,
  '[{"id":"matte-black","name":"Studio Matte Black","color":"#111111","image":"assets/images/plastic_frame_black.jpg","priceDelta":0},{"id":"royal-blue","name":"Royal Sapphire Blue","color":"#1E3A8A","image":"assets/images/plastic_frame_blue.jpg","priceDelta":13},{"id":"pure-white","name":"Gallery Pure White","color":"#F8FAFC","image":"assets/images/plastic_frame_white.jpg","priceDelta":27},{"id":"warm-walnut","name":"Warm Walnut Grain","color":"#78350F","image":"assets/images/plastic_frame_walnut.jpg","priceDelta":41}]'::jsonb
),
(
  'printed-water-bottle-steel',
  'Bottle Printing',
  'personalized',
  'Personalized Printing',
  519,
  'Starting from ₹519',
  4.9,
  112,
  'Trending',
  'assets/images/printed_bottle.jpg',
  'Personalized printing on insulated stainless steel bottles for corporate branding, personal gifts, and fitness events.',
  'Constructed from food-grade 304 stainless steel with double-wall vacuum insulation, our custom bottles keep beverages cold for 24 hours or hot for 12 hours. Personalize with your recipient name, company branding, or vibrant artistic wrap-around graphics that never wash out.',
  'Food-Grade 304 Stainless Steel (Double-Wall Vacuum)',
  'Full 360° Rotary UV Color Print or Laser Engraving',
  'In Stock',
  '1 - 2 Business Days',
  '[{"name":"500 ml","price":519},{"name":"750 ml","price":679},{"name":"1000 ml","price":849}]'::jsonb,
  '[{"id":"matte-black","name":"Stealth Matte Black","color":"#111111","image":"assets/images/printed_bottle.jpg","priceDelta":0},{"id":"royal-blue","name":"Royal Metallic Blue","color":"#1E3A8A","image":"assets/images/printed_bottle_blue.jpg","priceDelta":16},{"id":"brushed-steel","name":"Brushed Silver Steel","color":"#94A3B8","image":"assets/images/printed_bottle_silver.jpg","priceDelta":31}]'::jsonb
),
(
  'customized-coffee-mug',
  'Mug Printing',
  'personalized',
  'Personalized Printing',
  251,
  'Starting from ₹251',
  4.9,
  230,
  'Bestseller',
  'assets/images/custom_mug.jpg',
  'Customized ceramic mugs with photos, names, logos or designs. Microwave safe with brilliant high-gloss sublimation.',
  'Our custom mugs are crafted from premium grade-A ceramic with an ultra-glossy AAA coating designed for high-resolution heat sublimation transfers. Whether celebrating an anniversary with a family collage or equipping an office desk with team logos, these mugs deliver rich, fade-proof colors sip after sip.',
  'Grade AAA Coated Ceramic (Microwave & Dishwasher Safe)',
  'Full-Surface High-Definition Heat Sublimation Transfer',
  'In Stock',
  'Same Day / 24 Hours',
  '[{"name":"Standard 11 oz (325 ml)","price":251},{"name":"Jumbo 15 oz (450 ml)","price":341}]'::jsonb,
  '[{"id":"glossy-white","name":"Classic Glossy White","color":"#FFFFFF","image":"assets/images/custom_mug.jpg","priceDelta":0},{"id":"inner-black","name":"Black Magic Color-Changing","color":"#111111","image":"assets/images/custom_mug_black.jpg","priceDelta":49},{"id":"inner-blue","name":"Royal Blue Duo-Tone","color":"#1E3A8A","image":"assets/images/custom_mug_blue.jpg","priceDelta":29}]'::jsonb
),
(
  'custom-file-printing',
  'File Printing',
  'office',
  'Office Printing',
  149,
  'Starting from ₹149',
  4.8,
  65,
  'Office Essential',
  'assets/images/printed_file.jpg',
  'Custom printed office document files, clip files, and corporate tender files with branded graphics and metal bindings.',
  'Ensure your company, hospital, or institutional files project clean authority. Our custom printed office files feature reinforced spine construction, heavy-gauge board, and heavy-duty spring or lever arch clips capable of holding up to 350 sheets with zero page sagging.',
  '350-450 GSM Heavy Board / Polypropylene with Metal Clip',
  'High-Speed Offset & Screen Print with Matte Lamination',
  'In Stock',
  '2 - 3 Business Days',
  '[{"name":"Regular A4 Document File","price":149},{"name":"Box File / Lever Arch File","price":249}]'::jsonb,
  '[{"id":"navy-blue","name":"Corporate Navy Blue","color":"#1E3A8A","image":"assets/images/printed_file.jpg","priceDelta":0},{"id":"matte-black","name":"Executive Black","color":"#111111","image":"assets/images/printed_file.jpg","priceDelta":10}]'::jsonb
),
(
  'printed-office-folder-executive',
  'Folder Printing',
  'office',
  'Office Printing',
  179,
  'Starting from ₹179',
  4.9,
  88,
  'Corporate Choice',
  'assets/images/printed_folder.jpg',
  'Executive presentation folders with metallic gold foil stamping, debossed logos, and precision die-cut card pockets.',
  'Make an unforgettable first impression at client presentations, proposal pitches, and conferences. Crafted from heavyweight 400 GSM cardstock, each folder features optional gold foil leafing, soft-touch matte lamination, and interior pockets engineered to hold brochures and business cards snugly.',
  '400 GSM Imperial Art Card / Textured Leatherette',
  'Metallic Hot Foil Stamping, Debossing & Spot UV',
  'In Stock',
  '2 - 4 Business Days',
  '[{"name":"Single Pocket (A4 Standard)","price":179},{"name":"Dual Pocket (Executive Presentation)","price":239}]'::jsonb,
  '[{"id":"gold-foil-blue","name":"Midnight Blue with Gold Stamping","color":"#1E3A8A","image":"assets/images/printed_folder.jpg","priceDelta":0},{"id":"gold-foil-black","name":"Onyx Black with Gold Stamping","color":"#111111","image":"assets/images/printed_folder.jpg","priceDelta":20}]'::jsonb
),
(
  'custom-fine-art-canvas',
  'Custom Printing',
  'custom',
  'Custom Printing',
  849,
  'Starting from ₹849',
  5.0,
  145,
  'Artisanal',
  'assets/images/custom_canvas.jpg',
  'Bespoke fine art canvas gallery wraps, floating acrylic prints, and customized personalized gifting sets.',
  'Transform your favorite photography or artwork into museum-grade statement pieces. We stretch heavy 380 GSM cotton canvas over hand-beveled dried pine stretcher bars, finished with protective UV coatings that prevent cracking, fading, and moisture damage for generations.',
  '380 GSM Pure Cotton Canvas or 5mm Optical Cast Acrylic',
  '12-Color Giclée Fine Art Archival Printing (1440 DPI)',
  'In Stock',
  '2 - 3 Business Days',
  '[{"name":"12\" × 18\" Canvas Wrap","price":849},{"name":"18\" × 24\" Canvas Wrap","price":1449},{"name":"24\" × 36\" Canvas Wrap","price":2349},{"name":"12\" × 18\" Floating Acrylic","price":1249},{"name":"18\" × 24\" Floating Acrylic","price":1949}]'::jsonb,
  '[{"id":"stretched-pine","name":"Gallery Wrap (1.5\" Pine Stretcher)","color":"#854D0E","image":"assets/images/custom_canvas.jpg","priceDelta":0},{"id":"floating-gold","name":"Floating Outer Gold Frame","color":"#C99A3D","image":"assets/images/custom_canvas.jpg","priceDelta":150},{"id":"floating-black","name":"Floating Outer Black Frame","color":"#111111","image":"assets/images/custom_canvas.jpg","priceDelta":100}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  price = EXCLUDED.price,
  price_display = EXCLUDED.price_display,
  sizes = EXCLUDED.sizes,
  finishes = EXCLUDED.finishes,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Seed Default Admin Configuration
INSERT INTO public.admin_config (id, admin_email, admin_password, admin_name, smtp)
VALUES (
  'default',
  'rajendrastudioframing@gmail.com',
  'Admin@Rajesh2026',
  'Rajendra Studio Admin',
  '{
    "enabled": true,
    "service": "gmail",
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true,
    "user": "rajendrastudioframing@gmail.com",
    "pass": "",
    "fromEmail": "Rajendra Studio <rajendrastudioframing@gmail.com>"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  smtp = EXCLUDED.smtp,
  updated_at = NOW();

-- Seed Initial Customer Accounts
INSERT INTO public.customers (id, name, email, phone, registered_at, last_login_at, login_count, total_orders, total_spent, status)
VALUES
('CUST-0001', 'Kavya Tandel', 'tandelkavya1002@gmail.com', '+919601574966', '2026-09-26T11:45:20.094Z', NOW(), 1, 3, 1850, 'Active'),
('CUST-0002', 'Kavya Tandel', 'rajeshframing0@gmail.com', '9601574966', '2026-09-26T09:40:46.446Z', NOW(), 1, 2, 899, 'Active')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- Seed Initial Verified Reviews
INSERT INTO public.reviews (id, product_id, author, city, rating, date, headline, comment, verified, helpful)
VALUES
('rev-1790625191990', 'glass-frame-classic', 'Kavya Tandel', 'Bharuch', 5, '2026-09-28', 'Absolute perfection from Rajesh Framing', 'Fast delivery to Bharuch, stunning packaging, and crystal clear photo print!', TRUE, 0),
('rev-gfc-1', 'glass-frame-classic', 'Dr. Pratik Desai', 'Bharuch', 5, '2026-09-24', 'Museum quality float glass and impeccable brass standoffs!', 'Ordered an 18x24 glass frame for our family portrait. The diamond-beveled float glass clarity is stunning, and the metallic standoffs make it float off the wall like in an art gallery.', TRUE, 18),
('rev-gfc-2', 'glass-frame-classic', 'Anjali Mehta', 'Dahej GIDC', 5, '2026-09-20', 'Fast 24-hr turnaround for our corporate executive awards', 'We needed 10 glass award frames customized with company logos on short notice. Rajesh Framing delivered all 10 within 24 hours. The archival print vibrant colors didn''t smudge or bleed. Exceptional studio service!', TRUE, 12),
('rev-pfg-1', 'plastic-frame-gallery', 'Sanjay Patel', 'Bharuch', 5, '2026-09-22', 'Lightweight yet sturdy with authentic conservation matting', 'Used these frames to build a 9-photo memory wall in my home. The polymer build is ultra-clean with zero corner gaps, and the 1.5mm museum matting gives every picture a royal appearance.', TRUE, 15),
('rev-pwb-1', 'printed-water-bottle-steel', 'Hardik Chauhan', 'Dahej GIDC', 5, '2026-09-21', 'Laser engraved finish doesn''t scratch even after daily factory use', 'Ordered insulated steel bottles with laser-etched names for our plant engineering team. Keeps water ice-cold throughout the humid afternoon shifts. Outstanding industrial quality.', TRUE, 21),
('rev-ccm-1', 'customized-coffee-mug', 'Nisha Parekh', 'Bharuch', 5, '2026-09-23', 'Vibrant sublimation print with brilliant glossy finish', 'Gifted custom photo mugs to my colleagues for work anniversaries. Brilliant colors and completely microwave safe.', TRUE, 24)
ON CONFLICT (id) DO NOTHING;
