CREATE OR REPLACE FUNCTION public.abrir_rodada_interna(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  b public.bookings;
  cfg jsonb;
  tamanho integer;
  prazo integer;
  raio integer;
  base_url text;
  nova_rodada integer;
  criados integer := 0;
  r record;
  novo_convite uuid;
  novo_token text;
  bairro text;
  cidade text;
  lat numeric;
  lng numeric;
  tem_aceite boolean;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;
  IF b.status <> 'buscando' THEN
    RETURN 0;
  END IF;

  SELECT valor INTO cfg FROM public.site_config WHERE chave = 'orquestra';
  tamanho := COALESCE((cfg ->> 'tamanho_rodada')::int, 5);
  prazo := COALESCE((cfg ->> 'prazo_aceite_min')::int, 5);
  raio := COALESCE((cfg ->> 'raio_km')::int, 15);
  base_url := COALESCE(NULLIF(cfg ->> 'base_url', ''), 'https://lar10.lovable.app');

  SELECT COALESCE(max(rodada), 0) + 1 INTO nova_rodada
  FROM public.booking_convites WHERE booking_id = _booking_id;

  SELECT e.bairro, e.cidade, e.latitude, e.longitude INTO bairro, cidade, lat, lng
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  FOR r IN
    SELECT d.id, d.user_id, d.nome, d.nota_media, d.distancia_km
    FROM public.profissionais_candidatas(b.regiao, b.data, NULL, lat, lng, raio) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.booking_convites c
      WHERE c.booking_id = _booking_id AND c.profissional_id = d.id
    )
    ORDER BY d.distancia_km NULLS LAST, d.nota_media DESC, random()
    LIMIT tamanho
  LOOP
    INSERT INTO public.booking_convites (booking_id, profissional_id, rodada, expira_em)
    VALUES (_booking_id, r.id, nova_rodada, now() + make_interval(mins => prazo))
    RETURNING id, token INTO novo_convite, novo_token;

    INSERT INTO public.notificacoes_whatsapp
      (booking_id, convite_id, destinatario_nome, telefone, tipo, mensagem)
    SELECT
      _booking_id, novo_convite, pr.nome, pr.telefone, 'oportunidade',
      '🧹 Nova oportunidade de faxina' || E'\n\n' ||
      'Serviço: ' || COALESCE(b.tipo_limpeza, 'faxina') || E'\n' ||
      'Duração: ' || b.duracao_horas || ' horas' || E'\n' ||
      'Data: ' || to_char(b.data, 'DD/MM') || E'\n' ||
      'Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
      'Bairro: ' || COALESCE(bairro, '-') || E'\n' ||
      'Cidade: ' || COALESCE(cidade, '-') || E'\n' ||
      CASE WHEN r.distancia_km IS NULL THEN '' ELSE 'Distância: ' || to_char(r.distancia_km, 'FM990D0') || ' km' || E'\n' END ||
      'Você recebe: R$ ' || to_char(b.valor_profissional, 'FM999G999D00') || E'\n\n' ||
      'Responda *1* para ACEITAR ou *2* se estiver INDISPONÍVEL.' || E'\n\n' ||
      '👉 Ou toque para abrir o Lar77 e aceitar:' || E'\n' ||
      base_url || '/oportunidade/' || novo_token || E'\n\n' ||
      'Você tem ' || prazo || ' minutos para responder.'
    FROM public.profiles pr WHERE pr.id = r.user_id;

    criados := criados + 1;
  END LOOP;

  IF criados = 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.booking_convites c
      WHERE c.booking_id = _booking_id AND c.status IN ('enviado', 'aceito')
    ) INTO tem_aceite;

    IF NOT tem_aceite THEN
      UPDATE public.bookings
      SET status = 'sem_profissional',
          reservado_profissional_id = NULL,
          reserva_expira_em = NULL
      WHERE id = _booking_id;
    END IF;
  END IF;

  RETURN criados;
END;
$fn$;

REVOKE ALL ON FUNCTION public.abrir_rodada_interna(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.abrir_rodada_interna(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abrir_rodada_interna(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.abrir_rodada_convites(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;
  IF b.cliente_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
  END IF;
  RETURN public.abrir_rodada_interna(_booking_id);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.reabrir_rodadas_pendentes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r record;
  total integer := 0;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

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
  END LOOP;

  RETURN total;
END;
$fn$;

REVOKE ALL ON FUNCTION public.reabrir_rodadas_pendentes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reabrir_rodadas_pendentes() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_rodadas_pendentes() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('reabrir-rodadas-convites')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reabrir-rodadas-convites');

SELECT cron.schedule(
  'reabrir-rodadas-convites',
  '* * * * *',
  $$SELECT public.reabrir_rodadas_pendentes();$$
);

SELECT public.reabrir_rodadas_pendentes();