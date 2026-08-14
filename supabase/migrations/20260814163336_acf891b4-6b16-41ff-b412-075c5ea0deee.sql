-- 1. Profissionais: documentos e telefone de recado
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS doc_identidade_url text,
  ADD COLUMN IF NOT EXISTS doc_cpf_url text,
  ADD COLUMN IF NOT EXISTS telefone_recado text;

-- 2. Bloqueios de agenda
CREATE TABLE IF NOT EXISTS public.profissional_bloqueios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  data date NOT NULL,
  motivo text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profissional_id, data)
);

GRANT SELECT ON public.profissional_bloqueios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissional_bloqueios TO authenticated;
GRANT ALL ON public.profissional_bloqueios TO service_role;

ALTER TABLE public.profissional_bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bloqueios_select_all" ON public.profissional_bloqueios
  FOR SELECT USING (true);

CREATE POLICY "bloqueios_manage_own" ON public.profissional_bloqueios
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = profissional_bloqueios.profissional_id AND p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = profissional_bloqueios.profissional_id AND p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. Mensagens internas do admin para a profissional
CREATE TABLE IF NOT EXISTS public.mensagens_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id),
  mensagem text NOT NULL,
  lida_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mensagens_profissional TO authenticated;
GRANT ALL ON public.mensagens_profissional TO service_role;

ALTER TABLE public.mensagens_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensagens_select" ON public.mensagens_profissional
  FOR SELECT TO authenticated
  USING (profissional_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mensagens_insert_admin" ON public.mensagens_profissional
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mensagens_update" ON public.mensagens_profissional
  FOR UPDATE TO authenticated
  USING (profissional_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (profissional_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mensagens_delete_admin" ON public.mensagens_profissional
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Bookings: fluxo de aceite / recusa / confirmacao
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS recusadas uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS aceito_em timestamptz,
  ADD COLUMN IF NOT EXISTS cliente_confirmado_em timestamptz,
  ADD COLUMN IF NOT EXISTS pagamento_liberado_em timestamptz;

CREATE OR REPLACE FUNCTION public.bloquear_domingo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.data IS NOT NULL AND EXTRACT(DOW FROM NEW.data) = 0 THEN
    RAISE EXCEPTION 'Não realizamos serviços no domingo. Escolha outra data.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_sem_domingo ON public.bookings;
CREATE TRIGGER bookings_sem_domingo
  BEFORE INSERT OR UPDATE OF data ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_domingo();

-- 5. Avaliacoes: moderacao pelo admin
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS bloqueada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS editada_em timestamptz;

DROP POLICY IF EXISTS "avaliacoes_select_all" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_publicas" ON public.avaliacoes
  FOR SELECT USING (bloqueada = false OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "avaliacoes_update_admin" ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "avaliacoes_delete_admin" ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Disponibilidade real: somente profissionais livres na data/horario
CREATE OR REPLACE FUNCTION public.profissionais_disponiveis(
  _regiao text,
  _data date,
  _tipo_limpeza text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
  foto_url text,
  telefone text,
  cidade text,
  regiao text,
  bio text,
  anos_experiencia integer,
  nota_media numeric,
  total_avaliacoes integer,
  total_servicos integer,
  raio_km integer,
  latitude numeric,
  longitude numeric,
  tipos_limpeza text[],
  verificada boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, pr.nome, pr.foto_url, pr.telefone, p.cidade, p.regiao, p.bio,
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
$$;

GRANT EXECUTE ON FUNCTION public.profissionais_disponiveis(text, date, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sortear_profissional(
  _regiao text,
  _data date,
  _tipo_limpeza text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id
  FROM public.profissionais_disponiveis(_regiao, _data, _tipo_limpeza) d
  ORDER BY random()
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.sortear_profissional(text, date, text) TO anon, authenticated, service_role;

-- 7. Recusa com reatribuicao automatica
CREATE OR REPLACE FUNCTION public.recusar_booking(_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meu uuid;
  b public.bookings;
  novo uuid;
BEGIN
  SELECT id INTO meu FROM public.profissionais WHERE user_id = auth.uid() LIMIT 1;
  SELECT * INTO b FROM public.bookings WHERE id = _booking_id;

  IF b.id IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado.';
  END IF;
  IF meu IS NULL OR b.profissional_id IS DISTINCT FROM meu THEN
    RAISE EXCEPTION 'Você não pode recusar este serviço.';
  END IF;

  SELECT d.id INTO novo
  FROM public.profissionais_disponiveis(b.regiao, b.data, b.tipo_limpeza) d
  WHERE d.id <> meu
    AND NOT (d.id = ANY (COALESCE(b.recusadas, '{}'::uuid[])))
  ORDER BY random()
  LIMIT 1;

  UPDATE public.bookings
  SET recusadas = array_append(COALESCE(recusadas, '{}'::uuid[]), meu),
      profissional_id = novo,
      status = CASE WHEN novo IS NULL THEN 'sem_profissional' ELSE 'aguardando_aceite' END,
      aceito_em = NULL
  WHERE id = _booking_id;

  RETURN novo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recusar_booking(uuid) TO authenticated, service_role;