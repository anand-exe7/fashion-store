-- The 'images' bucket let ANYONE (role public, no login) upload, overwrite and
-- delete files, using only the anon key that ships in the site's JavaScript.
-- That includes settings/gst_info.json and settings/delivery_info.json, which the
-- invoices and storefront trust. Restrict writes to signed-in staff/admins.
-- Reads stay public (product photos are served from this bucket).
--
-- The server routes use the service-role key, which bypasses these policies.
-- Admin uploads/deletes from the browser run as the signed-in staff user, so they
-- keep working.
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;

CREATE POLICY "Staff upload images" ON storage.objects AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (bucket_id = 'images' AND public.is_staff_or_admin());
CREATE POLICY "Staff update images" ON storage.objects AS PERMISSIVE FOR UPDATE TO public
  USING (bucket_id = 'images' AND public.is_staff_or_admin());
CREATE POLICY "Staff delete images" ON storage.objects AS PERMISSIVE FOR DELETE TO public
  USING (bucket_id = 'images' AND public.is_staff_or_admin());
  