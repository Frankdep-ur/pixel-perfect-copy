CREATE POLICY "site_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'site');

CREATE POLICY "site_insert_admin" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_update_admin" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_delete_admin" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site' AND public.has_role(auth.uid(), 'admin'));