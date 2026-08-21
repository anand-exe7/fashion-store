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
('P01', 'Cotton Hoodie', 'Hoodies', 'Premium heavy-weight cotton hoodie for everyday comfort.', 2193, true),
('P02', 'Denim Jacket', 'Outerwear', 'Classic vintage-wash denim jacket with tailored fit.', 3500, true),
('P03', 'Ribbed Knit Top', 'Tops', 'Fitted ribbed knit top perfect for layering.', 3240, true),
('P04', 'Wool Overcoat', 'Outerwear', 'Elegant tailored wool blend overcoat.', 8900, true),
('P05', 'Wide-Leg Trouser', 'Bottoms', 'Fluid wide-leg trousers crafted from sustainable gabardine.', 4240, true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  price = EXCLUDED.price;

-- 3. Product Variants (Sizes/Colors/Stock)
INSERT INTO product_variants (product_id, size, color_name, price, stock, weight_grams, sort_order) VALUES
('P01', 'M', 'Black', 2193, 24, 600, 1),
('P01', 'L', 'Black', 2193, 10, 600, 2),
('P02', 'M', 'Blue', 3500, 11, 850, 1),
('P03', 'S', 'White', 3240, 3, 300, 1),
('P04', 'L', 'Charcoal', 8900, 0, 1200, 1),
('P05', 'M', 'Bone', 4240, 14, 500, 1)
ON CONFLICT DO NOTHING;

-- 4. Product Images
INSERT INTO product_images (product_id, url, sort_order, is_primary) VALUES
('P01', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop', 1, true),
('P02', 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=600&auto=format&fit=crop', 1, true),
('P03', 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop', 1, true),
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