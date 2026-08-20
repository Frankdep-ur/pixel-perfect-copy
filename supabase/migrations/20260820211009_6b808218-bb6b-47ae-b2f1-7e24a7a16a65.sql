CREATE POLICY "Participantes veem fotos do servico"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fotos-servico'
  AND (
    public.participa_booking(((storage.foldername(name))[1])::uuid, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Profissional envia fotos do servico"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fotos-servico'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.id = ((storage.foldername(name))[1])::uuid AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Profissional remove fotos do servico"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'fotos-servico'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.id = ((storage.foldername(name))[1])::uuid AND p.user_id = auth.uid()
  )
);

REVOKE EXECUTE ON FUNCTION public.profissionais_candidatas(text, date, text, numeric, numeric, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.marcar_mensagens_lidas(uuid) FROM anon;