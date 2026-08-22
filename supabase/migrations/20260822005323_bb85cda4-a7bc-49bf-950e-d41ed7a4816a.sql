CREATE OR REPLACE FUNCTION public.reabrir_rodadas_pendentes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r record;
  total integer := 0;
  prazo integer;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

  SELECT COALESCE((valor ->> 'prazo_aceite_min')::int, 5) INTO prazo
  FROM public.site_config WHERE chave = 'orquestra';
  prazo := COALESCE(prazo, 5);

  FOR r IN
    SELECT bk.id
    FROM public.bookings bk
    WHERE bk.status IN ('buscando', 'sem_profissional')
      AND bk.data IS NOT NULL
      AND bk.data >= current_date
      AND bk.profissional_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.booking_convites c
        WHERE c.booking_id = bk.id
          AND (c.status = 'aceito' OR (c.status = 'enviado' AND c.expira_em > now()))
      )
    ORDER BY bk.data, bk.criado_em
    LIMIT 50
  LOOP
    UPDATE public.bookings SET status = 'buscando'
    WHERE id = r.id AND status = 'sem_profissional';

    total := total + public.abrir_rodada_interna(r.id);

    -- Convite vencido sem resposta volta a valer: quem não respondeu ainda pode aceitar.
    UPDATE public.booking_convites c
    SET status = 'enviado',
        expira_em = now() + make_interval(mins => prazo)
    WHERE c.booking_id = r.id
      AND c.status = 'expirado'
      AND EXISTS (
        SELECT 1 FROM public.profissionais p
        WHERE p.id = c.profissional_id
          AND p.status = 'aprovada'
          AND p.disponivel = true
      );
  END LOOP;

  RETURN total;
END;
$fn$;

REVOKE ALL ON FUNCTION public.reabrir_rodadas_pendentes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reabrir_rodadas_pendentes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_rodadas_pendentes() TO service_role;