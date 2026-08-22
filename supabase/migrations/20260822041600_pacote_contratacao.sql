-- Pacote de contratação:
-- 1) tipo do imóvel no cadastro do endereço
-- 2) extras só churrasqueira + forno/geladeira
-- 3) taxa 17% (profissional vê 83% do total do cliente)
-- 4) convite para TODAS no raio de 15 km, prazo de 5 minutos
-- 5) textos de WhatsApp alinhados ao fluxo de disponibilidade

ALTER TABLE public.enderecos
  ADD COLUMN IF NOT EXISTS tipo_imovel text;

UPDATE public.pricing_config
SET valor = 0.17, descricao = 'Taxa administrativa da Lar77 (fração do total do cliente)'
WHERE chave = 'taxa_admin_percentual';

UPDATE public.pricing_config
SET valor = 0, descricao = 'Seguro incluso na taxa administrativa'
WHERE chave = 'valor_seguro';

-- Extras: só dois ativos.
UPDATE public.extras SET ativo = false;

UPDATE public.extras
SET ativo = true,
    descricao = 'Grelhas, grade e interior da churrasqueira'
WHERE nome = 'Limpeza de churrasqueira';

INSERT INTO public.extras (nome, descricao, preco, minutos_adicionais, ativo)
SELECT
  'Limpeza de forno e geladeira',
  'Limpeza interna e externa do forno e da geladeira',
  45,
  50,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.extras WHERE nome = 'Limpeza de forno e geladeira'
);

UPDATE public.extras
SET ativo = true,
    descricao = 'Limpeza interna e externa do forno e da geladeira',
    preco = 45,
    minutos_adicionais = 50
WHERE nome = 'Limpeza de forno e geladeira';

UPDATE public.site_config
SET valor = valor || jsonb_build_object(
  'prazo_aceite_min', 5,
  'prazo_reserva_min', 5,
  'tamanho_rodada', 500,
  'raio_km', 15
),
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
  prazo_min := COALESCE((cfg ->> 'prazo_aceite_min')::int, 5);
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

