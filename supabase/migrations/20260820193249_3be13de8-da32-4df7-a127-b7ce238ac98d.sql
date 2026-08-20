CREATE OR REPLACE FUNCTION public.convites_profissional()
RETURNS TABLE(
  id uuid,
  status text,
  expira_em timestamp with time zone,
  rodada integer,
  criado_em timestamp with time zone,
  booking_id uuid,
  booking_status text,
  codigo text,
  tipo_limpeza text,
  tipo_imovel text,
  duracao_horas integer,
  data date,
  hora time without time zone,
  bairro text,
  cidade text,
  valor_profissional numeric,
  escolhida boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  ORDER BY c.criado_em DESC
  LIMIT 30
$$;