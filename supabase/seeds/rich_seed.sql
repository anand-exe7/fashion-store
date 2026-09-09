-- ============================================================
-- RICH SEED — exercises every feature end-to-end
-- ============================================================
-- Prereqs: run supabase_migration.sql once (or the incremental
-- supabase/migrations/0002_age_groups.sql on an existing DB).
--
-- This seed is idempotent — re-running replaces the products,
-- variants, images, and suggestions listed below without
-- touching anything else in the DB.
--
-- What it covers:
--   • Toddlers-only product with baby-months variants (3M–24M)
--   • Kids-only product with year variants (4Y–10Y)
--   • Toddlers+Kids-spanning product (2Y–8Y)
--   • Kids+Teens-spanning product (10Y–16Y) — proves a single
--     product can appear under two age-based departments
--   • Teens-only product with an out-of-stock and a disabled row
--   • Adult Men product — no variant ages, matched by tag only
--   • Adult Women product — no variant ages, matched by tag
--   • Unisex accessory — no ages, matches only by tag
--   • Family-matching product spanning EVERY band (2Y–XL)
--   • Multiple colours per size, primary/gallery images
--   • Curated "Complete the Look" suggestions across products
-- ============================================================

-- 1. Categories (auto-created if missing) ---------------------
INSERT INTO categories (name, is_active) VALUES
  ('Tops', TRUE),
  ('Bottoms', TRUE),
  ('Hoodies', TRUE),
  ('Knitwear', TRUE),
  ('Dresses', TRUE),
  ('Accessories', TRUE),
  ('Bodysuits', TRUE),
  ('Sleepwear', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Products -------------------------------------------------
-- age_min_months / age_max_months on products are intentionally
-- left NULL here — the trigger fills them from variant rows.
INSERT INTO products (id, name, category, description, price, weight_grams, department, is_new, discount_label, is_available) VALUES
  ('P-BABY-01', 'Organic Cotton Onesie',        'Bodysuits',   'GOTS-certified organic cotton onesie with envelope neckline and nickel-free snaps. Machine-washable, gets softer with every wash.', 899,  180, 'Unisex', TRUE,  NULL,       TRUE),
  ('P-KID-01',  'Play Day Cotton Tee',          'Tops',        'Heavyweight cotton tee designed for playgrounds and puddle-jumping. Reinforced seams at the shoulders, ribbed collar keeps its shape.',        749,  190, 'Kids',   FALSE, '-15%',     TRUE),
  ('P-KID-02',  'Little Explorer Cargo Pants',  'Bottoms',     'Six-pocket ripstop cargo pants with an elastic waistband and reinforced knees. Made to survive climbing frames.',                                 1299, 320, 'Kids',   FALSE, NULL,       TRUE),
  ('P-TEEN-01', 'Streetwear Graphic Hoodie',    'Hoodies',     'Oversized fit heavyweight hoodie with tonal chest embroidery and kangaroo pocket. Brushed inside, drop shoulder outside.',                       2499, 720, 'Teens',  TRUE,  'NEW',      TRUE),
  ('P-TEEN-02', 'Ripped Skinny Jeans',          'Bottoms',     'Stretch denim with distressed knees and a slim-through-the-leg cut. Bar-tacked belt loops for the daily beating they will take.',                  1899, 480, 'Teens',  FALSE, NULL,       TRUE),
  ('P-MEN-01',  'Merino Wool Cardigan',         'Knitwear',    '100% Australian Merino wool cardigan in a modern fit. Corozo buttons, ribbed cuffs, temperature-regulating breathable knit.',                      5900, 620, 'Men',    FALSE, NULL,       TRUE),
  ('P-WOMEN-01','Silk Wrap Dress',              'Dresses',     'Bias-cut mulberry silk wrap dress with self-tie waist and hidden side pocket. Fluid drape, midi length.',                                          7200, 340, 'Women',  TRUE,  NULL,       TRUE),
  ('P-UNI-01',  'Waxed Canvas Tote',            'Accessories', '18oz waxed canvas tote with vegetable-tanned leather handles and reinforced base. Fits a 13" laptop and a good book.',                            2200, 640, 'Unisex', FALSE, NULL,       TRUE),
  ('P-FAM-01',  'Family Matching Pajama Set',   'Sleepwear',   'Brushed cotton pajama set in sizes for the whole family — from toddler to grown-up. Piped trim, elasticated waist, machine washable.',            1699, 400, 'Unisex', TRUE,  NULL,       TRUE)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  category       = EXCLUDED.category,
  description    = EXCLUDED.description,
  price          = EXCLUDED.price,
  weight_grams   = EXCLUDED.weight_grams,
  department     = EXCLUDED.department,
  is_new         = EXCLUDED.is_new,
  discount_label = EXCLUDED.discount_label,
  is_available   = EXCLUDED.is_available;

-- 3. Product images -------------------------------------------
-- Wipe and re-insert so re-runs stay idempotent.
DELETE FROM product_images WHERE product_id IN (
  'P-BABY-01','P-KID-01','P-KID-02','P-TEEN-01','P-TEEN-02','P-MEN-01','P-WOMEN-01','P-UNI-01','P-FAM-01'
);

INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  ('P-BABY-01',  'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=1200&auto=format&fit=crop', 'Organic onesie flat lay',    1, TRUE),
  ('P-BABY-01',  'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1200&auto=format&fit=crop', 'Onesie on baby',             2, FALSE),

  ('P-KID-01',   'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=1200&auto=format&fit=crop', 'Kids tee front',            1, TRUE),
  ('P-KID-01',   'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=1200&auto=format&fit=crop', 'Kids tee lifestyle',        2, FALSE),

  ('P-KID-02',   'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=1200&auto=format&fit=crop', 'Cargo pants detail',        1, TRUE),

  ('P-TEEN-01',  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1200&auto=format&fit=crop', 'Hoodie front',              1, TRUE),
  ('P-TEEN-01',  'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop', 'Hoodie back',               2, FALSE),

  ('P-TEEN-02',  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop', 'Skinny jeans',              1, TRUE),

  ('P-MEN-01',   'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1200&auto=format&fit=crop', 'Merino cardigan',           1, TRUE),
  ('P-MEN-01',   'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop', 'Cardigan detail',           2, FALSE),

  ('P-WOMEN-01', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop', 'Silk wrap dress',           1, TRUE),

  ('P-UNI-01',   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop', 'Canvas tote',               1, TRUE),

  ('P-FAM-01',   'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop', 'Family pajamas',            1, TRUE);

-- 4. Product variants -----------------------------------------
-- Wipe and re-insert; the trigger on product_variants will
-- automatically roll ages up onto products after the inserts.
DELETE FROM product_variants WHERE product_id IN (
  'P-BABY-01','P-KID-01','P-KID-02','P-TEEN-01','P-TEEN-02','P-MEN-01','P-WOMEN-01','P-UNI-01','P-FAM-01'
);

-- Age storage is HALF-OPEN in months: [min, max). So size "4Y"
-- meant for ages 4–5 inclusive stores as (48, 72).

-- P-BABY-01 — Toddlers only, baby-months variants, two colours
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-BABY-01', '3M',  'Cream', '#f5efe0', 899, 160, 18, 0,  4,  TRUE, 1),
  ('P-BABY-01', '6M',  'Cream', '#f5efe0', 899, 175, 22, 3,  7,  TRUE, 2),
  ('P-BABY-01', '9M',  'Cream', '#f5efe0', 899, 185, 15, 6,  10, TRUE, 3),
  ('P-BABY-01', '12M', 'Cream', '#f5efe0', 899, 190,  9, 9,  13, TRUE, 4),
  ('P-BABY-01', '18M', 'Cream', '#f5efe0', 899, 205,  4, 12, 19, TRUE, 5),
  ('P-BABY-01', '24M', 'Cream', '#f5efe0', 899, 220,  0, 18, 25, TRUE, 6),  -- out of stock
  ('P-BABY-01', '3M',  'Sage',  '#c7d3b2', 899, 160, 12, 0,  4,  TRUE, 7),
  ('P-BABY-01', '6M',  'Sage',  '#c7d3b2', 899, 175, 20, 3,  7,  TRUE, 8),
  ('P-BABY-01', '12M', 'Sage',  '#c7d3b2', 899, 190,  6, 9,  13, TRUE, 9);

-- P-KID-01 — Kids only, single band, discount label
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-KID-01', '4Y',  'Sky Blue',       '#a7c7e7', 749, 180, 24, 48,  72,  TRUE, 1),
  ('P-KID-01', '6Y',  'Sky Blue',       '#a7c7e7', 749, 200, 30, 72,  96,  TRUE, 2),
  ('P-KID-01', '8Y',  'Sky Blue',       '#a7c7e7', 749, 220, 18, 96,  120, TRUE, 3),
  ('P-KID-01', '4Y',  'Sunset Orange',  '#f4a261', 749, 180, 14, 48,  72,  TRUE, 4),
  ('P-KID-01', '6Y',  'Sunset Orange',  '#f4a261', 749, 200,  8, 72,  96,  TRUE, 5),
  ('P-KID-01', '8Y',  'Sunset Orange',  '#f4a261', 749, 220,  0, 96,  120, TRUE, 6); -- out of stock

-- P-KID-02 — Spans Toddlers (2Y) and Kids (4Y–8Y)
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-KID-02', '2Y', 'Khaki', '#c3b091', 1299, 260, 10, 24, 48,  TRUE, 1),
  ('P-KID-02', '4Y', 'Khaki', '#c3b091', 1299, 300, 16, 48, 72,  TRUE, 2),
  ('P-KID-02', '6Y', 'Khaki', '#c3b091', 1299, 340, 12, 72, 96,  TRUE, 3),
  ('P-KID-02', '8Y', 'Khaki', '#c3b091', 1299, 380,  7, 96, 120, TRUE, 4),
  ('P-KID-02', '4Y', 'Olive', '#708238', 1299, 300,  9, 48, 72,  TRUE, 5),
  ('P-KID-02', '6Y', 'Olive', '#708238', 1299, 340,  5, 72, 96,  TRUE, 6);

-- P-TEEN-01 — Spans Kids (10Y–11Y) and Teens (12Y+); disabled row
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-TEEN-01', '10Y', 'Black', '#141414', 2499, 640, 12, 120, 144, TRUE,  1),
  ('P-TEEN-01', '12Y', 'Black', '#141414', 2499, 680, 18, 144, 168, TRUE,  2),
  ('P-TEEN-01', '14Y', 'Black', '#141414', 2499, 720, 14, 168, 192, TRUE,  3),
  ('P-TEEN-01', '16Y', 'Black', '#141414', 2499, 760,  9, 192, 216, TRUE,  4),
  ('P-TEEN-01', '10Y', 'Cream', '#f5efe0', 2499, 640,  0, 120, 144, TRUE,  5), -- out of stock
  ('P-TEEN-01', '12Y', 'Cream', '#f5efe0', 2499, 680,  6, 144, 168, TRUE,  6),
  ('P-TEEN-01', '14Y', 'Cream', '#f5efe0', 2499, 720,  3, 168, 192, FALSE, 7); -- disabled

-- P-TEEN-02 — Teens only, mixed washes, some out of stock
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-TEEN-02', '12Y', 'Indigo',     '#2a3d66', 1899, 420, 10, 144, 168, TRUE, 1),
  ('P-TEEN-02', '14Y', 'Indigo',     '#2a3d66', 1899, 460, 14, 168, 192, TRUE, 2),
  ('P-TEEN-02', '16Y', 'Indigo',     '#2a3d66', 1899, 500,  6, 192, 216, TRUE, 3),
  ('P-TEEN-02', '14Y', 'Black Wash', '#1c1c1c', 1899, 460,  0, 168, 192, TRUE, 4), -- out of stock
  ('P-TEEN-02', '16Y', 'Black Wash', '#1c1c1c', 1899, 500,  5, 192, 216, TRUE, 5);

-- P-MEN-01 — Adult, no age data → matched purely by dept tag
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, is_available, sort_order) VALUES
  ('P-MEN-01', 'S',  'Charcoal', '#36454f', 5900, 580,  8, TRUE, 1),
  ('P-MEN-01', 'M',  'Charcoal', '#36454f', 5900, 620, 14, TRUE, 2),
  ('P-MEN-01', 'L',  'Charcoal', '#36454f', 5900, 660, 10, TRUE, 3),
  ('P-MEN-01', 'XL', 'Charcoal', '#36454f', 5900, 700,  4, TRUE, 4),
  ('P-MEN-01', 'M',  'Camel',    '#c19a6b', 5900, 620,  6, TRUE, 5),
  ('P-MEN-01', 'L',  'Camel',    '#c19a6b', 5900, 660,  3, TRUE, 6);

-- P-WOMEN-01 — Adult, no age data, split colourway stock
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, is_available, sort_order) VALUES
  ('P-WOMEN-01', 'XS', 'Rose',  '#e8b4b8', 7200, 320,  5, TRUE, 1),
  ('P-WOMEN-01', 'S',  'Rose',  '#e8b4b8', 7200, 335, 12, TRUE, 2),
  ('P-WOMEN-01', 'M',  'Rose',  '#e8b4b8', 7200, 350,  9, TRUE, 3),
  ('P-WOMEN-01', 'L',  'Rose',  '#e8b4b8', 7200, 365,  3, TRUE, 4),
  ('P-WOMEN-01', 'S',  'Ivory', '#fffff0', 7200, 335,  7, TRUE, 5),
  ('P-WOMEN-01', 'M',  'Ivory', '#fffff0', 7200, 350,  0, TRUE, 6); -- out of stock

-- P-UNI-01 — One-size accessory; no age columns filled
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, is_available, sort_order) VALUES
  ('P-UNI-01', 'OS', 'Natural', '#e3dac9', 2200, 620, 24, TRUE, 1),
  ('P-UNI-01', 'OS', 'Black',   '#111111', 2200, 620, 18, TRUE, 2);

-- P-FAM-01 — Spans EVERY band: Toddlers → Kids → Teens → Adults
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, weight_grams, stock, age_min_months, age_max_months, is_available, sort_order) VALUES
  ('P-FAM-01', '2Y',  'Navy Stripe', '#1e2a44', 1699, 260,  6, 24,  48,  TRUE, 1),
  ('P-FAM-01', '4Y',  'Navy Stripe', '#1e2a44', 1699, 300,  8, 48,  72,  TRUE, 2),
  ('P-FAM-01', '6Y',  'Navy Stripe', '#1e2a44', 1699, 340,  9, 72,  96,  TRUE, 3),
  ('P-FAM-01', '8Y',  'Navy Stripe', '#1e2a44', 1699, 380, 10, 96,  120, TRUE, 4),
  ('P-FAM-01', '10Y', 'Navy Stripe', '#1e2a44', 1699, 420,  7, 120, 144, TRUE, 5),
  ('P-FAM-01', '12Y', 'Navy Stripe', '#1e2a44', 1699, 460,  6, 144, 168, TRUE, 6),
  ('P-FAM-01', 'S',   'Navy Stripe', '#1e2a44', 1699, 500, 14, NULL,NULL,TRUE, 7),
  ('P-FAM-01', 'M',   'Navy Stripe', '#1e2a44', 1699, 540, 18, NULL,NULL,TRUE, 8),
  ('P-FAM-01', 'L',   'Navy Stripe', '#1e2a44', 1699, 580, 12, NULL,NULL,TRUE, 9),
  ('P-FAM-01', 'XL',  'Navy Stripe', '#1e2a44', 1699, 620,  8, NULL,NULL,TRUE, 10);
-- Note: adult sizes are NULL/NULL. With the fixed roll-up trigger,
-- any NULL upper bound on a variant with a set lower bound would
-- promote the whole product to "no upper bound." Here the adult
-- rows have NULL on BOTH ends, which the trigger treats as
-- "unspecified" (not "unbounded") — so the product's rolled-up
-- max stays at 168 (12Y+1 = age 13 upper). If you want adults
-- included in the age-based match too, add explicit age ranges
-- on the S/M/L/XL rows (e.g. min_months=216, max_months=NULL for
-- "18Y and up") — they'll then promote the product's max to NULL.

-- 5. "Complete the Look" suggestions --------------------------
DELETE FROM product_suggestions WHERE product_id IN (
  'P-BABY-01','P-KID-01','P-KID-02','P-TEEN-01','P-TEEN-02','P-MEN-01','P-WOMEN-01','P-UNI-01','P-FAM-01'
);

INSERT INTO product_suggestions (product_id, suggested_id, sort_order) VALUES
  -- Kids tee ↔ kids cargo pants; also suggest a family PJ set
  ('P-KID-01',   'P-KID-02',   0),
  ('P-KID-01',   'P-FAM-01',   1),
  ('P-KID-02',   'P-KID-01',   0),
  ('P-KID-02',   'P-BABY-01',  1),

  -- Teens hoodie ↔ teens jeans; also the tote for street styling
  ('P-TEEN-01',  'P-TEEN-02',  0),
  ('P-TEEN-01',  'P-UNI-01',   1),
  ('P-TEEN-02',  'P-TEEN-01',  0),

  -- Adult cross-sell
  ('P-MEN-01',   'P-UNI-01',   0),
  ('P-WOMEN-01', 'P-UNI-01',   0),
  ('P-WOMEN-01', 'P-MEN-01',   1),

  -- Baby → toddler bridge
  ('P-BABY-01',  'P-KID-02',   0),
  ('P-BABY-01',  'P-FAM-01',   1);

-- 6. Force the roll-up to recompute now that variants exist ---
-- (Trigger already ran per row above; this is a safety net for
-- anyone who inserted product rows without variants at first.)
UPDATE product_variants SET id = id
 WHERE product_id IN (
   'P-BABY-01','P-KID-01','P-KID-02','P-TEEN-01','P-TEEN-02','P-FAM-01'
 );

-- ============================================================
-- Verify with:
--   SELECT id, name, department, age_min_months, age_max_months
--     FROM products
--    WHERE id LIKE 'P-%'
--    ORDER BY id;
-- ============================================================