CREATE OR REPLACE FUNCTION public.abrir_rodada_interna(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  b public.bookings;
  cfg jsonb;
  raio integer;
  nova_rodada integer;
  criados integer := 0;
  r record;
  novo_convite uuid;
  bairro text;
  cidade text;
  lat numeric;
  lng numeric;
  tem_aceite boolean;
  prazo_ate timestamptz;
  primeiro text;
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
  raio := COALESCE((cfg ->> 'raio_km')::int, 15);

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
  LOOP
    INSERT INTO public.booking_convites (booking_id, profissional_id, rodada, expira_em)
    VALUES (_booking_id, r.id, nova_rodada, prazo_ate)
    RETURNING id INTO novo_convite;

    primeiro := split_part(COALESCE(r.nome, 'profissional'), ' ', 1);

    INSERT INTO public.notificacoes_whatsapp
      (booking_id, convite_id, destinatario_nome, telefone, tipo, mensagem)
    SELECT
      _booking_id, novo_convite, pr.nome, pr.telefone, 'oportunidade',
      '🔔 NOVA OPORTUNIDADE DE SERVIÇO — LAR77' || E'\n\n' ||
      'Olá, ' || primeiro || '!' || E'\n\n' ||
      'Temos uma nova oportunidade de serviço compatível com o seu perfil.' || E'\n\n' ||
      '📅 Data: ' || to_char(b.data, 'DD/MM/YYYY') || E'\n' ||
      '🕒 Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
      '⏱️ Duração estimada: ' || b.duracao_horas || ' horas' || E'\n' ||
      '📍 Local: ' || COALESCE(bairro, '-') || ' — ' || COALESCE(cidade, '-') || E'\n' ||
      '💰 Valor que você receberá: R$ ' || to_char(b.valor_profissional, 'FM999G999D00') || E'\n\n' ||
      'Caso tenha interesse e disponibilidade para realizar este serviço, responda:' || E'\n\n' ||
      '1️⃣ — TENHO INTERESSE E ESTOU DISPONÍVEL' || E'\n' ||
      '2️⃣ — NÃO TENHO INTERESSE' || E'\n\n' ||
      '⏳ Você tem até 5 minutos para responder.' || E'\n\n' ||
      '⚠️ Importante: responder 1 não significa que o serviço já foi confirmado para você. Sua resposta apenas informará à LAR77 que você tem interesse e disponibilidade para esta oportunidade.' || E'\n\n' ||
      'Após o encerramento do prazo, o cliente poderá visualizar e escolher, entre as profissionais disponíveis, aquela que melhor atende às suas necessidades.' || E'\n\n' ||
      'LAR77 — Diaristas de Confiança'
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

-- Não reabre rodada nem revive convite expirado: a janela é uma só, de 5 minutos.
CREATE OR REPLACE FUNCTION public.reabrir_rodadas_pendentes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.expirar_convites_e_reservas();
  RETURN 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enfileirar_disponibilidade(_convite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  c public.booking_convites;
  nome text;
  fone text;
  primeiro text;
BEGIN
  SELECT * INTO c FROM public.booking_convites WHERE id = _convite_id;
  IF c.id IS NULL OR c.status <> 'aceito' THEN
    RETURN;
  END IF;

  SELECT pr.nome, pr.telefone INTO nome, fone
  FROM public.profissionais p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.id = c.profissional_id;

  IF fone IS NULL OR length(fone) < 8 THEN
    RETURN;
  END IF;

  primeiro := split_part(COALESCE(nome, 'profissional'), ' ', 1);

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, convite_id, destinatario_nome, telefone, tipo, mensagem)
  VALUES (
    c.booking_id,
    c.id,
    nome,
    fone,
    'resposta_convite',
    '✅ DISPONIBILIDADE REGISTRADA!' || E'\n\n' ||
    'Olá, ' || primeiro || '!' || E'\n\n' ||
    'Recebemos sua resposta e você foi incluída na lista de profissionais disponíveis para esta oportunidade.' || E'\n\n' ||
    'Agora o cliente poderá analisar os perfis das profissionais que demonstraram interesse e disponibilidade.' || E'\n\n' ||
    '⚠️ Importante: sua disponibilidade ainda não representa a confirmação do serviço. A contratação somente será confirmada após a escolha do cliente e a confirmação do pagamento.' || E'\n\n' ||
    'Caso seja selecionada, você receberá uma nova mensagem com a confirmação e as informações necessárias para a realização do serviço.' || E'\n\n' ||
    'LAR77 — Diaristas de Confiança'
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.enfileirar_disponibilidade(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.responder_convite(_convite_id uuid, _aceitar boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.booking_convites;
  meu uuid;
  resultado text;
BEGIN
  SELECT id INTO meu FROM public.profissionais WHERE user_id = auth.uid() LIMIT 1;
  SELECT * INTO c FROM public.booking_convites WHERE id = _convite_id;
  IF c.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado.';
  END IF;
  IF meu IS NULL OR c.profissional_id <> meu THEN
    RAISE EXCEPTION 'Este convite não é seu.';
  END IF;
  IF c.status <> 'enviado' THEN
    RETURN c.status;
  END IF;
  IF c.expira_em < now() THEN
    UPDATE public.booking_convites SET status = 'expirado' WHERE id = c.id;
    RETURN 'expirado';
  END IF;

  UPDATE public.booking_convites
  SET status = CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END,
      respondido_em = now(),
      canal_resposta = 'app'
  WHERE id = c.id;

  resultado := CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
  IF _aceitar THEN
    PERFORM public.enfileirar_disponibilidade(c.id);
  END IF;
  RETURN resultado;
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
  nome_prof text;
  primeiro text;
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

  SELECT pr.nome INTO nome_prof
  FROM public.profissionais p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.id = prof;
  primeiro := split_part(COALESCE(nome_prof, 'profissional'), ' ', 1);

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, pr.nome, pr.telefone, 'confirmacao',
    '🎉 PARABÉNS! VOCÊ FOI SELECIONADA.' || E'\n\n' ||
    'Olá, ' || primeiro || '!' || E'\n\n' ||
    'O cliente escolheu o seu perfil para realizar o serviço e o pagamento foi confirmado. ✅' || E'\n\n' ||
    '📅 Data: ' || to_char(b.data, 'DD/MM/YYYY') || E'\n' ||
    '🕒 Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
    '⏱️ Duração estimada: ' || b.duracao_horas || ' horas' || E'\n' ||
    '📍 Local: ' || COALESCE(v_endereco, '-') || E'\n' ||
    '💰 Valor que você receberá: R$ ' || to_char(b.valor_profissional, 'FM999G999D00') || E'\n\n' ||
    'O serviço agora está CONFIRMADO PARA VOCÊ.' || E'\n\n' ||
    'Acesse a LAR77 para visualizar todos os detalhes e acompanhar o seu agendamento.' || E'\n\n' ||
    'LAR77 — Diaristas de Confiança'
  FROM public.profiles pr
  JOIN public.profissionais p ON p.user_id = pr.id
  WHERE p.id = prof;

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, convite_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, c.id, pr.nome, pr.telefone, 'encerramento',
    'Olá, ' || split_part(COALESCE(pr.nome, 'profissional'), ' ', 1) || '!' || E'\n\n' ||
    'O cliente escolheu outra profissional para esta oportunidade e o serviço já foi confirmado.' || E'\n\n' ||
    'Agradecemos o seu interesse e disponibilidade. Avisamos você na próxima oportunidade compatível com o seu perfil.' || E'\n\n' ||
    'LAR77 — Diaristas de Confiança'
  FROM public.booking_convites c
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE c.booking_id = _booking_id AND c.profissional_id <> prof AND c.status = 'encerrado';

  RETURN prof;
END;
$function$;

CREATE OR REPLACE FUNCTION public.responder_convite_token(_token text, _aceitar boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  c public.booking_convites;
  resultado text;
BEGIN
  SELECT * INTO c FROM public.booking_convites WHERE token = _token;
  IF c.id IS NULL THEN
    RAISE EXCEPTION 'Convite não encontrado.';
  END IF;
  IF c.status <> 'enviado' THEN
    RETURN c.status;
  END IF;
  IF c.expira_em < now() THEN
    UPDATE public.booking_convites SET status = 'expirado' WHERE id = c.id;
    RETURN 'expirado';
  END IF;

  UPDATE public.booking_convites
  SET status = CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END,
      respondido_em = now(),
      canal_resposta = 'link'
  WHERE id = c.id;

  resultado := CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
  IF _aceitar THEN
    PERFORM public.enfileirar_disponibilidade(c.id);
  END IF;
  RETURN resultado;
END;
$function$;

