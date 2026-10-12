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
