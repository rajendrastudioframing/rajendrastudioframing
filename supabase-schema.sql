-- =============================================================================
-- RAJENDRA STUDIO & FRAMING - COMPLETE SUPABASE DATABASE SCHEMA & POLICIES
-- Execute this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️',
  "desc" TEXT,
  badge TEXT,
  color TEXT DEFAULT '#C99A3D',
  bg TEXT DEFAULT 'rgba(201, 154, 61, 0.15)',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure newly added columns exist if table already existed
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏷️';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#C99A3D';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS bg TEXT DEFAULT 'rgba(201, 154, 61, 0.15)';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at ASC);

-- =============================================================================
-- 2. PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  price_display TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 100,
  badge TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  short_description TEXT,
  description TEXT,
  material TEXT,
  printing_type TEXT,
  status TEXT DEFAULT 'In Stock',
  in_stock BOOLEAN DEFAULT TRUE,
  stock_qty INTEGER DEFAULT 100,
  lead_time TEXT DEFAULT '24 - 48 Hours',
  sizes JSONB DEFAULT '[]'::jsonb,
  finishes JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure newly added columns exist if table already existed
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- =============================================================================
-- 3. ORDERS TABLE
-- =============================================================================
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
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_photo JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_utr TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- =============================================================================
-- 4. INQUIRIES & LEADS TABLE
-- =============================================================================
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
  status TEXT DEFAULT 'pending',
  has_upload BOOLEAN DEFAULT FALSE,
  upload_file_name TEXT,
  uploaded_file_url TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmation_date TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS pickup_date TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmed_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS ready_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS cancelled_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- =============================================================================
-- 5. CONTACT MESSAGES TABLE
-- =============================================================================
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

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- =============================================================================
-- 6. CUSTOMERS TABLE (Accounts, Logins & Metrics)
-- =============================================================================
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

-- =============================================================================
-- 7. REVIEWS TABLE (Customer Reviews & Ratings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author TEXT NOT NULL,
  city TEXT DEFAULT 'Dahej / Bharuch',
  rating NUMERIC DEFAULT 5,
  date TEXT,
  headline TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  helpful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- =============================================================================
-- 8. ADMIN CONFIG & SETTINGS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  admin_email TEXT DEFAULT 'shop@rajendrastudioandgifts.in',
  secondary_admin_email TEXT DEFAULT 'order@rajendrastudioandgifts.in',
  admin_password TEXT DEFAULT 'Admin@Rajesh2026',
  admin_name TEXT DEFAULT 'Rajendra Studio Admin',
  smtp JSONB DEFAULT '{
    "enabled": true,
    "service": "brevo",
    "host": "smtp-relay.brevo.com",
    "port": 587,
    "secure": false,
    "user": "rajendrastudioframing@gmail.com",
    "pass": "",
    "fromEmail": "Rajendra Studio & Framing <shop@rajendrastudioandgifts.in>"
  }'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_config ADD COLUMN IF NOT EXISTS secondary_admin_email TEXT;

-- =============================================================================
-- 9. SUPABASE STORAGE BUCKET FOR PHOTO UPLOADS
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for Public Bucket Access
DROP POLICY IF EXISTS "Public Read Photos Bucket" ON storage.objects;
CREATE POLICY "Public Read Photos Bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Upload Photos Bucket" ON storage.objects;
CREATE POLICY "Public Upload Photos Bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Update Photos Bucket" ON storage.objects;
CREATE POLICY "Public Update Photos Bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Delete Photos Bucket" ON storage.objects;
CREATE POLICY "Public Delete Photos Bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos');

-- =============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Categories RLS: Full read/write access for website and admin operations
DROP POLICY IF EXISTS "Allow Read Categories" ON public.categories;
CREATE POLICY "Allow Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Categories" ON public.categories;
CREATE POLICY "Allow Insert Categories" ON public.categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Categories" ON public.categories;
CREATE POLICY "Allow Update Categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Categories" ON public.categories;
CREATE POLICY "Allow Delete Categories" ON public.categories FOR DELETE USING (true);

-- Products RLS: Full read/write access for website catalog and admin panel
DROP POLICY IF EXISTS "Allow Read Products" ON public.products;
CREATE POLICY "Allow Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Products" ON public.products;
CREATE POLICY "Allow Insert Products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Products" ON public.products;
CREATE POLICY "Allow Update Products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Products" ON public.products;
CREATE POLICY "Allow Delete Products" ON public.products FOR DELETE USING (true);

