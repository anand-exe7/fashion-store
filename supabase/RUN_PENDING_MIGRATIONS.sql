-- ============================================================================
-- SHALISTONE — PENDING DATABASE CHANGES
--
-- Paste this whole file into the Supabase SQL editor and press Run. Once.
--
-- It is migrations 0005, 0006 and 0007 joined in the required order, purely
-- so it can go in as a single paste. Every statement is guarded, so running
-- it twice changes nothing.
--
-- Nothing here deletes data or alters an existing column. It only adds:
--   products.original_price   — the struck-through MRP
--   products.low_stock        — the per-product "alert below N"
--   products.is_best_seller   — the home page Best Sellers tick
--   orders.stock_applied      — guard so a repeated payment webhook can't
--                               deduct stock twice
--   order_items.variant_id    — which size/colour a sold line was
--   adjust_variant_stock()    — single-statement stock change, so two
--                               simultaneous sales can't both take the last piece
-- ============================================================================


-- ########## 0005_pricing_and_stock.sql ##########

-- ============================================================
-- 0004 — MRP pricing + stock correctness
--   • products.original_price — the struck-through MRP shown next to
--     the (green) selling price. NULL = no MRP, show price alone.
--   • products.low_stock — the per-product "alert below N" threshold
--     the admin form always collected but had nowhere to store, so it
--     reset to a hardcoded 6 on every reload.
--   • adjust_variant_stock() — a single-statement, atomic stock change.
--     The old read-then-write in lib/db.ts let two concurrent orders
--     read the same stock and double-consume it.
--
-- Safe to run more than once (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- ------------------------------------------------------------
-- 1. PRICING — MRP alongside the selling price
-- ------------------------------------------------------------
-- Kept as INTEGER to match products.price (whole rupees, no paise).
-- A value <= price is meaningless (nothing to strike through), so it is
-- rejected here as well as in the admin form.
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price INTEGER;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_original_price_check;
ALTER TABLE products ADD CONSTRAINT products_original_price_check
  CHECK (original_price IS NULL OR original_price > price);

-- ------------------------------------------------------------
-- 2. PER-PRODUCT LOW-STOCK THRESHOLD
-- ------------------------------------------------------------
-- Compared against the product's TOTAL stock (the sum of its variants),
-- not against any single variant.
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock INTEGER NOT NULL DEFAULT 6;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_low_stock_check;
ALTER TABLE products ADD CONSTRAINT products_low_stock_check
  CHECK (low_stock >= 0);

-- ------------------------------------------------------------
-- 3. ATOMIC STOCK ADJUSTMENT
-- ------------------------------------------------------------
-- One UPDATE, so concurrent callers serialise on the row instead of
-- racing between a SELECT and an UPDATE. Negative delta = sale,
-- positive = restock. Clamped at 0 so stock can never go negative.
--
-- Deliberately SECURITY INVOKER (the default): the caller's own RLS
-- policy on product_variants still applies, so this buys atomicity
-- without handing anyone write access they didn't already have.
CREATE OR REPLACE FUNCTION public.adjust_variant_stock(
  p_variant_id UUID,
  p_delta      INTEGER
) RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE product_variants
     SET stock = GREATEST(0, COALESCE(stock, 0) + p_delta)
   WHERE id = p_variant_id
   RETURNING stock INTO new_stock;

  -- No row updated: either the variant is gone, or RLS hid it from this
  -- caller. Raise rather than return NULL so the app shows a real error
  -- instead of silently failing to decrement a sold item.
  IF new_stock IS NULL THEN
    RAISE EXCEPTION 'product variant % not found', p_variant_id
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.adjust_variant_stock(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_variant_stock(UUID, INTEGER)
  TO authenticated, service_role;


-- ########## 0006_order_stock.sql ##########

-- ============================================================
-- 0005 — Online orders must consume stock
--   • order_items.variant_id — which exact size/colour row a line
--     sold. The columns were name/size/colour text only, so once an
--     order was saved nothing could tie it back to the variant it
--     came from (no decrement on payment, no restock on refund).
--   • orders.stock_applied — the once-only guard. Razorpay retries
--     webhook deliveries, and "status = completed" alone can't tell
--     a retry apart from a first delivery that failed partway.
--
-- Safe to run more than once (IF NOT EXISTS guards).
-- Depends on 0004 for the adjust_variant_stock() RPC.
-- ============================================================

-- ------------------------------------------------------------
-- 1. WHICH VARIANT A LINE SOLD
-- ------------------------------------------------------------
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Some databases already grew this column by hand, outside these migration
-- files, with no foreign key attached — and ADD COLUMN IF NOT EXISTS skips
-- the REFERENCES clause when the column is already there. So attach the key
-- separately, whichever way the column arrived.
--
-- ON DELETE SET NULL, never CASCADE: retiring a size must not delete the
-- order history that sold it. The line keeps its name/size/colour text, it
-- just loses the live link.
--
-- NOT VALID so the statement doesn't have to scan (and reject) pre-existing
-- rows that point at variants deleted long ago. It is enforced on every row
-- written from here on, which is what the stock path needs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'order_items'::regclass
       AND conname  = 'order_items_variant_id_fkey'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_variant_id_fkey
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items (variant_id);

-- ------------------------------------------------------------
-- 2. ONCE-ONLY STOCK GUARD
-- ------------------------------------------------------------
-- Claimed with `UPDATE orders SET stock_applied = true
--                WHERE id = $1 AND stock_applied = false RETURNING id`
-- so exactly one concurrent webhook delivery ever gets the row back.
-- Deliberately separate from `status`: a delivery that completes the
-- order but then fails mid-decrement leaves this FALSE, so the next
-- retry still picks the stock work up.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_applied BOOLEAN NOT NULL DEFAULT FALSE;

-- Orders that already shipped were settled by hand or by the POS path
-- (which decrements at billing time). Mark them done so this never
-- walks backwards over history and double-consumes.
UPDATE orders SET stock_applied = TRUE WHERE stock_applied = FALSE AND status <> 'pending';


-- ########## 0007_best_sellers.sql ##########

-- ============================================================
-- 0006 — Admin-chosen Best Sellers
--   • products.is_best_seller — ticked per product in Admin →
--     Inventory, exactly like the existing is_new ("New Arrival")
--     flag, and changeable at any time.
--
-- Replaces the home page's old guess: it showed the 4 newest
-- products that weren't flagged New Arrival, which had nothing to
-- do with what actually sold.
--
-- Safe to run more than once (IF NOT EXISTS guard).
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT FALSE;

-- The storefront asks for "the best sellers still on sale", so index the
-- flag alongside availability rather than on its own.
CREATE INDEX IF NOT EXISTS idx_products_best_seller
  ON products (is_best_seller, is_available)
  WHERE is_best_seller = TRUE;

