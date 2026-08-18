-- 1. Campos de reserva temporária no booking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reservado_profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserva_expira_em timestamptz;

-- 2. Convites de oportunidade
CREATE TABLE IF NOT EXISTS public.booking_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  rodada integer NOT NULL DEFAULT 1,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status text NOT NULL DEFAULT 'enviado',
  expira_em timestamptz NOT NULL,
  respondido_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, profissional_id)
);

GRANT SELECT ON public.booking_convites TO authenticated;
GRANT ALL ON public.booking_convites TO service_role;
ALTER TABLE public.booking_convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profissional ve seus convites" ON public.booking_convites
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profissionais p
    WHERE p.id = booking_convites.profissional_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "admin ve todos os convites" ON public.booking_convites
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "cliente ve convites do seu pedido" ON public.booking_convites
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_convites.booking_id AND b.cliente_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS booking_convites_booking_idx ON public.booking_convites (booking_id);
CREATE INDEX IF NOT EXISTS booking_convites_prof_idx ON public.booking_convites (profissional_id, status);

-- 3. Fila de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS public.notificacoes_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  convite_id uuid REFERENCES public.booking_convites(id) ON DELETE SET NULL,
  destinatario_nome text,
  telefone text,
  tipo text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  enviado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.notificacoes_whatsapp TO authenticated;
GRANT ALL ON public.notificacoes_whatsapp TO service_role;
ALTER TABLE public.notificacoes_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin ve notificacoes" ON public.notificacoes_whatsapp
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin atualiza notificacoes" ON public.notificacoes_whatsapp
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS notificacoes_whatsapp_criado_idx ON public.notificacoes_whatsapp (criado_em DESC);

-- 4. Configuração da orquestra
INSERT INTO public.site_config (chave, valor)
VALUES ('orquestra', '{"prazo_aceite_min": 5, "prazo_reserva_min": 5, "tamanho_rodada": 5}'::jsonb)
ON CONFLICT (chave) DO NOTHING;

-- 5. Expirar convites e reservas vencidas
CREATE OR REPLACE FUNCTION public.expirar_convites_e_reservas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.booking_convites
  SET status = 'expirado'
  WHERE status = 'enviado' AND expira_em < now();

  UPDATE public.bookings
  SET reservado_profissional_id = NULL, reserva_expira_em = NULL
  WHERE status = 'buscando'
    AND reserva_expira_em IS NOT NULL
    AND reserva_expira_em < now();
END;
$$;

