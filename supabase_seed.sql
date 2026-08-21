-- ==========================================
-- SHALISTONE DEMO DATA SEED SCRIPT
-- ==========================================

-- 1. Categories
INSERT INTO categories (name) VALUES 
('Hoodies'),
('Outerwear'),
('Tops'),
('Shirts'),
('Bottoms'),
('Knitwear'),
('Accessories')
ON CONFLICT DO NOTHING;

-- 2. Products
INSERT INTO products (id, name, category, description, price, is_available) VALUES 
('P01', 'Cotton Heavyweight Hoodie', 'Hoodies', 'Premium heavy-weight cotton hoodie for everyday comfort. Oversized drop-shoulder fit.', 2499, true),
('P02', 'Vintage Wash Denim Jacket', 'Outerwear', 'Classic vintage-wash denim jacket with tailored fit. Features brass hardware and selvedge denim.', 3999, true),
('P03', 'Ribbed Knit Layering Top', 'Tops', 'Fitted ribbed knit top perfect for layering. Stretch comfort.', 1499, true),
('P04', 'Wool Overcoat', 'Outerwear', 'Elegant tailored wool blend overcoat. Fully lined interior.', 8900, true),
('P05', 'Wide-Leg Trouser', 'Bottoms', 'Fluid wide-leg trousers crafted from sustainable gabardine.', 4240, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price;

-- 3. Product Variants (Sizes/Colors/Stock)
INSERT INTO product_variants (product_id, size, color_name, price, stock, weight_grams, sort_order, is_available) VALUES
-- Hoodie variants
('P01', 'M', 'Charcoal', 2499, 15, 650, 1, true),
('P01', 'L', 'Charcoal', 2499, 10, 700, 2, true),
('P01', 'XL', 'Charcoal', 2699, 5, 750, 3, true),
('P01', 'M', 'Oatmeal', 2499, 0, 650, 4, false), -- Disabled variant

-- Denim Jacket variants
('P02', 'M', 'Vintage Blue', 3999, 11, 850, 1, true),
('P02', 'L', 'Vintage Blue', 3999, 8, 900, 2, true),

-- Top variants
('P03', 'S', 'Cream', 1499, 20, 300, 1, true),
('P03', 'M', 'Cream', 1499, 15, 320, 2, true),

-- Overcoat
('P04', 'L', 'Charcoal', 8900, 0, 1200, 1, true),

-- Trouser
('P05', 'M', 'Bone', 4240, 14, 500, 1, true)
ON CONFLICT DO NOTHING;

-- 4. Product Images
INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
('P01', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop', 1, true),
('P01', 'https://images.unsplash.com/photo-1572495641004-28421ae52e52?auto=format&fit=crop&q=80', 2, false),
('P02', 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=600&auto=format&fit=crop', 1, true),
('P03', 'https://images.unsplash.com/photo-1434389678369-1845bfdb2a32?q=80&w=600&auto=format&fit=crop', 1, true),
('P04', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop', 1, true),
('P05', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop', 1, true)
ON CONFLICT DO NOTHING;

-- 5. Coupons
INSERT INTO coupons (code, discount_pct, min_order, expiry, usage_limit, used, is_active) VALUES
('SHALISTONE10', 10, 0, '2027-12-31', 500, 0, true),
('WELCOME15', 15, 10000, '2027-10-31', 50, 0, true),
('FESTIVE20', 20, 15000, '2026-12-31', 30, 0, true)
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