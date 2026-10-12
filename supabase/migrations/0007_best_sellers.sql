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