-- 6. Abrir uma rodada de convites para um pedido em busca
CREATE OR REPLACE FUNCTION public.abrir_rodada_convites(_booking_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.bookings;
  cfg jsonb;
  tamanho integer;
  prazo integer;
  nova_rodada integer;
  criados integer := 0;
  r record;
  novo_convite uuid;
  bairro text;
  cidade text;
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

  SELECT COALESCE(max(rodada), 0) + 1 INTO nova_rodada
  FROM public.booking_convites WHERE booking_id = _booking_id;

  SELECT e.bairro, e.cidade INTO bairro, cidade
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  FOR r IN
    SELECT d.id, d.user_id, d.nome
    FROM public.profissionais_disponiveis(b.regiao, b.data, NULL) d
    WHERE NOT EXISTS (
      SELECT 1 FROM public.booking_convites c
      WHERE c.booking_id = _booking_id AND c.profissional_id = d.id
    )
    ORDER BY d.nota_media DESC, random()
    LIMIT tamanho
  LOOP
    INSERT INTO public.booking_convites (booking_id, profissional_id, rodada, expira_em)
    VALUES (_booking_id, r.id, nova_rodada, now() + make_interval(mins => prazo))
    RETURNING id INTO novo_convite;

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
      'Cidade: ' || COALESCE(cidade, '-') || E'\n\n' ||
      'Você tem ' || prazo || ' minutos para responder no Lar77.'
    FROM public.profiles pr WHERE pr.id = r.user_id;

    criados := criados + 1;
  END LOOP;

  RETURN criados;
END;
$$;

-- 7. Responder convite (app autenticado)
CREATE OR REPLACE FUNCTION public.responder_convite(_convite_id uuid, _aceitar boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.booking_convites;
  meu uuid;
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
      respondido_em = now()
  WHERE id = c.id;

  RETURN CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
END;
$$;

-- 8. Convite pelo token (link público do WhatsApp)
CREATE OR REPLACE FUNCTION public.convite_por_token(_token text)
RETURNS TABLE(
  convite_id uuid, status text, expira_em timestamptz, profissional_nome text,
  tipo_limpeza text, duracao_horas integer, data date, hora time,
  bairro text, cidade text, valor_profissional numeric, booking_status text,
  escolhida boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.status, c.expira_em, pr.nome,
         b.tipo_limpeza, b.duracao_horas, b.data, b.hora,
         e.bairro, e.cidade, b.valor_profissional, b.status,
         (b.profissional_id = c.profissional_id)
  FROM public.booking_convites c
  JOIN public.bookings b ON b.id = c.booking_id
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.profiles pr ON pr.id = p.user_id
  LEFT JOIN public.enderecos e ON e.id = b.endereco_id
  WHERE c.token = _token
$$;

CREATE OR REPLACE FUNCTION public.responder_convite_token(_token text, _aceitar boolean)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.booking_convites;
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
      respondido_em = now()
  WHERE id = c.id;

  RETURN CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convite_por_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.responder_convite_token(text, boolean) TO anon, authenticated;

-- 9. Profissionais que aceitaram (visão do cliente, sem telefone)
CREATE OR REPLACE FUNCTION public.convites_aceitos(_booking_id uuid)
RETURNS TABLE(
  convite_id uuid, profissional_id uuid, nome text, foto_url text,
  nota_media numeric, total_avaliacoes integer, total_servicos integer,
  anos_experiencia integer, bio text, verificada boolean, respondido_em timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
         p.total_servicos, p.anos_experiencia, p.bio, p.verificada, c.respondido_em
  FROM public.booking_convites c
  JOIN public.profissionais p ON p.id = c.profissional_id
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE c.booking_id = _booking_id AND c.status = 'aceito'
  ORDER BY c.respondido_em;
END;
$$;

-- 10. Reserva temporária da profissional escolhida
CREATE OR REPLACE FUNCTION public.reservar_profissional(_booking_id uuid, _profissional_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.bookings;
  cfg jsonb;
  prazo integer;
  ate timestamptz;
BEGIN
  PERFORM public.expirar_convites_e_reservas();

  SELECT * INTO b FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF b.id IS NULL OR b.cliente_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão para este pedido.';
  END IF;
  IF b.status <> 'buscando' THEN
    RAISE EXCEPTION 'Este pedido já foi confirmado.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.booking_convites c
    WHERE c.booking_id = _booking_id AND c.profissional_id = _profissional_id AND c.status = 'aceito'
  ) THEN
    RAISE EXCEPTION 'Esta profissional não está mais disponível.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings o
    WHERE o.id <> _booking_id
      AND o.reservado_profissional_id = _profissional_id
      AND o.reserva_expira_em > now()
  ) THEN
    RAISE EXCEPTION 'Esta profissional acabou de ser reservada em outro pedido.';
  END IF;

  SELECT valor INTO cfg FROM public.site_config WHERE chave = 'orquestra';
  prazo := COALESCE((cfg ->> 'prazo_reserva_min')::int, 5);
  ate := now() + make_interval(mins => prazo);

  UPDATE public.bookings
  SET reservado_profissional_id = _profissional_id, reserva_expira_em = ate
  WHERE id = _booking_id;

  RETURN ate;
END;
$$;

-- 11. Confirmar pedido após pagamento da reserva
CREATE OR REPLACE FUNCTION public.confirmar_pagamento_booking(_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  b public.bookings;
  prof uuid;
  bairro text;
  cidade text;
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

  SELECT e.bairro, e.cidade INTO bairro, cidade
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, pr.nome, pr.telefone, 'confirmacao',
    '✅ Faxina confirmada' || E'\n\n' ||
    'Sua contratação foi confirmada pelo Lar77.' || E'\n\n' ||
    '📅 Data: ' || to_char(b.data, 'DD/MM') || E'\n' ||
    '⏰ Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
    '🕐 Duração: ' || b.duracao_horas || ' horas' || E'\n' ||
    '📍 Bairro: ' || COALESCE(bairro, '-') || ' — ' || COALESCE(cidade, '-') || E'\n\n' ||
    'Para acompanhar o andamento e visualizar as informações da contratação, acesse o Lar77.'
  FROM public.profiles pr
  JOIN public.profissionais p ON p.user_id = pr.id
  WHERE p.id = prof;

  RETURN prof;
END;
$$;