-- Orders RLS: Customers can place and track orders; Admin can manage all orders
DROP POLICY IF EXISTS "Allow Read Orders" ON public.orders;
CREATE POLICY "Allow Read Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Orders" ON public.orders;
CREATE POLICY "Allow Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Orders" ON public.orders;
CREATE POLICY "Allow Update Orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Orders" ON public.orders;
CREATE POLICY "Allow Delete Orders" ON public.orders FOR DELETE USING (true);

-- Inquiries RLS: Public lead submission and admin management
DROP POLICY IF EXISTS "Allow Read Inquiries" ON public.inquiries;
CREATE POLICY "Allow Read Inquiries" ON public.inquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Inquiries" ON public.inquiries;
CREATE POLICY "Allow Insert Inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Inquiries" ON public.inquiries;
CREATE POLICY "Allow Update Inquiries" ON public.inquiries FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Inquiries" ON public.inquiries;
CREATE POLICY "Allow Delete Inquiries" ON public.inquiries FOR DELETE USING (true);

-- Messages RLS: Public contact submissions and admin management
DROP POLICY IF EXISTS "Allow Read Messages" ON public.messages;
CREATE POLICY "Allow Read Messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Messages" ON public.messages;
CREATE POLICY "Allow Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Messages" ON public.messages;
CREATE POLICY "Allow Update Messages" ON public.messages FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Messages" ON public.messages;
CREATE POLICY "Allow Delete Messages" ON public.messages FOR DELETE USING (true);

-- Customers RLS: Customer OTP registration, authentication and statistics
DROP POLICY IF EXISTS "Allow Read Customers" ON public.customers;
CREATE POLICY "Allow Read Customers" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Customers" ON public.customers;
CREATE POLICY "Allow Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Customers" ON public.customers;
CREATE POLICY "Allow Update Customers" ON public.customers FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Customers" ON public.customers;
CREATE POLICY "Allow Delete Customers" ON public.customers FOR DELETE USING (true);

-- Reviews RLS: Public reviews display, submissions and admin curation
DROP POLICY IF EXISTS "Allow Read Reviews" ON public.reviews;
CREATE POLICY "Allow Read Reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Reviews" ON public.reviews;
CREATE POLICY "Allow Insert Reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Reviews" ON public.reviews;
CREATE POLICY "Allow Update Reviews" ON public.reviews FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Reviews" ON public.reviews;
CREATE POLICY "Allow Delete Reviews" ON public.reviews FOR DELETE USING (true);

