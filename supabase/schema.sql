-- ============================================================================
-- FULL SCHEMA — exact copy of the live Supabase database (dumped 2026-10-13)
--
-- Run once, in the SQL editor of a FRESH Supabase project. It is wrapped in a
-- transaction: if any statement fails, nothing is left half-created.
--
-- Schema only — no rows. Not included (they are not part of the schema):
-- auth users, table data, and the files inside the storage buckets.
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS (all pre-installed on Supabase; listed so nothing differs)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto           WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS plpgsql            WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS supabase_vault     WITH SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"        WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ----------------------------------------------------------------------------
CREATE TYPE public.order_source AS ENUM ('online', 'offline', 'whatsapp');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'completed', 'cancelled', 'contacted');
CREATE TYPE public.stock_reason AS ENUM ('sale_online', 'sale_offline', 'manual_adjust', 'restock', 'refund');
CREATE TYPE public.user_role    AS ENUM ('admin', 'staff', 'customer');

-- ----------------------------------------------------------------------------
-- 3. TABLES (columns in their live order)
-- ----------------------------------------------------------------------------
CREATE TABLE public.categories (
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE public.coupons (
  code text NOT NULL,
  discount_pct integer NOT NULL,
  min_order integer DEFAULT 0,
  expiry date,
  usage_limit integer DEFAULT 100,
  used integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address_full text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL,
  min_weight_grams integer NOT NULL DEFAULT 0,
  max_weight_grams integer,
  charge integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.departments (
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  age_min_months integer,
  age_max_months integer
);

CREATE TABLE public.instagram_reels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_url text NOT NULL,
  href text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  product_id text,
  name text NOT NULL,
  size text,
  color text,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL,
  variant_id uuid
);

CREATE TABLE public.orders (
  id text NOT NULL,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_address text,
  source text DEFAULT 'online'::text,
  subtotal integer DEFAULT 0,
  discount integer DEFAULT 0,
  coupon_code text,
  delivery integer DEFAULT 0,
  total integer DEFAULT 0,
  amount_received integer DEFAULT 0,
  status text DEFAULT 'pending'::text,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamp with time zone DEFAULT now(),
  dob date,
  payment_method text,
  fulfillment_status text,
  stock_applied boolean NOT NULL DEFAULT false
);

CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  url text NOT NULL,
  alt_text text,
  sort_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.product_suggestions (
  product_id text NOT NULL,
  suggested_id text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  size text,
  color_name text,
  color_hex text,
  price integer NOT NULL,
  weight_grams integer NOT NULL DEFAULT 0,
  stock integer DEFAULT 0,
  sku text,
  is_available boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  age_min_months integer,
  age_max_months integer
);

CREATE TABLE public.products (
  id text NOT NULL,
  name text NOT NULL,
  category text,
  description text,
  price integer NOT NULL DEFAULT 0,
  weight_grams integer DEFAULT 0,
  image text,
  is_new boolean DEFAULT false,
  discount_label text,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  department text DEFAULT 'Unisex'::text,
  age_min_months integer,
  age_max_months integer,
  original_price integer,
  low_stock integer NOT NULL DEFAULT 6,
  is_best_seller boolean NOT NULL DEFAULT false
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  name text,
  mobile text,
  address text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  birthday date
);

CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  note text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  product text,
  image_url text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  delta integer NOT NULL,
  reason public.stock_reason NOT NULL,
  order_id uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.wholesale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text,
  company text,
  color text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.wholesale_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  item_id uuid,
  name text NOT NULL,
  size text,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL DEFAULT 0,
  amount integer NOT NULL DEFAULT 0,
  sort_order integer DEFAULT 0
);

CREATE TABLE public.wholesale_orders (
  id text NOT NULL,
  customer_name text,
  customer_phone text,
  subtotal integer DEFAULT 0,
  discount integer DEFAULT 0,
  total integer DEFAULT 0,
  amount_received integer DEFAULT 0,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  customer_gstin text
);

-- ----------------------------------------------------------------------------
-- 4. PRIMARY KEYS, UNIQUE + CHECK CONSTRAINTS
-- ----------------------------------------------------------------------------
ALTER TABLE ONLY public.categories            ADD CONSTRAINT categories_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.coupons               ADD CONSTRAINT coupons_pkey PRIMARY KEY (code);
ALTER TABLE ONLY public.customers             ADD CONSTRAINT customers_phone_key UNIQUE (phone);
ALTER TABLE ONLY public.customers             ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.delivery_regions      ADD CONSTRAINT delivery_regions_name_key UNIQUE (name);
ALTER TABLE ONLY public.delivery_regions      ADD CONSTRAINT delivery_regions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.delivery_tiers        ADD CONSTRAINT delivery_tiers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.departments           ADD CONSTRAINT departments_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.instagram_reels       ADD CONSTRAINT instagram_reels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items           ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders                ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_images        ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_suggestions   ADD CONSTRAINT product_suggestions_check CHECK ((product_id <> suggested_id));
ALTER TABLE ONLY public.product_suggestions   ADD CONSTRAINT product_suggestions_pkey PRIMARY KEY (product_id, suggested_id);
ALTER TABLE ONLY public.product_variants      ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_variants      ADD CONSTRAINT product_variants_product_id_size_color_name_key UNIQUE (product_id, size, color_name);
ALTER TABLE ONLY public.products              ADD CONSTRAINT products_low_stock_check CHECK ((low_stock >= 0));
ALTER TABLE ONLY public.products              ADD CONSTRAINT products_original_price_check CHECK (((original_price IS NULL) OR (original_price > price)));
ALTER TABLE ONLY public.products              ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles              ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE ONLY public.profiles              ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews               ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews               ADD CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE ONLY public.stock_movements       ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wholesale_items       ADD CONSTRAINT wholesale_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wholesale_order_items ADD CONSTRAINT wholesale_order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.wholesale_orders      ADD CONSTRAINT wholesale_orders_pkey PRIMARY KEY (id);

