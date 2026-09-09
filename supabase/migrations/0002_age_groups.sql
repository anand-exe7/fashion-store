-- ==========================================
-- AGE GROUPS
-- Age is derived bottom-up: the admin types an age range on each product
-- variant (in months, so both "18 Months" and "9 Years" are representable).
-- A trigger rolls each product's variants up into a resolved age_min/age_max
-- on the product row. Storefront filtering then compares that resolved range
-- against each department's configured age range (an interval overlap test) —
-- no product is ever tagged "Toddlers"/"Kids"/"Teens" directly.
-- ==========================================

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS age_min_months INTEGER,
  ADD COLUMN IF NOT EXISTS age_max_months INTEGER;

-- The original schema hardcoded department as CHECK IN ('Men','Women','Kids','Unisex')
-- so any dept added later (Toddlers, Teens, etc.) would silently fail to save
-- on a product. Drop that constraint — the admin's dept dropdown now sources
-- from the departments table directly, which is a better authority anyway.
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_department_check;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS age_min_months INTEGER,
  ADD COLUMN IF NOT EXISTS age_max_months INTEGER;

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS age_min_months INTEGER,
  ADD COLUMN IF NOT EXISTS age_max_months INTEGER;

CREATE INDEX IF NOT EXISTS idx_products_age ON products (age_min_months, age_max_months);

-- ==========================================
-- Seed / update department age ranges (months; NULL = no bound).
-- Unisex is left NULL/NULL — it has no age range, so it keeps matching
-- purely by the existing department tag on the product.
-- ==========================================
INSERT INTO departments (name, is_active, age_min_months, age_max_months) VALUES
  ('Toddlers', TRUE, 0, 36),
  ('Teens', TRUE, 120, 216)
ON CONFLICT (name) DO UPDATE SET
  age_min_months = EXCLUDED.age_min_months,
  age_max_months = EXCLUDED.age_max_months;

UPDATE departments SET age_min_months = 36,  age_max_months = 120 WHERE name = 'Kids';
UPDATE departments SET age_min_months = 216, age_max_months = NULL WHERE name IN ('Men', 'Women');

-- ==========================================
-- Roll variant ages up onto the product.
-- MIN/MAX skip NULLs on their own, so a product with no aged variants at all
-- correctly resolves back to NULL/NULL (not "stuck" at a stale value).
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
