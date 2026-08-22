-- Admin pode excluir contas de teste (cascade em profiles / roles).
-- SECURITY DEFINER para conseguir apagar auth.users; a função recusa não-admin.

CREATE OR REPLACE FUNCTION public.admin_excluir_usuario(alvo uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'somente administrador';
  END IF;
  IF alvo IS NULL THEN
    RAISE EXCEPTION 'usuario invalido';
  END IF;
  IF alvo = auth.uid() THEN
    RAISE EXCEPTION 'nao pode excluir a propria conta';
  END IF;
  IF public.has_role(alvo, 'admin') THEN
    RAISE EXCEPTION 'nao pode excluir um administrador';
  END IF;

  -- FKs sem ON DELETE CASCADE
  DELETE FROM public.booking_fotos WHERE autor_id = alvo;

  DELETE FROM auth.users WHERE id = alvo;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_limpar_contas_exceto(manter text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  removidos int := 0;
  emails text[] := ARRAY[]::text[];
  manter_norm text[] := ARRAY[]::text[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'somente administrador';
  END IF;

  SELECT COALESCE(array_agg(lower(trim(x))), ARRAY[]::text[])
    INTO manter_norm
  FROM unnest(COALESCE(manter, ARRAY[]::text[])) AS x
  WHERE length(trim(x)) > 0;

  FOR r IN
    SELECT p.id, p.email
    FROM public.profiles p
    WHERE p.id <> auth.uid()
      AND NOT public.has_role(p.id, 'admin')
      AND (
        p.email IS NULL
        OR lower(trim(p.email)) <> ALL (manter_norm)
      )
  LOOP
    PERFORM public.admin_excluir_usuario(r.id);
    removidos := removidos + 1;
    emails := array_append(emails, COALESCE(r.email, r.id::text));
  END LOOP;

  -- Admin não é diarista: tira perfil profissional acidental desta conta.
  DELETE FROM public.profissionais WHERE user_id = auth.uid();
  DELETE FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'profissional';

  RETURN jsonb_build_object('removidos', removidos, 'emails', to_jsonb(emails));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_excluir_usuario(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_limpar_contas_exceto(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_excluir_usuario(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_limpar_contas_exceto(text[]) TO authenticated;