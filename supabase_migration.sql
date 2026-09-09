-- ==========================================
-- 0. CLEANUP (ERASE PREVIOUS TABLES & TRIGGERS)
-- ==========================================
-- Wipe out common broken auth triggers that cause "Database error saving new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop all our tables
DROP TABLE IF EXISTS delivery_tiers CASCADE;
DROP TABLE IF EXISTS delivery_regions   CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS product_suggestions CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ==========================================
-- 1. PROFILES (admin auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  mobile      TEXT,
  address     TEXT,
  role        TEXT DEFAULT 'user',  -- 'admin' | 'user'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. DEPARTMENTS & CATEGORIES
-- ==========================================
CREATE TABLE IF NOT EXISTS departments (
  name           TEXT PRIMARY KEY,
  is_active      BOOLEAN DEFAULT TRUE,
  age_min_months INTEGER, -- lower age bound in months, NULL = no lower bound
  age_max_months INTEGER, -- upper age bound in months (exclusive), NULL = no upper bound
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments (age ranges in months; Unisex has none — it
-- matches every age purely via the product's explicit department tag)
INSERT INTO departments (name, is_active, age_min_months, age_max_months) VALUES
('Toddlers', TRUE, 0, 36),
('Kids', TRUE, 36, 120),
('Teens', TRUE, 120, 216),
('Men', TRUE, 216, NULL),
('Women', TRUE, 216, NULL),
('Unisex', TRUE, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS categories (
  name        TEXT PRIMARY KEY,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. PRODUCTS
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT REFERENCES categories(name) ON UPDATE CASCADE,
  description   TEXT,
  price         INTEGER NOT NULL DEFAULT 0,
  weight_grams  INTEGER DEFAULT 0,
  image         TEXT, -- primary image URL (legacy, keep for now)
  is_new        BOOLEAN DEFAULT FALSE,
  discount_label TEXT,
  department    TEXT DEFAULT 'Unisex',
  age_min_months INTEGER, -- resolved from variants by trg_variant_age; NULL = no age data yet
  age_max_months INTEGER,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3a. PRODUCT IMAGES (multi-image support)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt_text    TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_primary_image
  ON product_images(product_id) WHERE is_primary = TRUE;

-- ==========================================
-- 3b. PRODUCT VARIANTS (size + colour combos + weight)
-- ==========================================
CREATE TABLE IF NOT EXISTS product_variants (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size         TEXT,
  color_name   TEXT,
  color_hex    TEXT,
  price        INTEGER NOT NULL,
  weight_grams INTEGER NOT NULL DEFAULT 0,
  stock        INTEGER DEFAULT 0,
  sku          TEXT,
  age_min_months INTEGER, -- typed directly by the admin per size/variant
  age_max_months INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  UNIQUE(product_id, size, color_name)
);

CREATE INDEX IF NOT EXISTS idx_products_age ON products (age_min_months, age_max_months);

-- ==========================================
-- 3c. AGE ROLL-UP TRIGGER
-- Rolls a product's variant age ranges up into its own age_min/age_max.
-- MIN/MAX skip NULLs on their own, so a product with no aged variants at all
-- correctly resolves back to NULL/NULL rather than getting stuck.
-- ==========================================
CREATE OR REPLACE FUNCTION sync_product_age_range() RETURNS TRIGGER AS $$
DECLARE
  pid TEXT := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE products p
     SET age_min_months = sub.lo,
         age_max_months = sub.hi
    FROM (
      -- MIN skips NULLs (fine — "no lower bound" is effectively 0 to the
      -- matcher). For MAX we intentionally OVERRIDE it: if any variant has a
      -- NULL upper bound, the whole product is unbounded above — a single
      -- "18Y and up" variant must not be silently capped by a sibling variant
      -- that had a To value. bool_or catches any NULL upper bound and flips
      -- the roll-up to NULL, matching how the JS filter reads NULL (Infinity).
      SELECT
        MIN(age_min_months) AS lo,
        CASE
          WHEN COUNT(age_min_months) + COUNT(age_max_months) = 0 THEN NULL
          WHEN bool_or(age_max_months IS NULL AND age_min_months IS NOT NULL) THEN NULL
          ELSE MAX(age_max_months)
        END AS hi
      FROM product_variants
      WHERE product_id = pid
    ) sub
   WHERE p.id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_age ON product_variants;
CREATE TRIGGER trg_variant_age
AFTER INSERT OR DELETE OR UPDATE OF age_min_months, age_max_months
ON product_variants
FOR EACH ROW EXECUTE FUNCTION sync_product_age_range();

-- ==========================================
-- 4. COUPONS
-- ==========================================
CREATE TABLE IF NOT EXISTS coupons (
  code          TEXT PRIMARY KEY,
  discount_pct  INTEGER NOT NULL,
  min_order     INTEGER DEFAULT 0,
  expiry        DATE,
  usage_limit   INTEGER DEFAULT 100,
  used          INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. ORDERS
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id              TEXT PRIMARY KEY,
  customer_name   TEXT,
  customer_phone  TEXT,
  customer_email  TEXT,
  customer_address TEXT,
  source          TEXT DEFAULT 'online',
  subtotal        INTEGER DEFAULT 0,
  discount        INTEGER DEFAULT 0,
  coupon_code     TEXT REFERENCES coupons(code) ON DELETE SET NULL,
  delivery        INTEGER DEFAULT 0,
  total           INTEGER DEFAULT 0,
  amount_received INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'pending',
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT,
  name        TEXT NOT NULL,
  size        TEXT,
  color       TEXT,
  quantity    INTEGER NOT NULL DEFAULT 1,
  price       INTEGER NOT NULL
);

-- ==========================================
-- 6. DELIVERY REGIONS + TIERS
-- ==========================================
CREATE TABLE IF NOT EXISTS delivery_regions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_tiers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_id       UUID NOT NULL REFERENCES delivery_regions(id) ON DELETE CASCADE,
  min_weight_grams INTEGER NOT NULL DEFAULT 0,
  max_weight_grams INTEGER, -- NULL = Unlimited
  charge          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 6a. PRODUCT SUGGESTIONS ("Complete the Look")
-- ==========================================
CREATE TABLE IF NOT EXISTS product_suggestions (
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  suggested_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, suggested_id),
  CHECK (product_id <> suggested_id)
);

CREATE INDEX IF NOT EXISTS idx_suggestions_product ON product_suggestions(product_id, sort_order);

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tiers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;

-- Public storefront reads
CREATE POLICY "Public read categories"     ON categories      FOR SELECT USING (TRUE);
CREATE POLICY "Public read products"       ON products        FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public read images"         ON product_images  FOR SELECT USING (TRUE);
CREATE POLICY "Public read variants"       ON product_variants FOR SELECT USING (is_available = TRUE);
CREATE POLICY "Public read active coupons" ON coupons         FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read active regions" ON delivery_regions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read delivery tiers" ON delivery_tiers  FOR SELECT USING (TRUE);
CREATE POLICY "Public read suggestions"    ON product_suggestions FOR SELECT USING (TRUE);

-- Public can read orders (secured by unguessable IDs)
CREATE POLICY "Public read orders"         ON orders          FOR SELECT USING (TRUE);
CREATE POLICY "Public read order items"    ON order_items     FOR SELECT USING (TRUE);

-- Customers can insert their own orders
CREATE POLICY "Anyone can place order"     ON orders       FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can add items"       ON order_items  FOR INSERT WITH CHECK (TRUE);

-- Authenticated (admin) full access
CREATE POLICY "Admin all profiles"    ON profiles         FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all categories"  ON categories       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all products"    ON products         FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all images"      ON product_images   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all variants"    ON product_variants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all coupons"     ON coupons          FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all orders"      ON orders           FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin all order items" ON order_items      FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins full manage regions" ON delivery_regions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins full manage tiers" ON delivery_tiers   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin manage suggestions" ON product_suggestions FOR ALL USING (auth.role() = 'authenticated');
