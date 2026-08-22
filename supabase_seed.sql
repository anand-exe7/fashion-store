-- ==========================================
-- SHALISTONE DEMO DATA SEED SCRIPT (PREMIUM)
-- ==========================================

-- 1. Categories
INSERT INTO categories (name) VALUES 
('Hoodies'),
('Outerwear'),
('Tops'),
('Shirts'),
('Bottoms'),
('Knitwear'),
('Accessories'),
('Dresses'),
('Footwear')
ON CONFLICT DO NOTHING;

-- 2. Products
INSERT INTO products (id, name, category, description, price, is_new, discount_label, is_available) VALUES 
('P01', 'Heavyweight Drop-Shoulder Hoodie', 'Hoodies', 'Crafted from 500gsm brushed French terry cotton. Features a relaxed drop-shoulder silhouette, double-lined hood, and our signature tonal embroidery on the cuff. Designed to age beautifully with every wash.', 4500, true, null, true),
('P02', 'Selvedge Denim Trucker Jacket', 'Outerwear', 'Woven on vintage shuttle looms in Okayama, Japan. This 14oz raw selvedge denim jacket features antiqued brass hardware, contrast stitching, and a tailored, modern fit that breaks in perfectly to your body over time.', 8500, false, null, true),
('P03', 'Merino Wool Turtleneck', 'Knitwear', 'Woven from 100% ultrafine Australian Merino wool. This breathable, temperature-regulating turtleneck offers a slim fit, ribbed cuffs, and an incredibly soft hand-feel. Perfect for layering under tailoring.', 5200, false, null, true),
('P04', 'Cashmere Blend Overcoat', 'Outerwear', 'The cornerstone of your winter wardrobe. Tailored from a luxurious wool-cashmere blend, featuring peak lapels, horn buttons, a single rear vent, and a fully lined cupro interior for effortless layering.', 18900, true, 'WINTER EXCLUSIVE', true),
('P05', 'Pleated Wide-Leg Trousers', 'Bottoms', 'Fluid and relaxed. These wide-leg trousers are cut from sustainable gabardine fabric. Featuring a double-pleated front, high rise, and a perfectly draped break over the shoe.', 6200, false, null, true),
('P06', 'Silk Camp Collar Shirt', 'Shirts', 'A relaxed cam  p collar shirt made from 100% pure Mulberry silk. Features a subtle matte finish, mother-of-pearl buttons, and a straight hem. Elevates any evening or vacation look.', 7800, true, null, true),
('P07', 'Essential Pima Cotton Tee', 'Tops', 'The perfect everyday t-shirt. Cut from long-staple Peruvian Pima cotton for unparalleled softness and durability. Features a blind-stitched hem and a slightly boxy fit.', 2100, false, 'BESTSELLER', true),
('P08', 'Structured Canvas Tote', 'Accessories', 'Constructed from heavy-duty 24oz duck canvas. Features reinforced Italian leather handles, a laptop sleeve, and water-resistant interior coating. Built for daily transit.', 3800, false, null, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_new = EXCLUDED.is_new,
  discount_label = EXCLUDED.discount_label;

-- 3. Product Variants (Sizes/Colors/Stock)
INSERT INTO product_variants (product_id, size, color_name, color_hex, price, stock, weight_grams, sort_order, is_available) VALUES
-- Hoodie
('P01', 'S', 'Onyx Black', '#1a1a1a', 4500, 12, 850, 1, true),
('P01', 'M', 'Onyx Black', '#1a1a1a', 4500, 24, 900, 2, true),
('P01', 'L', 'Onyx Black', '#1a1a1a', 4500, 8, 950, 3, true),
('P01', 'M', 'Bone White', '#f3f1e9', 4500, 15, 900, 4, true),
('P01', 'L', 'Bone White', '#f3f1e9', 4500, 0, 950, 5, true), -- Out of stock
('P01', 'XL', 'Onyx Black', '#1a1a1a', 4700, 5, 1000, 6, true), -- Slight upcharge for XL

-- Denim Jacket
('P02', 'M', 'Raw Indigo', '#243447', 8500, 10, 1100, 1, true),
('P02', 'L', 'Raw Indigo', '#243447', 8500, 7, 1150, 2, true),
('P02', 'M', 'Washed Black', '#2a2a2a', 8500, 4, 1100, 3, true),

-- Turtleneck
('P03', 'S', 'Espresso', '#3a2d28', 5200, 18, 400, 1, true),
('P03', 'M', 'Espresso', '#3a2d28', 5200, 22, 420, 2, true),
('P03', 'L', 'Espresso', '#3a2d28', 5200, 11, 450, 3, true),

-- Overcoat
('P04', '48', 'Camel', '#c19a6b', 18900, 3, 1400, 1, true),
('P04', '50', 'Camel', '#c19a6b', 18900, 5, 1500, 2, true),
('P04', '52', 'Camel', '#c19a6b', 18900, 2, 1600, 3, true),
('P04', '50', 'Charcoal', '#36454f', 18900, 6, 1500, 4, true),

-- Trousers
('P05', '30', 'Sand', '#d3c5b4', 6200, 14, 550, 1, true),
('P05', '32', 'Sand', '#d3c5b4', 6200, 19, 580, 2, true),
('P05', '34', 'Sand', '#d3c5b4', 6200, 8, 610, 3, true),
('P05', '32', 'Navy', '#000080', 6200, 11, 580, 4, true),

-- Silk Shirt
('P06', 'M', 'Ivory', '#fffff0', 7800, 10, 200, 1, true),
('P06', 'L', 'Ivory', '#fffff0', 7800, 6, 220, 2, true),

-- Pima Tee
('P07', 'S', 'Optic White', '#ffffff', 2100, 45, 180, 1, true),
('P07', 'M', 'Optic White', '#ffffff', 2100, 60, 200, 2, true),
('P07', 'L', 'Optic White', '#ffffff', 2100, 30, 220, 3, true),
('P07', 'M', 'Faded Olive', '#556b2f', 2100, 25, 200, 4, true),

-- Tote
('P08', 'OS', 'Natural', '#e3dac9', 3800, 15, 800, 1, true),
('P08', 'OS', 'Black', '#000000', 3800, 20, 800, 2, true)
ON CONFLICT DO NOTHING;

-- 4. Product Images
INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
-- Hoodie
('P01', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop', 1, true),
('P01', 'https://images.unsplash.com/photo-1572495641004-28421ae52e52?auto=format&fit=crop&q=80', 2, false),
-- Denim
('P02', 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=600&auto=format&fit=crop', 1, true),
-- Turtleneck
('P03', 'https://images.unsplash.com/photo-1622519407650-3df9883f76a5?q=80&w=600&auto=format&fit=crop', 1, true),
-- Overcoat
('P04', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop', 1, true),
('P04', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop', 2, false),
-- Trousers
('P05', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop', 1, true),
-- Silk Shirt
('P06', 'https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop', 1, true),
-- Pima Tee
('P07', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop', 1, true),
-- Tote
('P08', 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop', 1, true)
ON CONFLICT DO NOTHING;

-- 5. Coupons
INSERT INTO coupons (code, discount_pct, min_order, expiry, usage_limit, used, is_active) VALUES
('SHALISTONE10', 10, 0, '2027-12-31', 500, 0, true),
('LUXURY15', 15, 10000, '2027-10-31', 50, 0, true),
('VIP20', 20, 20000, '2027-12-31', 30, 0, true)
ON CONFLICT (code) DO UPDATE SET 
  discount_pct = EXCLUDED.discount_pct;

-- 6. Delivery Regions & Tiers
INSERT INTO delivery_regions (id, name, is_active) VALUES 
('11111111-1111-1111-1111-111111111111', 'India (Domestic)', true),
('22222222-2222-2222-2222-222222222222', 'International', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_tiers (region_id, min_weight_grams, max_weight_grams, charge) VALUES
('11111111-1111-1111-1111-111111111111', 0, 1000, 150),
('11111111-1111-1111-1111-111111111111', 1000, 5000, 250),
('11111111-1111-1111-1111-111111111111', 5000, null, 500),
('22222222-2222-2222-2222-222222222222', 0, 1000, 1500),
('22222222-2222-2222-2222-222222222222', 1000, null, 2500)
ON CONFLICT DO NOTHING;