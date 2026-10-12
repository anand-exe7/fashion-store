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
