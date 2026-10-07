-- Wholesale invoices can record the buyer's GST number so it prints on the bill.
-- Nullable and free-text: most walk-in wholesale buyers won't have one, and the
-- value is display-only (no validation or tax computation is tied to it).
ALTER TABLE wholesale_orders
  ADD COLUMN IF NOT EXISTS customer_gstin text;