-- Admin Config RLS: Settings management
DROP POLICY IF EXISTS "Allow Read Admin Config" ON public.admin_config;
CREATE POLICY "Allow Read Admin Config" ON public.admin_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Upsert Admin Config" ON public.admin_config;
CREATE POLICY "Allow Upsert Admin Config" ON public.admin_config FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 11. SEED MASTER CATEGORIES DATA (5 DEFAULT + 2 CUSTOM STUDIO CATEGORIES)
-- =============================================================================
INSERT INTO public.categories (id, name, icon, "desc", badge, color, bg, is_default, created_at)
VALUES
(
  'frames',
  'Studio & Framing',
  '🖼️',
  'Classic wood and acrylic glass frames, certificate frames, collage memory boxes, and gallery wall displays.',
  'Studio & Framing',
  '#854d0e',
  'rgba(234, 179, 8, 0.15)',
  TRUE,
  '2026-01-01T00:00:00.000Z'
),
(
  'personalized',
  'Personalized Printing',
  '☕',
  'Custom printed ceramic mugs, insulated bottles, custom apparel, and personalized daily keepsakes.',
  'Personalized Printing',
  '#1e40af',
  'rgba(59, 130, 246, 0.15)',
  TRUE,
  '2026-01-01T00:00:00.000Z'
),
(
  'office',
  'Office Printing',
  '📁',
  'Corporate presentation folders, customized file binders, business cards, letterheads, and executive desk accessories.',
  'Office Printing',
  '#166534',
  'rgba(34, 197, 94, 0.15)',
  TRUE,
  '2026-01-01T00:00:00.000Z'
),
(
  'custom',
  'Custom Printing',
  '🎨',
  'Museum-grade canvas gallery wraps, edge-to-edge acrylic prints, metallic prints, and bespoke art installations.',
  'Custom Printing',
  '#6b21a8',
  'rgba(168, 85, 247, 0.15)',
  TRUE,
  '2026-01-01T00:00:00.000Z'
),
(
  'gifts',
  'Photo Gifts & Keepsakes',
  '🎁',
  'Personalized 3D photo crystals, acrylic desktop plaques, customized keychains, and commemorative photo clocks.',
  'Photo Gifts & Keepsakes',
  '#9d174d',
  'rgba(236, 72, 153, 0.15)',
  TRUE,
  '2026-01-01T00:00:00.000Z'
),
(
  'canvas-gallery',
  'Canvas Gallery',
  '🖼️',
  'Museum-quality wrapped canvas prints and framed canvas arts.',
  'Premium Canvas',
  '#c99a3d',
  'rgba(201, 154, 61, 0.15)',
  FALSE,
  '2026-10-25T19:23:35.568Z'
),
(
  'luxury-art',
  'Luxury Art Collection',
  '🎨',
  'Exclusive handcrafted museum gallery art frames and master prints.',
  'Luxury Art',
  '#d97706',
  'rgba(201, 154, 61, 0.15)',
  FALSE,
  '2026-10-26T04:07:08.823Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  "desc" = EXCLUDED."desc",
  badge = EXCLUDED.badge,
  color = EXCLUDED.color,
  bg = EXCLUDED.bg,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- =============================================================================
-- 12. SEED MASTER PRODUCTS CATALOG (CURRENT VERIFIED PRODUCTS)
-- =============================================================================
INSERT INTO public.products (
  id, name, category, category_label, price, price_display, rating, reviews_count,
  badge, image, images, short_description, description, material, printing_type,
  status, in_stock, stock_qty, lead_time, sizes, finishes
)
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
  '["assets/images/glass_frame.jpg", "assets/images/glass_frame_blue.jpg", "assets/images/glass_frame_silver.jpg", "assets/images/glass_frame_black.jpg"]'::jsonb,
  'Elegant glass frames designed to preserve your favorite memories with beveled edges and modern metallic standoffs.',
  'Our signature Glass Photo Frame is crafted from optically refined, ultra-clear float glass with diamond-polished beveled edges. Designed to elevate portraits, wedding milestones, and fine art, it features solid brass or gold-finished standoffs that create an elegant floating presence on any desk or wall.',
  'Optically Clear Float Glass (4mm / 6mm) with Diamond Beveled Edge',
  '12-Color Archival Pigment Print (Fade-resistant 50+ yrs)',
  'In Stock',
  TRUE,
  100,
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
  '["assets/images/plastic_frame_black.jpg", "assets/images/plastic_frame_blue.jpg", "assets/images/plastic_frame_white.jpg", "assets/images/plastic_frame_walnut.jpg"]'::jsonb,
  'Durable, lightweight customized polymer frames with archival museum mat board in timeless matte finishes.',
  'Manufactured from high-density, eco-friendly structural polymer, our Plastic Photo Frames deliver clean architectural lines without excessive weight. Paired with 1.5mm archival conservation mat board and crystal-clear glazing, these frames are ideal for expansive gallery walls, corridors, and family travel photos.',
  'High-density Engineered Polymer with Conservation Mat',
  'Ultra HD Fine Art Photographic Printing (300 DPI)',
  'In Stock',
  TRUE,
  100,
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
  '["assets/images/printed_bottle.jpg", "assets/images/printed_bottle_blue.jpg", "assets/images/printed_bottle_silver.jpg"]'::jsonb,
  'Personalized printing on insulated stainless steel bottles for corporate branding, personal gifts, and fitness events.',
  'Constructed from food-grade 304 stainless steel with double-wall vacuum insulation, our custom bottles keep beverages cold for 24 hours or hot for 12 hours. Personalize with your recipient name, company branding, or vibrant artistic wrap-around graphics that never wash out.',
  'Food-Grade 304 Stainless Steel (Double-Wall Vacuum)',
  'Full 360° Rotary UV Color Print or Laser Engraving',
  'In Stock',
  TRUE,
  100,
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
  '["assets/images/custom_mug.jpg", "assets/images/custom_mug_black.jpg", "assets/images/custom_mug_blue.jpg"]'::jsonb,
  'Customized ceramic mugs with photos, names, logos or designs. Microwave safe with brilliant high-gloss sublimation.',
  'Our custom mugs are crafted from premium grade-A ceramic with an ultra-glossy AAA coating designed for high-resolution heat sublimation transfers. Whether celebrating an anniversary with a family collage or equipping an office desk with team logos, these mugs deliver rich, fade-proof colors sip after sip.',
  'Grade AAA Coated Ceramic (Microwave & Dishwasher Safe)',
  'Full-Surface High-Definition Heat Sublimation Transfer',
  'In Stock',
  TRUE,
  100,
  'Same Day / 24 Hours',
  '[{"name":"Standard 11 oz (325 ml)","price":251},{"name":"Jumbo 15 oz (450 ml)","price":341}]'::jsonb,
  '[{"id":"glossy-white","name":"Classic Glossy White","color":"#FFFFFF","image":"assets/images/custom_mug.jpg","priceDelta":0},{"id":"inner-black","name":"Black Magic Color-Changing","color":"#111111","image":"assets/images/custom_mug_black.jpg","priceDelta":49},{"id":"inner-blue","name":"Royal Blue Duo-Tone","color":"#1E3A8A","image":"assets/images/custom_mug_blue.jpg","priceDelta":29}]'::jsonb
),
(
  'custom-file-printing',
  'File Printing',
  'office',
  'Office Printing',
  145,
  'Starting from ₹145',
  4.8,
  65,
  'Office Essential',
  'assets/images/printed_file.jpg',
  '["assets/images/printed_file.jpg"]'::jsonb,
  'Custom printed office document files, clip files, and corporate tender files with branded graphics and metal bindings.',
  'Ensure your company, hospital, or institutional files project clean authority. Our custom printed office files feature reinforced spine construction, heavy-gauge board, and heavy-duty spring or lever arch clips capable of holding up to 350 sheets with zero page sagging.',
  '350-450 GSM Heavy Board / Polypropylene with Metal Clip',
  'High-Speed Offset & Screen Print with Matte Lamination',
  'In Stock',
  TRUE,
  100,
  '2 - 3 Business Days',
  '[{"name":"Regular A4 Document File","price":145},{"name":"Box File / Lever Arch File","price":245}]'::jsonb,
  '[{"id":"navy-blue","name":"Corporate Navy Blue","color":"#1E3A8A","image":"assets/images/printed_file.jpg","priceDelta":0},{"id":"matte-black","name":"Executive Black","color":"#111111","image":"assets/images/printed_file.jpg","priceDelta":10}]'::jsonb
),
(
  'printed-office-folder-executive',
  'Folder Printing',
  'office',
  'Office Printing',
  189,
  'Starting from ₹189',
  4.9,
  88,
  'Corporate Choice',
  'assets/images/printed_folder.jpg',
  '["assets/images/printed_folder.jpg"]'::jsonb,
  'Executive presentation folders with metallic gold foil stamping, debossed logos, and precision die-cut card pockets.',
  'Make an unforgettable first impression at client presentations, proposal pitches, and conferences. Crafted from heavyweight 400 GSM cardstock, each folder features optional gold foil leafing, soft-touch matte lamination, and interior pockets engineered to hold brochures and business cards snugly.',
  '400 GSM Imperial Art Card / Textured Leatherette',
  'Metallic Hot Foil Stamping, Debossing & Spot UV',
  'In Stock',
  TRUE,
  100,
  '2 - 4 Business Days',
  '[{"name":"Single Pocket (A4 Standard)","price":189},{"name":"Dual Pocket (Executive Presentation)","price":249}]'::jsonb,
  '[{"id":"gold-foil-blue","name":"Midnight Blue with Gold Stamping","color":"#1E3A8A","image":"assets/images/printed_folder.jpg","priceDelta":0},{"id":"gold-foil-black","name":"Onyx Black with Gold Stamping","color":"#111111","image":"assets/images/printed_folder.jpg","priceDelta":20}]'::jsonb
),
(
  'custom-fine-art-canvas',
  'Custom Printing',
  'custom',
  'Custom Printing',
  897,
  'Starting from ₹897',
  5.0,
  145,
  'Artisanal',
  'assets/images/custom_canvas.jpg',
  '["assets/images/custom_canvas.jpg"]'::jsonb,
  'Bespoke fine art canvas gallery wraps, floating acrylic prints, and customized personalized gifting sets.',
  'Transform your favorite photography or artwork into museum-grade statement pieces. We stretch heavy 380 GSM cotton canvas over hand-beveled dried pine stretcher bars, finished with protective UV coatings that prevent cracking, fading, and moisture damage for generations.',
  '380 GSM Pure Cotton Canvas or 5mm Optical Cast Acrylic',
  '12-Color Giclée Fine Art Archival Printing (1440 DPI)',
  'In Stock',
  TRUE,
  100,
  '2 - 3 Business Days',
  '[{"name":"12\" × 18\" Canvas Wrap","price":897},{"name":"18\" × 24\" Canvas Wrap","price":1497},{"name":"24\" × 36\" Canvas Wrap","price":2397},{"name":"12\" × 18\" Floating Acrylic","price":1297},{"name":"18\" × 24\" Floating Acrylic","price":1997}]'::jsonb,
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

-- =============================================================================
-- 13. SEED DEFAULT ADMIN CONFIGURATION
-- =============================================================================
INSERT INTO public.admin_config (id, admin_email, secondary_admin_email, admin_password, admin_name, smtp)
VALUES (
  'default',
  'shop@rajendrastudioandgifts.in',
  'order@rajendrastudioandgifts.in',
  'Admin@Rajesh2026',
  'Rajendra Studio Admin',
  '{
    "enabled": true,
    "service": "brevo",
    "host": "smtp-relay.brevo.com",
    "port": 587,
    "secure": false,
    "user": "rajendrastudioframing@gmail.com",
    "pass": "",
    "fromEmail": "Rajendra Studio & Framing <shop@rajendrastudioandgifts.in>"
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  secondary_admin_email = EXCLUDED.secondary_admin_email,
  updated_at = NOW();

-- =============================================================================
-- 14. SEED INITIAL CUSTOMERS
-- =============================================================================
INSERT INTO public.customers (id, name, email, phone, registered_at, last_login_at, login_count, total_orders, total_spent, status)
VALUES
('CUST-0001', 'Kavya Tandel', 'tandelkavya1002@gmail.com', '+919510757513', '2026-09-26T11:45:20.094Z', NOW(), 1, 3, 1850, 'Active'),
('CUST-0002', 'Kavya Tandel', 'rajeshframing0@gmail.com', '9510757513', '2026-09-26T09:40:46.446Z', NOW(), 1, 2, 899, 'Active'),
('CUST-0014', 'Rajendra Studio Customer', 'shop@rajendrastudioandgifts.in', '9510757513', '2026-10-14T16:04:12.892Z', NOW(), 1, 0, 0, 'Active')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- =============================================================================
-- 15. SEED INITIAL VERIFIED REVIEWS
-- =============================================================================
INSERT INTO public.reviews (id, product_id, author, city, rating, date, headline, comment, verified, helpful)
VALUES
('rev-1790625191990', 'glass-frame-classic', 'Kavya Tandel', 'Bharuch', 5, '2026-09-28', 'Absolute perfection from Rajesh Framing', 'Fast delivery to Bharuch, stunning packaging, and crystal clear photo print!', TRUE, 0),
('rev-gfc-1', 'glass-frame-classic', 'Dr. Pratik Desai', 'Bharuch', 5, '2026-09-24', 'Museum quality float glass and impeccable brass standoffs!', 'Ordered an 18x24 glass frame for our family portrait. The diamond-beveled float glass clarity is stunning, and the metallic standoffs make it float off the wall like in an art gallery.', TRUE, 18),
('rev-gfc-2', 'glass-frame-classic', 'Anjali Mehta', 'Dahej GIDC', 5, '2026-09-20', 'Fast 24-hr turnaround for our corporate executive awards', 'We needed 10 glass award frames customized with company logos on short notice. Rajesh Framing delivered all 10 within 24 hours. The archival print vibrant colors didn''t smudge or bleed. Exceptional studio service!', TRUE, 12),
('rev-pfg-1', 'plastic-frame-gallery', 'Sanjay Patel', 'Bharuch', 5, '2026-09-22', 'Lightweight yet sturdy with authentic conservation matting', 'Used these frames to build a 9-photo memory wall in my home. The polymer build is ultra-clean with zero corner gaps, and the 1.5mm museum matting gives every picture a royal appearance.', TRUE, 15),
('rev-pwb-1', 'printed-water-bottle-steel', 'Hardik Chauhan', 'Dahej GIDC', 5, '2026-09-21', 'Laser engraved finish doesn''t scratch even after daily factory use', 'Ordered insulated steel bottles with laser-etched names for our plant engineering team. Keeps water ice-cold throughout the humid afternoon shifts. Outstanding industrial quality.', TRUE, 21),
('rev-ccm-1', 'customized-coffee-mug', 'Nisha Parekh', 'Bharuch', 5, '2026-09-23', 'Vibrant sublimation print with brilliant glossy finish', 'Gifted custom photo mugs to my colleagues for work anniversaries. Brilliant colors and completely microwave safe.', TRUE, 24)
ON CONFLICT (id) DO NOTHING;
