-- ============ enums ============
CREATE TYPE public.app_role AS ENUM ('cliente', 'profissional', 'admin');

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  cpf TEXT,
  data_nascimento DATE,
  foto_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ enderecos ============
CREATE TABLE public.enderecos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  regiao TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  padrao BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enderecos TO authenticated;
GRANT ALL ON public.enderecos TO service_role;
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enderecos_own" ON public.enderecos FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid());

-- ============ profissionais ============
CREATE TABLE public.profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  anos_experiencia INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  nota_media NUMERIC NOT NULL DEFAULT 0,
  total_avaliacoes INT NOT NULL DEFAULT 0,
  total_servicos INT NOT NULL DEFAULT 0,
  raio_km INT NOT NULL DEFAULT 15,
  cidade TEXT,
  regiao TEXT,
  cidades_atendidas TEXT[] NOT NULL DEFAULT '{}',
  latitude NUMERIC,
  longitude NUMERIC,
  tipos_limpeza TEXT[] NOT NULL DEFAULT '{}',
  verificada BOOLEAN NOT NULL DEFAULT false,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  documento_url TEXT,
  comprovante_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profissionais TO authenticated;
GRANT SELECT ON public.profissionais TO anon;
GRANT ALL ON public.profissionais TO service_role;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profissionais_select_aprovadas" ON public.profissionais FOR SELECT
  USING (status = 'aprovada');
CREATE POLICY "profissionais_select_own" ON public.profissionais FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profissionais_insert_own" ON public.profissionais FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "profissionais_update_own" ON public.profissionais FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- perfis visíveis: o próprio, admin, e perfis de profissionais aprovadas
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_select_profissionais" ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profissionais p WHERE p.user_id = profiles.id AND p.status = 'aprovada'
  ));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============ disponibilidade ============
CREATE TABLE public.disponibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disponibilidade TO authenticated;
GRANT SELECT ON public.disponibilidade TO anon;
GRANT ALL ON public.disponibilidade TO service_role;
ALTER TABLE public.disponibilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disponibilidade_select_all" ON public.disponibilidade FOR SELECT USING (true);
CREATE POLICY "disponibilidade_manage_own" ON public.disponibilidade FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = profissional_id AND p.user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profissionais p WHERE p.id = profissional_id AND p.user_id = auth.uid())
         OR public.has_role(auth.uid(), 'admin'));

-- ============ extras ============
CREATE TABLE public.extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL DEFAULT 0,
  minutos_adicionais INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.extras TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.extras TO authenticated;
GRANT ALL ON public.extras TO service_role;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extras_select_all" ON public.extras FOR SELECT USING (true);
CREATE POLICY "extras_admin" ON public.extras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ pricing_config ============
CREATE TABLE public.pricing_config (
  chave TEXT PRIMARY KEY,
  valor NUMERIC NOT NULL,
  descricao TEXT
);
GRANT SELECT ON public.pricing_config TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_config TO authenticated;
GRANT ALL ON public.pricing_config TO service_role;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_select_all" ON public.pricing_config FOR SELECT USING (true);
CREATE POLICY "pricing_admin" ON public.pricing_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ bookings ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES public.profissionais(id) ON DELETE SET NULL,
  endereco_id UUID REFERENCES public.enderecos(id) ON DELETE SET NULL,
  tipo_imovel TEXT,
  quartos INT NOT NULL DEFAULT 0,
  salas INT NOT NULL DEFAULT 0,
  banheiros INT NOT NULL DEFAULT 1,
  cozinha BOOLEAN NOT NULL DEFAULT true,
  area_externa TEXT NOT NULL DEFAULT 'nao',
  outros_ambientes TEXT,
  duracao_horas INT NOT NULL DEFAULT 4,
  tipo_limpeza TEXT NOT NULL DEFAULT 'padrao',
  observacoes TEXT,
  problema_relatado TEXT,
  data DATE,
  hora TIME,
  valor_profissional NUMERIC NOT NULL DEFAULT 0,
  valor_extras NUMERIC NOT NULL DEFAULT 0,
  taxa_admin NUMERIC NOT NULL DEFAULT 0,
  valor_seguro NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'solicitada',
  regiao TEXT,
  checkin_em TIMESTAMPTZ,
  iniciado_em TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE public.booking_codigo_seq;
GRANT USAGE ON SEQUENCE public.booking_codigo_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_booking_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo IS NULL THEN
    NEW.codigo := 'LAR-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.booking_codigo_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_codigo BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_codigo();

CREATE POLICY "bookings_select_cliente" ON public.bookings FOR SELECT TO authenticated
  USING (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings_select_profissional" ON public.bookings FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profissionais p
            WHERE p.user_id = auth.uid()
              AND (p.id = bookings.profissional_id
                   OR (bookings.profissional_id IS NULL AND bookings.status = 'solicitada'
                       AND p.status = 'aprovada' AND p.regiao = bookings.regiao)))
  );
CREATE POLICY "bookings_insert_cliente" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (cliente_id = auth.uid());
CREATE POLICY "bookings_update_cliente" ON public.bookings FOR UPDATE TO authenticated
  USING (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (cliente_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings_update_profissional" ON public.bookings FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profissionais p
            WHERE p.user_id = auth.uid() AND p.status = 'aprovada'
              AND (p.id = bookings.profissional_id
                   OR (bookings.profissional_id IS NULL AND bookings.status = 'solicitada'
                       AND p.regiao = bookings.regiao)))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profissionais p
            WHERE p.user_id = auth.uid() AND p.id = bookings.profissional_id)
  );

