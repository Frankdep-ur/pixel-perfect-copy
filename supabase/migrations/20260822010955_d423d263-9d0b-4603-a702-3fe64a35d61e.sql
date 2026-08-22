UPDATE public.site_config
SET valor = valor || jsonb_build_object('prazo_aceite_min', 120, 'prazo_min_antes_inicio_min', 60),
    atualizado_em = now()
WHERE chave = 'orquestra';

CREATE OR REPLACE FUNCTION public.prazo_convite(_data date, _hora time without time zone)
RETURNS timestamp with time zone
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cfg jsonb;
  prazo_min integer;
  antes_min integer;
  inicio timestamptz;
  limite timestamptz;
BEGIN
  SELECT valor INTO cfg FROM public.site_config WHERE chave = 'orquestra';
  prazo_min := COALESCE((cfg ->> 'prazo_aceite_min')::int, 120);
  antes_min := COALESCE((cfg ->> 'prazo_min_antes_inicio_min')::int, 60);

  IF _data IS NULL THEN
    RETURN now() + make_interval(mins => prazo_min);
  END IF;

  inicio := (_data + COALESCE(_hora, time '08:00'))::timestamptz;
  limite := inicio - make_interval(mins => antes_min);

  IF limite <= now() THEN
    RETURN NULL;
  END IF;

  RETURN LEAST(limite, now() + make_interval(mins => prazo_min));
END;
$function$;

REVOKE ALL ON FUNCTION public.prazo_convite(date, time without time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prazo_convite(date, time without time zone) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.abrir_rodada_interna(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b public.bookings;
  cfg jsonb;
  tamanho integer;
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
  prazo_ate timestamptz;
  prazo_txt text;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;
  IF b.status <> 'buscando' THEN
    RETURN 0;
  END IF;

  prazo_ate := public.prazo_convite(b.data, b.hora);
  IF prazo_ate IS NULL THEN
    RETURN 0;
  END IF;

  SELECT valor INTO cfg FROM public.site_config WHERE chave = 'orquestra';
  tamanho := COALESCE((cfg ->> 'tamanho_rodada')::int, 5);
  raio := COALESCE((cfg ->> 'raio_km')::int, 15);
  base_url := COALESCE(NULLIF(cfg ->> 'base_url', ''), 'https://lar10.lovable.app');

  prazo_txt := CASE
    WHEN prazo_ate - now() >= interval '2 hours'
      THEN floor(extract(epoch FROM (prazo_ate - now())) / 3600)::int || ' horas'
    WHEN prazo_ate - now() >= interval '1 hour' THEN '1 hora'
    ELSE greatest(1, floor(extract(epoch FROM (prazo_ate - now())) / 60)::int) || ' minutos'
  END;

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
    VALUES (_booking_id, r.id, nova_rodada, prazo_ate)
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
      'Você tem ' || prazo_txt || ' para responder.'
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
$function$;

CREATE OR REPLACE FUNCTION public.reabrir_rodadas_pendentes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  total integer := 0;
  prazo_ate timestamptz;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

  FOR r IN
    SELECT bk.id, bk.data, bk.hora
    FROM public.bookings bk
    WHERE bk.status IN ('buscando', 'sem_profissional')
      AND bk.data IS NOT NULL
      AND bk.profissional_id IS NULL
      AND public.prazo_convite(bk.data, bk.hora) IS NOT NULL
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

    prazo_ate := public.prazo_convite(r.data, r.hora);

    -- Convite vencido sem resposta volta a valer: o prazo só é estendido, nunca encurtado.
    IF prazo_ate IS NOT NULL THEN
      UPDATE public.booking_convites c
      SET status = 'enviado',
          expira_em = GREATEST(c.expira_em, prazo_ate)
      WHERE c.booking_id = r.id
        AND c.status = 'expirado'
        AND EXISTS (
          SELECT 1 FROM public.profissionais p
          WHERE p.id = c.profissional_id
            AND p.status = 'aprovada'
            AND p.disponivel = true
        );
    END IF;
  END LOOP;

  RETURN total;
END;
$function$;

CREATE OR REPLACE FUNCTION public.convites_profissional()
RETURNS TABLE(id uuid, status text, expira_em timestamp with time zone, rodada integer, criado_em timestamp with time zone, booking_id uuid, booking_status text, codigo text, tipo_limpeza text, tipo_imovel text, duracao_horas integer, data date, hora time without time zone, bairro text, cidade text, valor_profissional numeric, escolhida boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT c.id, c.status, c.expira_em, c.rodada, c.criado_em,
         b.id, b.status, b.codigo, b.tipo_limpeza, b.tipo_imovel,
         b.duracao_horas, b.data, b.hora, e.bairro, e.cidade,
         b.valor_profissional,
         (b.profissional_id = c.profissional_id)
  FROM public.booking_convites c
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.bookings b ON b.id = c.booking_id
  LEFT JOIN public.enderecos e ON e.id = b.endereco_id
  WHERE p.user_id = auth.uid()
    AND (
      c.status NOT IN ('enviado', 'expirado')
      OR b.data IS NULL
      OR (b.data + COALESCE(b.hora, time '08:00'))::timestamptz > now()
    )
  ORDER BY c.criado_em DESC
  LIMIT 30
$function$;

UPDATE public.booking_convites c
SET expira_em = GREATEST(c.expira_em, public.prazo_convite(b.data, b.hora))
FROM public.bookings b
WHERE b.id = c.booking_id
  AND c.status = 'enviado'
  AND public.prazo_convite(b.data, b.hora) IS NOT NULL;