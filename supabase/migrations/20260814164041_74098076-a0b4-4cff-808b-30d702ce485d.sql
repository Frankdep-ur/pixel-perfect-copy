-- 1) Disponibilidade pública sem telefone (PII)
DROP FUNCTION IF EXISTS public.profissionais_disponiveis(text, date, text);

CREATE FUNCTION public.profissionais_disponiveis(_regiao text, _data date, _tipo_limpeza text DEFAULT NULL::text)
RETURNS TABLE(
  id uuid, user_id uuid, nome text, foto_url text, cidade text, regiao text, bio text,
  anos_experiencia integer, nota_media numeric, total_avaliacoes integer, total_servicos integer,
  raio_km integer, latitude numeric, longitude numeric, tipos_limpeza text[], verificada boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.user_id, pr.nome, pr.foto_url, p.cidade, p.regiao, p.bio,
         p.anos_experiencia, p.nota_media, p.total_avaliacoes, p.total_servicos, p.raio_km,
         p.latitude, p.longitude, p.tipos_limpeza, p.verificada
  FROM public.profissionais p
  JOIN public.profiles pr ON pr.id = p.user_id
  WHERE p.status = 'aprovada'
    AND p.disponivel = true
    AND p.regiao = _regiao
    AND _data IS NOT NULL
    AND EXTRACT(DOW FROM _data) <> 0
    AND (_tipo_limpeza IS NULL OR p.tipos_limpeza = '{}'::text[] OR _tipo_limpeza = ANY (p.tipos_limpeza))
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
$function$;

REVOKE ALL ON FUNCTION public.profissionais_disponiveis(text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profissionais_disponiveis(text, date, text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.sortear_profissional(text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sortear_profissional(text, date, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.recusar_booking(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recusar_booking(uuid) TO authenticated, service_role;

-- 2) A profissional designada vê o endereço somente após aceitar
CREATE POLICY "enderecos_select_profissional_aceita"
ON public.enderecos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.endereco_id = enderecos.id
      AND p.user_id = auth.uid()
      AND b.status IN ('aceita', 'confirmada', 'a_caminho', 'em_andamento', 'finalizada', 'concluida')
  )
);

-- 3) Contato do cliente liberado para a profissional após o aceite
CREATE POLICY "profiles_select_cliente_do_servico"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.cliente_id = profiles.id
      AND p.user_id = auth.uid()
      AND b.status IN ('aceita', 'confirmada', 'a_caminho', 'em_andamento', 'finalizada', 'concluida')
  )
);

-- 4) Contato da profissional liberado para o cliente do serviço
CREATE POLICY "profiles_select_profissional_do_servico"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.cliente_id = auth.uid()
      AND p.user_id = profiles.id
  )
);
