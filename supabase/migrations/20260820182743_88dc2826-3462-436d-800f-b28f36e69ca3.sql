UPDATE public.site_config
SET valor = valor || jsonb_build_object('base_url', 'https://lar10.lovable.app', 'tamanho_rodada', 1)
WHERE chave = 'orquestra';

UPDATE public.profissionais p
SET disponivel = false
WHERE p.regiao = 'grande_floripa'
  AND EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = p.user_id AND pr.telefone LIKE '(48) 9000%'
  );