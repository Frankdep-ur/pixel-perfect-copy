-- 1. Configurações do site
CREATE TABLE public.site_config (
  chave text PRIMARY KEY,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_config leitura publica" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "site_config admin escreve" ON public.site_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_config_updated_at BEFORE UPDATE ON public.site_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Chat interno
CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo text NOT NULL,
  lida_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mensagens_booking_idx ON public.mensagens (booking_id, criado_em);
GRANT SELECT, INSERT, UPDATE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.participa_booking(_booking_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    LEFT JOIN public.profissionais p ON p.id = b.profissional_id
    WHERE b.id = _booking_id
      AND (b.cliente_id = _user_id OR p.user_id = _user_id)
  )
$$;

CREATE POLICY "mensagens leitura participantes" ON public.mensagens FOR SELECT TO authenticated
  USING (public.participa_booking(booking_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mensagens envio participantes" ON public.mensagens FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND public.participa_booking(booking_id, auth.uid()));
CREATE POLICY "mensagens marcar lida" ON public.mensagens FOR UPDATE TO authenticated
  USING (public.participa_booking(booking_id, auth.uid()))
  WITH CHECK (public.participa_booking(booking_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;

-- 3. Cancelamentos
CREATE TABLE public.cancelamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  papel text NOT NULL DEFAULT 'cliente',
  motivo text,
  valor_total numeric NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cancelamentos_booking_idx ON public.cancelamentos (booking_id);
GRANT SELECT, INSERT ON public.cancelamentos TO authenticated;
GRANT ALL ON public.cancelamentos TO service_role;
ALTER TABLE public.cancelamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cancelamentos leitura" ON public.cancelamentos FOR SELECT TO authenticated
  USING (autor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cancelamentos registro" ON public.cancelamentos FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND public.participa_booking(booking_id, auth.uid()));

-- 4. PIX e campos em branco
ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS pix_tipo text,
  ADD COLUMN IF NOT EXISTS pix_chave text,
  ADD COLUMN IF NOT EXISTS pix_titular text,
  ALTER COLUMN anos_experiencia DROP NOT NULL,
  ALTER COLUMN anos_experiencia DROP DEFAULT,
  ALTER COLUMN raio_km DROP NOT NULL,
  ALTER COLUMN raio_km DROP DEFAULT;