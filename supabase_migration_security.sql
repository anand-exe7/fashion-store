-- ============================================================
-- SECURITY HARDENING MIGRATION
-- Run this in the Supabase SQL editor AFTER supabase_migration.sql.
-- Safe to re-run (idempotent).
--
-- Fixes:
--   * Privilege escalation — every "Admin all …" policy used
--     auth.role() = 'authenticated', which is true for ANY logged-in
--     user, not just admins.
--   * Public PII exposure — orders / order_items were world-readable.
--   * World-writable orders — anyone could insert arbitrary orders.
--
-- Requires an admin to be flagged with profiles.role = 'admin'.
-- Promote yourself once (service-role / SQL editor bypasses the
-- role-escalation guard):
--   UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';
-- ============================================================

-- ---------- Admin helper (SECURITY DEFINER bypasses RLS, prevents recursion) ----------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ---------- Drop the insecure policies ----------
DROP POLICY IF EXISTS "Public read orders"          ON orders;
DROP POLICY IF EXISTS "Public read order items"     ON order_items;
DROP POLICY IF EXISTS "Anyone can place order"      ON orders;
DROP POLICY IF EXISTS "Anyone can add items"        ON order_items;

DROP POLICY IF EXISTS "Admin all profiles"          ON profiles;
DROP POLICY IF EXISTS "Admin all categories"        ON categories;
DROP POLICY IF EXISTS "Admin all products"          ON products;
DROP POLICY IF EXISTS "Admin all images"            ON product_images;
DROP POLICY IF EXISTS "Admin all variants"          ON product_variants;
DROP POLICY IF EXISTS "Admin all coupons"           ON coupons;
DROP POLICY IF EXISTS "Admin all orders"            ON orders;
DROP POLICY IF EXISTS "Admin all order items"       ON order_items;
DROP POLICY IF EXISTS "Admins full manage regions"  ON delivery_regions;
DROP POLICY IF EXISTS "Admins full manage tiers"    ON delivery_tiers;

-- ==========================================================
-- PROFILES — a user sees & edits only their own row; admins all.
-- ==========================================================
DROP POLICY IF EXISTS "Profiles self read"    ON profiles;
DROP POLICY IF EXISTS "Profiles self insert"  ON profiles;
DROP POLICY IF EXISTS "Profiles self update"  ON profiles;
DROP POLICY IF EXISTS "Profiles admin delete" ON profiles;

CREATE POLICY "Profiles self read"   ON profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles self insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles self update" ON profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles admin delete" ON profiles FOR DELETE
  USING (public.is_admin());

-- Block privilege escalation: non-admins cannot change their own role.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- service-role / SQL editor has no auth.uid(); admins are allowed.
    IF auth.uid() IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
      NEW.role := OLD.role;  -- silently ignore the attempted change
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ==========================================================
-- ORDERS & ORDER ITEMS
-- Online orders are created by the server (service-role, bypasses RLS).
-- Admins manage everything; a customer may read only their OWN orders.
-- Invoices are served to anyone with the link via /api/orders/[id]
-- (service-role), so no anon SELECT policy is needed here.
-- ==========================================================
DROP POLICY IF EXISTS "Orders admin all"       ON orders;
DROP POLICY IF EXISTS "Orders self read"       ON orders;
DROP POLICY IF EXISTS "Order items admin all"  ON order_items;
DROP POLICY IF EXISTS "Order items self read"  ON order_items;

CREATE POLICY "Orders admin all" ON orders FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Orders self read" ON orders FOR SELECT
  USING (customer_email = auth.email());

CREATE POLICY "Order items admin all" ON order_items FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Order items self read" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id AND o.customer_email = auth.email()
  ));

-- ==========================================================
-- STOREFRONT MANAGEMENT — admin-only writes.
-- The original public SELECT policies are kept so the shop works.
-- ==========================================================
DROP POLICY IF EXISTS "Categories admin all" ON categories;
DROP POLICY IF EXISTS "Products admin all"   ON products;
DROP POLICY IF EXISTS "Images admin all"     ON product_images;
DROP POLICY IF EXISTS "Variants admin all"   ON product_variants;
DROP POLICY IF EXISTS "Coupons admin all"    ON coupons;
DROP POLICY IF EXISTS "Regions admin all"    ON delivery_regions;
DROP POLICY IF EXISTS "Tiers admin all"      ON delivery_tiers;

CREATE POLICY "Categories admin all" ON categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Products admin all" ON products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Images admin all" ON product_images FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Variants admin all" ON product_variants FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Coupons admin all" ON coupons FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Regions admin all" ON delivery_regions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Tiers admin all" ON delivery_tiers FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- The base migration drops this trigger; restore it so every new
-- auth.users row gets a profiles row. SECURITY DEFINER runs as the
-- owner and bypasses RLS, avoiding the "Database error saving new
-- user" failure that an unprivileged trigger causes. This is the
-- canonical path; the OAuth callback upsert remains as a fallback.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
