ALTER TABLE public.booking_convites
  ADD COLUMN IF NOT EXISTS canal_resposta text;

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
  base_url text;
  nova_rodada integer;
  criados integer := 0;
  r record;
  novo_convite uuid;
  novo_token text;
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
  base_url := COALESCE(NULLIF(cfg ->> 'base_url', ''), 'https://lar77.lovable.app');

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
      'Você recebe: R$ ' || to_char(b.valor_profissional, 'FM999G999D00') || E'\n\n' ||
      '👉 Toque para abrir o Lar77 e aceitar:' || E'\n' ||
      base_url || '/oportunidade/' || novo_token || E'\n\n' ||
      'Você tem ' || prazo || ' minutos para responder.'
    FROM public.profiles pr WHERE pr.id = r.user_id;

    criados := criados + 1;
  END LOOP;

  RETURN criados;
END;
$function$;

CREATE OR REPLACE FUNCTION public.responder_convite(_convite_id uuid, _aceitar boolean)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      respondido_em = now(),
      canal_resposta = 'app'
  WHERE id = c.id;

  RETURN CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
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

  RETURN CASE WHEN _aceitar THEN 'aceito' ELSE 'indisponivel' END;
END;
$function$;