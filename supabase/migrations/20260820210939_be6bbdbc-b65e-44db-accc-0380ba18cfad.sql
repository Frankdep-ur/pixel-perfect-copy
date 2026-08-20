ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS rua text,
  ADD COLUMN IF NOT EXISTS numero text,
  ADD COLUMN IF NOT EXISTS complemento text,
  ADD COLUMN IF NOT EXISTS bairro text,
  ADD COLUMN IF NOT EXISTS estado text;

CREATE TABLE IF NOT EXISTS public.booking_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.profiles(id),
  caminho text NOT NULL,
  legenda text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.booking_fotos TO authenticated;
GRANT ALL ON public.booking_fotos TO service_role;

ALTER TABLE public.booking_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem as fotos"
ON public.booking_fotos FOR SELECT TO authenticated
USING (public.participa_booking(booking_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profissional escalada envia fotos"
ON public.booking_fotos FOR INSERT TO authenticated
WITH CHECK (
  autor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Autor remove a propria foto"
ON public.booking_fotos FOR DELETE TO authenticated
USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.distancia_km(_lat1 numeric, _lng1 numeric, _lat2 numeric, _lng2 numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _lat1 IS NULL OR _lng1 IS NULL OR _lat2 IS NULL OR _lng2 IS NULL THEN NULL
    ELSE round((
      6371 * 2 * asin(sqrt(
        power(sin(radians((_lat2 - _lat1)::double precision) / 2), 2) +
        cos(radians(_lat1::double precision)) * cos(radians(_lat2::double precision)) *
        power(sin(radians((_lng2 - _lng1)::double precision) / 2), 2)
      ))
    )::numeric, 2)
  END
$$;

CREATE OR REPLACE FUNCTION public.profissionais_candidatas(
  _regiao text,
  _data date,
  _tipo_limpeza text DEFAULT NULL,
  _lat numeric DEFAULT NULL,
  _lng numeric DEFAULT NULL,
  _raio_km integer DEFAULT NULL
)
RETURNS TABLE(
  id uuid, user_id uuid, nome text, foto_url text, cidade text, regiao text, bio text,
  anos_experiencia integer, nota_media numeric, total_avaliacoes integer, total_servicos integer,
  raio_km integer, verificada boolean, distancia_km numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, pr.nome, pr.foto_url, p.cidade, p.regiao, p.bio,
         p.anos_experiencia, p.nota_media, p.total_avaliacoes, p.total_servicos, p.raio_km,
         p.verificada,
         public.distancia_km(_lat, _lng, p.latitude, p.longitude) AS distancia_km
  FROM public.profissionais p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.status = 'aprovada'
    AND p.disponivel = true
    AND _data IS NOT NULL
    AND EXTRACT(DOW FROM _data) <> 0
    AND (_tipo_limpeza IS NULL OR p.tipos_limpeza = '{}'::text[] OR _tipo_limpeza = ANY (p.tipos_limpeza))
    AND (
      CASE
        WHEN _lat IS NULL OR _lng IS NULL OR p.latitude IS NULL OR p.longitude IS NULL
          THEN p.regiao = _regiao
        ELSE public.distancia_km(_lat, _lng, p.latitude, p.longitude)
             <= LEAST(COALESCE(_raio_km, 15), COALESCE(p.raio_km, 15))
      END
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.profissional_bloqueios b
      WHERE b.profissional_id = p.id AND b.data = _data
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings bk
      WHERE bk.profissional_id = p.id
        AND bk.data = _data
        AND bk.status NOT IN ('cancelada', 'recusada', 'sem_profissional')
    )
$$;

CREATE OR REPLACE FUNCTION public.abrir_rodada_convites(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  IF b.cliente_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
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
$function$;

DROP FUNCTION IF EXISTS public.diagnostico_orquestra(uuid);

CREATE OR REPLACE FUNCTION public.diagnostico_orquestra(_booking_id uuid)
RETURNS TABLE(elegiveis integer, convidadas integer, raio_km integer, tem_coordenada boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b public.bookings;
  cfg jsonb;
  raio integer;
  lat numeric;
  lng numeric;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;
  IF b.id IS NULL THEN
    RAISE EXCEPTION 'Pedido não encontrado.';
  END IF;
  IF b.cliente_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
  END IF;

  SELECT valor INTO cfg FROM public.site_config WHERE chave = 'orquestra';
  raio := COALESCE((cfg ->> 'raio_km')::int, 15);

  SELECT e.latitude, e.longitude INTO lat, lng
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  RETURN QUERY
  SELECT
    (SELECT count(*)::int FROM public.profissionais_candidatas(b.regiao, b.data, NULL, lat, lng, raio)),
    (SELECT count(*)::int FROM public.booking_convites c WHERE c.booking_id = _booking_id),
    raio,
    (lat IS NOT NULL AND lng IS NOT NULL);
END;
$function$;

CREATE OR REPLACE FUNCTION public.confirmar_pagamento_booking(_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b public.bookings;
  prof uuid;
  v_endereco text;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF b.id IS NULL OR b.cliente_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
  END IF;
  IF b.status <> 'buscando' THEN
    RETURN b.profissional_id;
  END IF;
  IF b.reservado_profissional_id IS NULL OR b.reserva_expira_em < now() THEN
    RAISE EXCEPTION 'A reserva expirou. Escolha uma profissional novamente.';
  END IF;

  prof := b.reservado_profissional_id;

  UPDATE public.bookings
  SET profissional_id = prof,
      status = 'aceita',
      aceito_em = now(),
      reservado_profissional_id = NULL,
      reserva_expira_em = NULL
  WHERE id = _booking_id;

  UPDATE public.booking_convites
  SET status = 'encerrado'
  WHERE booking_id = _booking_id AND profissional_id <> prof AND status IN ('enviado', 'aceito');

  SELECT concat_ws(', ', nullif(concat_ws(' ', e.rua, e.numero), ''), nullif(e.complemento, ''),
                   nullif(e.bairro, ''), nullif(e.cidade, ''), nullif(e.estado, ''))
    INTO v_endereco
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, pr.nome, pr.telefone, 'confirmacao',
    '✅ Faxina confirmada' || E'\n\n' ||
    'Sua contratação foi confirmada pelo Lar77.' || E'\n\n' ||
    '📅 Data: ' || to_char(b.data, 'DD/MM') || E'\n' ||
    '⏰ Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
    '🕐 Duração: ' || b.duracao_horas || ' horas' || E'\n' ||
    '📍 Local: ' || COALESCE(v_endereco, '-') || E'\n' ||
    '💰 Você recebe: R$ ' || to_char(b.valor_profissional, 'FM999G999D00') || E'\n\n' ||
    'Abra o Lar77 para ver todos os detalhes e falar com o cliente pelo chat.'
  FROM public.profiles pr
  JOIN public.profissionais p ON p.user_id = pr.id
  WHERE p.id = prof;

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, convite_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, c.id, pr.nome, pr.telefone, 'encerramento',
    'Obrigado por se disponibilizar! 🙏' || E'\n\n' ||
    'O cliente escolheu outra profissional para a faxina de ' ||
    to_char(b.data, 'DD/MM') || '. Avisamos você na próxima oportunidade.'
  FROM public.booking_convites c
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE c.booking_id = _booking_id AND c.profissional_id <> prof AND c.status = 'encerrado';

  RETURN prof;
END;
$function$;

CREATE OR REPLACE FUNCTION public.marcar_mensagens_lidas(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total integer;
BEGIN
  IF NOT public.participa_booking(_booking_id, auth.uid()) THEN
    RAISE EXCEPTION 'Sem permissão para esta conversa.';
  END IF;

  UPDATE public.mensagens
  SET lida_em = now()
  WHERE booking_id = _booking_id AND autor_id <> auth.uid() AND lida_em IS NULL;

  GET DIAGNOSTICS total = ROW_COUNT;
  RETURN total;
END;
$function$;