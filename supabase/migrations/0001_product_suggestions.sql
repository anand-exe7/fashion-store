-- ==========================================
-- PRODUCT SUGGESTIONS ("Complete the Look")
-- Admin-curated related products per product, shown on the PDP.
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

ALTER TABLE product_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read suggestions" ON product_suggestions FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage suggestions" ON product_suggestions FOR ALL USING (auth.role() = 'authenticated');
