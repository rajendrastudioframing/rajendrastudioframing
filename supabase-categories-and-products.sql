-- =============================================================================
-- RAJENDRA STUDIO & FRAMING - FIX CATEGORIES & PRODUCTS TABLES FOR SUPABASE
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdvdnisjeopxzevyppmr/sql
-- =============================================================================

-- Enable required extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CREATE CATEGORIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏷️',
  image TEXT,
  "desc" TEXT,
  description TEXT,
  badge TEXT,
  color TEXT DEFAULT '#C99A3D',
  bg TEXT DEFAULT 'rgba(201, 154, 61, 0.15)',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if table was previously created with fewer columns
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏷️';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#C99A3D';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS bg TEXT DEFAULT 'rgba(201, 154, 61, 0.15)';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at ASC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS Policies (Full Read/Write Access for Website & Admin)
DROP POLICY IF EXISTS "Allow Read Categories" ON public.categories;
CREATE POLICY "Allow Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Categories" ON public.categories;
CREATE POLICY "Allow Insert Categories" ON public.categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Categories" ON public.categories;
CREATE POLICY "Allow Update Categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Categories" ON public.categories;
CREATE POLICY "Allow Delete Categories" ON public.categories FOR DELETE USING (true);


-- =============================================================================
-- 2. CREATE PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  price_display TEXT,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 1,
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
  variant_type TEXT DEFAULT 'size',
  variants JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  requires_photo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if table was previously created with fewer columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS requires_photo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_label TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_display TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS printing_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'In Stock';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 100;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time TEXT DEFAULT '24 - 48 Hours';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS finishes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_type TEXT DEFAULT 'size';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products RLS Policies (Full Read/Write Access for Website & Admin)
DROP POLICY IF EXISTS "Allow Read Products" ON public.products;
CREATE POLICY "Allow Read Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Products" ON public.products;
CREATE POLICY "Allow Insert Products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Products" ON public.products;
CREATE POLICY "Allow Update Products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Products" ON public.products;
CREATE POLICY "Allow Delete Products" ON public.products FOR DELETE USING (true);


-- =============================================================================
-- 3. CREATE STORAGE BUCKET FOR PHOTOS & PRODUCT IMAGES (Max 5MB per image, Public Read)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- Storage RLS Policies for 'photos' bucket (Allow Read & Upload)
DROP POLICY IF EXISTS "Public Read Photos" ON storage.objects;
CREATE POLICY "Public Read Photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Insert Photos" ON storage.objects;
CREATE POLICY "Public Insert Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Update Photos" ON storage.objects;
CREATE POLICY "Public Update Photos" ON storage.objects FOR UPDATE USING (bucket_id = 'photos') WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public Delete Photos" ON storage.objects;
CREATE POLICY "Public Delete Photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');


-- =============================================================================
-- 4. REFRESH POSTGREST SCHEMA CACHE (Fixes "Could not find table in schema cache")
-- =============================================================================
NOTIFY pgrst, 'reload schema';


