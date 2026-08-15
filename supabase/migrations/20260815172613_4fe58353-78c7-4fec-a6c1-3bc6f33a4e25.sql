ALTER TABLE public.enderecos ADD COLUMN IF NOT EXISTS apelido text;

DROP POLICY IF EXISTS "Clientes removem seus enderecos" ON public.enderecos;
CREATE POLICY "Clientes removem seus enderecos"
ON public.enderecos FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.home_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imagem_url text NOT NULL,
  titulo text,
  legenda text,
  ordem integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_slides TO authenticated;
GRANT ALL ON public.home_slides TO service_role;

ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slides ativos sao publicos"
ON public.home_slides FOR SELECT TO anon, authenticated
USING (ativo = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin gerencia slides"
ON public.home_slides FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER home_slides_updated_at
BEFORE UPDATE ON public.home_slides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();