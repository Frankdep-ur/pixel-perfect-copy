DROP FUNCTION IF EXISTS public.convites_aceitos(uuid);
CREATE OR REPLACE FUNCTION public.convites_aceitos(_booking_id uuid)
 RETURNS TABLE(convite_id uuid, profissional_id uuid, nome text, foto_url text, nota_media numeric, total_avaliacoes integer, total_servicos integer, anos_experiencia integer, bio text, verificada boolean, respondido_em timestamp with time zone, distancia_km numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = _booking_id
      AND (b.cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ) THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
  END IF;

  RETURN QUERY
  SELECT c.id, p.id, pr.nome, pr.foto_url, p.nota_media, p.total_avaliacoes,
         p.total_servicos, p.anos_experiencia, p.bio, p.verificada, c.respondido_em,
         public.distancia_km(e.latitude, e.longitude, p.latitude, p.longitude)
  FROM public.booking_convites c
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.profiles pr ON pr.id = p.user_id
  JOIN public.bookings b ON b.id = c.booking_id
  LEFT JOIN public.enderecos e ON e.id = b.endereco_id
  WHERE c.booking_id = _booking_id AND c.status = 'aceito'
  ORDER BY c.respondido_em;
END;
$function$;