-- ----------------------------------------------------------------------------
-- 5. FOREIGN KEYS
-- ----------------------------------------------------------------------------
ALTER TABLE ONLY public.delivery_tiers        ADD CONSTRAINT delivery_tiers_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.delivery_regions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items           ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items           ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.orders                ADD CONSTRAINT orders_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES public.coupons(code) ON DELETE SET NULL;
ALTER TABLE ONLY public.product_images        ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_suggestions   ADD CONSTRAINT product_suggestions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_suggestions   ADD CONSTRAINT product_suggestions_suggested_id_fkey FOREIGN KEY (suggested_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.product_variants      ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products              ADD CONSTRAINT products_category_fkey FOREIGN KEY (category) REFERENCES public.categories(name) ON UPDATE CASCADE;
ALTER TABLE ONLY public.profiles              ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE ONLY public.wholesale_order_items ADD CONSTRAINT wholesale_order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.wholesale_items(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.wholesale_order_items ADD CONSTRAINT wholesale_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.wholesale_orders(id) ON DELETE CASCADE;

-- ----------------------------------------------------------------------------
-- 6. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_order_items_variant ON public.order_items USING btree (variant_id);
CREATE UNIQUE INDEX idx_product_primary_image ON public.product_images USING btree (product_id) WHERE (is_primary = true);
CREATE INDEX idx_products_age ON public.products USING btree (age_min_months, age_max_months);
CREATE INDEX idx_products_best_seller ON public.products USING btree (is_best_seller, is_available) WHERE (is_best_seller = true);
CREATE INDEX idx_reels_active ON public.instagram_reels USING btree (is_active, sort_order);
CREATE INDEX idx_reviews_approved ON public.reviews USING btree (is_approved, created_at DESC);
CREATE INDEX idx_suggestions_product ON public.product_suggestions USING btree (product_id, sort_order);
CREATE INDEX idx_ws_items_order ON public.wholesale_order_items USING btree (order_id, sort_order);

-- ----------------------------------------------------------------------------
-- 7. FUNCTIONS (bodies copied verbatim from the live database)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_variant_stock(p_variant_id uuid, p_delta integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE product_variants
     SET stock = GREATEST(0, COALESCE(stock, 0) + p_delta)
   WHERE id = p_variant_id
   RETURNING stock INTO new_stock;

  IF new_stock IS NULL THEN
    RAISE EXCEPTION 'product variant % not found', p_variant_id
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN new_stock;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_qty integer, p_order_id uuid, p_reason stock_reason)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  updated_rows int;
begin
  update products set stock = stock - p_qty, updated_at = now()
  where id = p_product_id and stock >= p_qty;

  get diagnostics updated_rows = row_count;
  if updated_rows = 0 then
    raise exception 'insufficient_stock' using errcode = 'P0001';
  end if;

  insert into stock_movements (product_id, delta, reason, order_id)
  values (p_product_id, -p_qty, p_reason, p_order_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$function$;

CREATE OR REPLACE FUNCTION public.increment_coupon_used(p_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.coupons SET used = used + 1 WHERE code = p_code;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_product_age_range()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  pid TEXT := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE products p
     SET age_min_months = sub.lo,
         age_max_months = sub.hi
    FROM (
      -- Both bounds are handled symmetrically. If any variant has a NULL lower
      -- bound (a genuine "up to 3M" newborn variant), the whole product is
      -- unbounded BELOW — a plain MIN() would silently skip that NULL and lift
      -- the floor to a sibling variant's value, dropping newborn products out
      -- of age-based searches. Likewise a NULL upper bound ("18Y and up") makes
      -- the product unbounded ABOVE. bool_or catches either half-open case and
      -- flips that side to NULL, matching how the JS filter reads NULL as 0 /
      -- Infinity. An all-NULL variant carries no age info and is ignored.
      SELECT
        CASE
          WHEN COUNT(age_min_months) + COUNT(age_max_months) = 0 THEN NULL
          WHEN bool_or(age_min_months IS NULL AND age_max_months IS NOT NULL) THEN NULL
          ELSE MIN(age_min_months)
        END AS lo,
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
$function$;

-- ----------------------------------------------------------------------------
-- 8. TRIGGERS
-- ----------------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER trg_prevent_role_escalation BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();
CREATE TRIGGER trg_variant_age AFTER INSERT OR DELETE OR UPDATE OF age_min_months, age_max_months ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.sync_product_age_range();

-- ----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (on for every table)
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_regions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tiers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_reels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suggestions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_orders      ENABLE ROW LEVEL SECURITY;
-- (departments has RLS OFF in the live database — left off here too.)

-- ----------------------------------------------------------------------------
-- 10. POLICIES — public schema
-- ----------------------------------------------------------------------------
CREATE POLICY "Categories admin all" ON public.categories AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public read categories" ON public.categories AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Coupons admin all" ON public.coupons AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public read active coupons" ON public.coupons AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));

CREATE POLICY "staff manage customers" ON public.customers AS PERMISSIVE FOR ALL TO public USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "Public read active regions" ON public.delivery_regions AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));
CREATE POLICY "Regions admin all" ON public.delivery_regions AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read delivery tiers" ON public.delivery_tiers AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Tiers admin all" ON public.delivery_tiers AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin manage reels" ON public.instagram_reels AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
CREATE POLICY "Public read active reels" ON public.instagram_reels AS PERMISSIVE FOR SELECT TO public USING ((is_active = true));

CREATE POLICY "Order items admin all" ON public.order_items AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Order items self read" ON public.order_items AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_email = auth.email())))));

CREATE POLICY "Orders admin all" ON public.orders AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Orders self read" ON public.orders AS PERMISSIVE FOR SELECT TO public USING ((customer_email = auth.email()));

CREATE POLICY "Images admin all" ON public.product_images AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public read images" ON public.product_images AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Admin manage suggestions" ON public.product_suggestions AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
CREATE POLICY "Public read suggestions" ON public.product_suggestions AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Public read variants" ON public.product_variants AS PERMISSIVE FOR SELECT TO public USING ((is_available = true));
CREATE POLICY "Variants admin all" ON public.product_variants AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Products admin all" ON public.products AS PERMISSIVE FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public read products" ON public.products AS PERMISSIVE FOR SELECT TO public USING ((is_available = true));

CREATE POLICY "Profiles admin delete" ON public.profiles AS PERMISSIVE FOR DELETE TO public USING (is_admin());
CREATE POLICY "Profiles self insert" ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK (((auth.uid() = id) OR is_admin()));
CREATE POLICY "Profiles self read" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING (((auth.uid() = id) OR is_admin()));
CREATE POLICY "Profiles self update" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING (((auth.uid() = id) OR is_admin())) WITH CHECK (((auth.uid() = id) OR is_admin()));

CREATE POLICY "Admin manage reviews" ON public.reviews AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
CREATE POLICY "Anyone can submit a review" ON public.reviews AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public read approved reviews" ON public.reviews AS PERMISSIVE FOR SELECT TO public USING ((is_approved = true));

CREATE POLICY "staff manage stock_movements" ON public.stock_movements AS PERMISSIVE FOR ALL TO public USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY "Admin manage ws items" ON public.wholesale_items AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
CREATE POLICY "Admin manage ws order items" ON public.wholesale_order_items AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());
CREATE POLICY "Admin manage ws orders" ON public.wholesale_orders AS PERMISSIVE FOR ALL TO public USING (is_staff_or_admin()) WITH CHECK (is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- 11. POLICIES — storage.objects
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin write reels bucket" ON storage.objects AS PERMISSIVE FOR ALL TO public USING (((bucket_id = 'reels'::text) AND is_staff_or_admin())) WITH CHECK (((bucket_id = 'reels'::text) AND is_staff_or_admin()));
CREATE POLICY "Allow Deletes" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING ((bucket_id = 'images'::text));
CREATE POLICY "Allow Updates" ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING ((bucket_id = 'images'::text));
CREATE POLICY "Allow Uploads" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK ((bucket_id = 'images'::text));
CREATE POLICY "Public Access" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'images'::text));
CREATE POLICY "Public read reels bucket" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'reels'::text));
CREATE POLICY "public can read product images" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING ((bucket_id = 'product-images'::text));
CREATE POLICY "staff can delete product images" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'product-images'::text) AND is_staff()));
CREATE POLICY "staff can update product images" ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'product-images'::text) AND is_staff()));
CREATE POLICY "staff can upload product images" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'product-images'::text) AND is_staff()));

-- ----------------------------------------------------------------------------
-- 12. GRANTS
-- The live database gives anon, authenticated and service_role every table
-- privilege on every table, and EXECUTE on every function. "ALL" expands to
-- exactly that set on whichever Postgres version the new project runs
-- (including MAINTAIN on Postgres 17+). The table owner (postgres) already
-- holds everything.
-- ----------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- These two are the only functions whose PUBLIC execute grant was revoked
-- live; every other function keeps the default PUBLIC grant.
REVOKE EXECUTE ON FUNCTION public.adjust_variant_stock(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_used(text)         FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- 13. STORAGE BUCKETS (all public)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('images', 'images', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('product-images', 'product-images', true, NULL, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('reels', 'reels', true, 20971520, NULL) ON CONFLICT (id) DO NOTHING;

COMMIT;
