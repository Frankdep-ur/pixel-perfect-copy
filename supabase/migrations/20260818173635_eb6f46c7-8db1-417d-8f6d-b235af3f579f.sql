CREATE OR REPLACE FUNCTION public.confirmar_pagamento_booking(_booking_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  b public.bookings;
  prof uuid;
  v_bairro text;
  v_cidade text;
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

  SELECT e.bairro, e.cidade INTO v_bairro, v_cidade
  FROM public.enderecos e WHERE e.id = b.endereco_id;

  INSERT INTO public.notificacoes_whatsapp
    (booking_id, destinatario_nome, telefone, tipo, mensagem)
  SELECT _booking_id, pr.nome, pr.telefone, 'confirmacao',
    '✅ Faxina confirmada' || E'\n\n' ||
    'Sua contratação foi confirmada pelo Lar77.' || E'\n\n' ||
    '📅 Data: ' || to_char(b.data, 'DD/MM') || E'\n' ||
    '⏰ Horário: ' || to_char(b.hora, 'HH24:MI') || E'\n' ||
    '🕐 Duração: ' || b.duracao_horas || ' horas' || E'\n' ||
    '📍 Bairro: ' || COALESCE(v_bairro, '-') || ' — ' || COALESCE(v_cidade, '-') || E'\n\n' ||
    'Para acompanhar o andamento e visualizar as informações da contratação, acesse o Lar77.'
  FROM public.profiles pr
  JOIN public.profissionais p ON p.user_id = pr.id
  WHERE p.id = prof;

  RETURN prof;
END;
$function$;