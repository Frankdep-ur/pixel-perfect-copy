UPDATE public.site_config
SET valor = jsonb_set(valor, '{tamanho_rodada}', '3'::jsonb)
WHERE chave = 'orquestra';