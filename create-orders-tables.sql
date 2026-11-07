-- =============================================================================
-- RAJENDRA STUDIO & FRAMING - FIX ORDERS & INQUIRIES TABLES FOR SUPABASE
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hdvdnisjeopxzevyppmr/sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CREATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  order_id TEXT PRIMARY KEY,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  order_photo JSONB,
  payment_method TEXT DEFAULT 'Instant UPI Payment (QR Code)',
  payment_status TEXT DEFAULT 'Pending',
  upi_utr TEXT,
  status TEXT DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmation_date TEXT,
  picked_up_at TIMESTAMPTZ,
  pickup_date TEXT,
  confirmed_email_sent BOOLEAN DEFAULT FALSE,
  ready_email_sent BOOLEAN DEFAULT FALSE,
  cancelled_email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_photo JSONB;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Instant UPI Payment (QR Code)';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_utr TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmation_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_date TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ready_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2. CREATE INQUIRIES & LEADS TABLE
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Customer',
  phone TEXT NOT NULL DEFAULT '',
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
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  confirmation_date TEXT,
  picked_up_at TIMESTAMPTZ,
  pickup_date TEXT,
  confirmed_email_sent BOOLEAN DEFAULT FALSE,
  ready_email_sent BOOLEAN DEFAULT FALSE,
  cancelled_email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was partially created
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Customer';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS product TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS specs TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS has_upload BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS upload_file_name TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmation_date TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS pickup_date TEXT;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS confirmed_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS ready_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS cancelled_email_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 4. PERMISSIVE POLICIES FOR FULL READ & WRITE ACCESS
DROP POLICY IF EXISTS "Allow Read Orders" ON public.orders;
CREATE POLICY "Allow Read Orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Orders" ON public.orders;
CREATE POLICY "Allow Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Orders" ON public.orders;
CREATE POLICY "Allow Update Orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Orders" ON public.orders;
CREATE POLICY "Allow Delete Orders" ON public.orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow Read Inquiries" ON public.inquiries;
CREATE POLICY "Allow Read Inquiries" ON public.inquiries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow Insert Inquiries" ON public.inquiries;
CREATE POLICY "Allow Insert Inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Update Inquiries" ON public.inquiries;
CREATE POLICY "Allow Update Inquiries" ON public.inquiries FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Delete Inquiries" ON public.inquiries;
CREATE POLICY "Allow Delete Inquiries" ON public.inquiries FOR DELETE USING (true);

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

