-- ============================================================================
-- DUMP THE LIVE SCHEMA AS RUNNABLE SQL
-- Paste into the Supabase SQL editor and Run. It is read-only (SELECT only).
-- The result is ONE cell: copy that cell's whole value.
-- Covers: extensions, enums, tables, constraints, indexes, views, functions,
-- triggers (incl. auth.users), RLS flags, policies (public + storage.objects),
-- table/function grants and storage buckets. No row data.
-- ============================================================================
WITH pub_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relacl
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
),
parts AS (
  -- 0. extensions
  SELECT 0 AS ord, e.extname AS k,
         format('CREATE EXTENSION IF NOT EXISTS %I WITH SCHEMA %I;', e.extname, n.nspname) AS ddl
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace

  UNION ALL -- 1. enums
  SELECT 1, t.typname,
         format('CREATE TYPE public.%I AS ENUM (%s);', t.typname,
                string_agg(quote_literal(en.enumlabel), ', ' ORDER BY en.enumsortorder))
  FROM pg_type t JOIN pg_enum en ON en.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace AND n.nspname = 'public'
  GROUP BY t.typname

  UNION ALL -- 2. tables
  SELECT 2, c.relname,
         format(E'CREATE TABLE public.%I (\n%s\n);', c.relname,
           string_agg(
             format('  %I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
                    CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END,
                    CASE WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid) ELSE '' END),
             E',\n' ORDER BY a.attnum))
  FROM pub_tables c
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
  LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  GROUP BY c.relname

  UNION ALL -- 3. constraints (pk/unique/check first, then foreign keys)
  SELECT 3, (CASE co.contype WHEN 'f' THEN '2' ELSE '1' END) || c.relname || co.conname,
         format('ALTER TABLE ONLY public.%I ADD CONSTRAINT %I %s;', c.relname, co.conname, pg_get_constraintdef(co.oid))
  FROM pg_constraint co JOIN pub_tables c ON c.oid = co.conrelid
  WHERE co.contype IN ('p','u','c','f','x')

  UNION ALL -- 4. indexes not already created by a constraint
  SELECT 4, i.indexname, i.indexdef || ';'
  FROM pg_indexes i
  WHERE i.schemaname = 'public'
    AND NOT EXISTS (SELECT 1 FROM pg_constraint k
                    WHERE k.conindid = (quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))::regclass)

  UNION ALL -- 5. views
  SELECT 5, v.viewname,
         format('CREATE OR REPLACE VIEW public.%I AS %s', v.viewname, pg_get_viewdef(format('public.%I', v.viewname)::regclass))
  FROM pg_views v WHERE v.schemaname = 'public'

  UNION ALL -- 6. functions (full bodies, skipping extension-owned ones)
  SELECT 6, p.proname || p.oid::text, pg_get_functiondef(p.oid) || ';'
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
  WHERE p.prokind IN ('f','p')
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  
  UNION ALL -- 7. triggers (public tables + auth.users)
  SELECT 7, t.tgname, pg_get_triggerdef(t.oid) || ';'
  FROM pg_trigger t
  WHERE NOT t.tgisinternal
    AND (t.tgrelid IN (SELECT oid FROM pub_tables) OR t.tgrelid = 'auth.users'::regclass)

  UNION ALL -- 8. RLS flags
  SELECT 8, c.relname,
         format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname) ||
         CASE WHEN c.relforcerowsecurity THEN format(E'\nALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', c.relname) ELSE '' END
  FROM pub_tables c WHERE c.relrowsecurity

  UNION ALL -- 9. policies (public + storage)
  SELECT 9, p.schemaname || p.tablename || p.policyname,
         format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
                p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd,
                array_to_string(p.roles, ', '),
                CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
                CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END)
  FROM pg_policies p WHERE p.schemaname IN ('public','storage')

  UNION ALL -- 10a. table grants
  SELECT 10, c.relname || x.grantee::text || x.privilege_type,
         format('GRANT %s ON public.%I TO %s;', x.privilege_type, c.relname,
                CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE x.grantee::regrole::text END)
  FROM pub_tables c, LATERAL aclexplode(c.relacl) x

  UNION ALL -- 10b. function grants
  SELECT 10, p.proname || x.grantee::text,
         format('GRANT EXECUTE ON FUNCTION %s TO %s;', p.oid::regprocedure,
                CASE WHEN x.grantee = 0 THEN 'PUBLIC' ELSE x.grantee::regrole::text END)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public',
       LATERAL aclexplode(p.proacl) x
  WHERE p.prokind IN ('f','p')

  UNION ALL -- 11. storage buckets
  SELECT 11, b.id,
         format('INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES (%L, %L, %L, %L, %L) ON CONFLICT (id) DO NOTHING;',
                b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types)
  FROM storage.buckets b
)
SELECT string_agg(ddl, E'\n\n' ORDER BY ord, k) AS full_schema FROM parts;
