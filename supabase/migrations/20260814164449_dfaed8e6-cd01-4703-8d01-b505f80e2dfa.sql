ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS bloqueada boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS avaliacoes_select_all ON public.avaliacoes;
CREATE POLICY avaliacoes_select_all ON public.avaliacoes
  FOR SELECT TO anon, authenticated
  USING (bloqueada = false OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS avaliacoes_update_admin ON public.avaliacoes;
CREATE POLICY avaliacoes_update_admin ON public.avaliacoes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS avaliacoes_delete_admin ON public.avaliacoes;
CREATE POLICY avaliacoes_delete_admin ON public.avaliacoes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT UPDATE, DELETE ON public.avaliacoes TO authenticated;