-- ============ booking_extras ============
CREATE TABLE public.booking_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  extra_id UUID NOT NULL REFERENCES public.extras(id) ON DELETE RESTRICT,
  preco_congelado NUMERIC NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT ON public.booking_extras TO authenticated;
GRANT ALL ON public.booking_extras TO service_role;
ALTER TABLE public.booking_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_extras_select" ON public.booking_extras FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id));
CREATE POLICY "booking_extras_insert" ON public.booking_extras FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.cliente_id = auth.uid()));

-- ============ avaliacoes ============
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  pontualidade INT CHECK (pontualidade BETWEEN 1 AND 5),
  qualidade INT CHECK (qualidade BETWEEN 1 AND 5),
  cordialidade INT CHECK (cordialidade BETWEEN 1 AND 5),
  comentario TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.avaliacoes TO anon;
GRANT SELECT, INSERT ON public.avaliacoes TO authenticated;
GRANT ALL ON public.avaliacoes TO service_role;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avaliacoes_select_all" ON public.avaliacoes FOR SELECT USING (true);
CREATE POLICY "avaliacoes_insert_own" ON public.avaliacoes FOR INSERT TO authenticated
  WITH CHECK (avaliador_id = auth.uid());

-- recalcula nota média da profissional
CREATE OR REPLACE FUNCTION public.recalcular_nota_profissional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profissionais p
  SET nota_media = sub.media, total_avaliacoes = sub.total
  FROM (
    SELECT round(avg(a.nota)::numeric, 2) AS media, count(*) AS total
    FROM public.avaliacoes a
    WHERE a.avaliado_id = NEW.avaliado_id
  ) sub
  WHERE p.user_id = NEW.avaliado_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER avaliacoes_recalcula AFTER INSERT ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_nota_profissional();

-- ============ lista_espera ============
CREATE TABLE public.lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  cidade TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.lista_espera TO anon, authenticated;
GRANT SELECT ON public.lista_espera TO authenticated;
GRANT ALL ON public.lista_espera TO service_role;
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lista_espera_insert" ON public.lista_espera FOR INSERT
  WITH CHECK (true);
CREATE POLICY "lista_espera_select_admin" ON public.lista_espera FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ novo usuário -> profile + role ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  papel public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, telefone, cpf)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'nome',
    NEW.raw_user_meta_data ->> 'telefone',
    NEW.raw_user_meta_data ->> 'cpf'
  )
  ON CONFLICT (id) DO NOTHING;

  papel := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'cliente');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, papel)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ pricing_config seed ============
INSERT INTO public.pricing_config (chave, valor, descricao) VALUES
  ('preco_4h', 130, 'Preço base para 4 horas'),
  ('preco_6h', 180, 'Preço base para 6 horas'),
  ('preco_8h', 230, 'Preço base para 8 horas'),
  ('adicional_por_quarto_extra', 15, 'Adicional por quarto a partir do 3º'),
  ('adicional_por_banheiro_extra', 20, 'Adicional por banheiro a partir do 2º'),
  ('area_externa_pequena', 20, 'Adicional área externa pequena'),
  ('area_externa_media', 40, 'Adicional área externa média'),
  ('area_externa_grande', 70, 'Adicional área externa grande'),
  ('mult_limpeza_padrao', 1.0, 'Multiplicador limpeza padrão'),
  ('mult_limpeza_completa', 1.15, 'Multiplicador limpeza completa'),
  ('mult_limpeza_pesada', 1.35, 'Multiplicador limpeza pesada'),
  ('mult_pos_obra', 1.6, 'Multiplicador pós-obra'),
  ('mult_limpeza_comercial', 1.2, 'Multiplicador limpeza comercial'),
  ('mult_pos_locacao', 1.1, 'Multiplicador pós-locação'),
  ('taxa_admin_percentual', 0.15, 'Taxa administrativa somada ao valor da profissional'),
  ('valor_seguro', 5, 'Proteção da contratação');

-- ============ extras seed ============
INSERT INTO public.extras (nome, descricao, preco, minutos_adicionais) VALUES
  ('Limpeza interna de armários', 'Organização e limpeza por dentro dos armários', 40, 45),
  ('Limpeza de geladeira', 'Limpeza interna e externa da geladeira', 25, 30),
  ('Limpeza de forno', 'Remoção de gordura e resíduos do forno', 25, 30),
  ('Limpeza de janelas', 'Limpeza de esquadrias e janelas', 35, 40),
  ('Limpeza de vidros', 'Vidros internos sem risco de altura', 45, 50),
  ('Limpeza de portas', 'Portas e maçanetas higienizadas', 20, 25),
  ('Limpeza de paredes', 'Remoção de manchas em paredes laváveis', 60, 60),
  ('Limpeza de área externa', 'Varanda, quintal ou garagem', 50, 50),
  ('Passar roupas', 'Passar as roupas separadas pelo cliente', 45, 60),
  ('Organização de ambientes', 'Organização de armários e ambientes', 40, 45),
  ('Limpeza de varanda', 'Piso, guarda-corpo e móveis da varanda', 30, 30),
  ('Limpeza de churrasqueira', 'Grelhas, grade e interior da churrasqueira', 40, 40),
  ('Troca de roupa de cama e banho', 'Troca completa de enxoval', 30, 30),
  ('Preparação para hóspedes', 'Checklist de preparo entre hóspedes', 50, 45);