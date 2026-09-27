-- ============================================================
-- 0003 — New features
--   • orders: persist date-of-birth, payment method, and an online
--     fulfillment (packing) status
--   • reviews: customer-submitted, admin-moderated
--   • instagram_reels: admin-managed home-page reels
--   • wholesale: simple inventory + billing (separate from retail)
--   • 'staff' role (no schema change — profiles.role is free-text)
--
-- Safe to run more than once (guarded with IF [NOT] EXISTS / DO blocks).
-- RLS mirrors the existing model: any authenticated user (admin/staff) has
-- full access; the public gets narrow, explicit read/insert grants.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ORDERS — the three fields the app captured but never saved
-- ------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'cash' | 'gpay' | 'split' | NULL (online)
-- Online-order packing workflow. Retail POS bills leave this NULL.
--   'pending'  → paid, not yet packed   (this is what raises the "new order" alert)
--   'packed'   → boxed, ready to ship
--   'shipped'  → handed to courier / done
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT;

-- ------------------------------------------------------------
-- 2. REVIEWS — submitted by customers, shown only once approved
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  note        TEXT NOT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  product     TEXT,                 -- free-text "item purchased" from the customer
  image_url   TEXT,                 -- attached by the admin (a product photo); NULL = image-less card
  is_approved BOOLEAN DEFAULT FALSE, -- admin toggles this to publish
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews (is_approved, created_at DESC);

-- ------------------------------------------------------------
-- 3. INSTAGRAM REELS — home-page reels, managed from the admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instagram_reels (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url   TEXT NOT NULL,        -- public URL from the 'reels' storage bucket
  href        TEXT,                 -- optional link to the original Instagram reel
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reels_active ON instagram_reels (is_active, sort_order);

-- ------------------------------------------------------------
-- 4. WHOLESALE — kept entirely separate from the retail catalogue
-- ------------------------------------------------------------
-- Dead-simple inventory: a code, a company/manufacturer name, and a colour.
CREATE TABLE IF NOT EXISTS wholesale_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT,
  company     TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wholesale_orders (
  id             TEXT PRIMARY KEY,   -- 'WS-<year>-XXXXX'
  customer_name  TEXT,
  customer_phone TEXT,
  subtotal       INTEGER DEFAULT 0,
  discount       INTEGER DEFAULT 0,
  total          INTEGER DEFAULT 0,
  amount_received INTEGER DEFAULT 0,
  payment_method TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wholesale_order_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES wholesale_orders(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES wholesale_items(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,        -- pre-rendered "code / name / both" label for the invoice
  size        TEXT,                 -- typed at billing time
  quantity    INTEGER NOT NULL DEFAULT 1,
  price       INTEGER NOT NULL DEFAULT 0, -- price per unit
  amount      INTEGER NOT NULL DEFAULT 0, -- line total (qty × price, editable)
  sort_order  INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ws_items_order ON wholesale_order_items (order_id, sort_order);

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_reels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_order_items ENABLE ROW LEVEL SECURITY;

-- Reviews: anyone may submit; the public only sees approved ones; admin/staff manage all.
DROP POLICY IF EXISTS "Public read approved reviews" ON reviews;
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = TRUE);
DROP POLICY IF EXISTS "Anyone can submit a review" ON reviews;
CREATE POLICY "Anyone can submit a review" ON reviews FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "Admin manage reviews" ON reviews;
CREATE POLICY "Admin manage reviews" ON reviews FOR ALL USING (auth.role() = 'authenticated');

-- Reels: public reads active ones; admin/staff manage all.
DROP POLICY IF EXISTS "Public read active reels" ON instagram_reels;
CREATE POLICY "Public read active reels" ON instagram_reels FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admin manage reels" ON instagram_reels;
CREATE POLICY "Admin manage reels" ON instagram_reels FOR ALL USING (auth.role() = 'authenticated');

-- Wholesale: admin/staff only. Invoices are rendered server-side with the
-- service-role key (which bypasses RLS), so no public read is needed.
DROP POLICY IF EXISTS "Admin manage ws items" ON wholesale_items;
CREATE POLICY "Admin manage ws items" ON wholesale_items FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin manage ws orders" ON wholesale_orders;
CREATE POLICY "Admin manage ws orders" ON wholesale_orders FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admin manage ws order items" ON wholesale_order_items;
CREATE POLICY "Admin manage ws order items" ON wholesale_order_items FOR ALL USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- 6. STORAGE BUCKET for reel videos (public read, authenticated write)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('reels', 'reels', TRUE, 20971520) -- 20 MB
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = 20971520;

DROP POLICY IF EXISTS "Public read reels bucket" ON storage.objects;
CREATE POLICY "Public read reels bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'reels');
DROP POLICY IF EXISTS "Admin write reels bucket" ON storage.objects;
CREATE POLICY "Admin write reels bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'reels' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'reels' AND auth.role() = 'authenticated');
