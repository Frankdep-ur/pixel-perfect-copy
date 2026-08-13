REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_codigo() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalcular_nota_profissional() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;