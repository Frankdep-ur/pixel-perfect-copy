drop policy if exists "avatares_read" on storage.objects;
create policy "avatares_read" on storage.objects for select to anon, authenticated
using (bucket_id = 'avatares');

drop policy if exists "avatares_insert_own" on storage.objects;
create policy "avatares_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_update_own" on storage.objects;
create policy "avatares_update_own" on storage.objects for update to authenticated
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatares_delete_own" on storage.objects;
create policy "avatares_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);