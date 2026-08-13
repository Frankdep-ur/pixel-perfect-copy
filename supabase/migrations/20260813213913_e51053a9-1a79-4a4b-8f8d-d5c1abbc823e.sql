ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS DISTINCT FROM u.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  papel public.app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, telefone, cpf, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'nome',
    NEW.raw_user_meta_data ->> 'telefone',
    NEW.raw_user_meta_data ->> 'cpf',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  papel := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'cliente');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, papel)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;