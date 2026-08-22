# Limpar contas de teste e destravar o Alexandre

## O que vai acontecer

1. **Aplicar a migration** `20260822034500_admin_excluir_contas.sql` no banco, criando as duas funções de exclusão de contas (uma conta por vez e a limpeza em lote), liberadas só para administrador.

2. **Executar a limpeza em lote.** A função exige um administrador logado, então o clique final é seu: entrar no painel administrativo, abrir o bloco "Limpar contas de teste", digitar `EXCLUIR` e confirmar. Isso apaga login, perfil, faxinas e mensagens de todas as contas exceto `frank@gmail.com`, `alexandre@gmail.com` e o admin — inclusive as demo `@demo.lar10.app`, que não serão recriadas.

3. **Arrumar o cadastro do admin.** A conta `admin@lar10.app` (Edvaldo e) tem um perfil de diarista criado por acidente; ele será removido junto com o papel de profissional, se existir. (A própria função de limpeza já faz isso, e a checagem no banco confirma o registro.)

4. **Papéis cruzados.** Conferido no banco: `alexandre@gmail.com` tem só o papel profissional e `frank@gmail.com` só o de cliente, então nada a remover. A verificação será repetida depois da limpeza para garantir.

5. **Destravar as Oportunidades do Alexandre.** Nas faxinas LAR-2026-0037 e LAR-2026-0038 o convite dele está marcado como "indisponível". Os dois convites voltam para "enviado", com o prazo estendido, para as faxinas reaparecerem na aba Oportunidades dele.

## Detalhes técnicos

- Migration aplicada como está no repositório, sem reescrever o SQL.
- Ajustes de dados via operações de dados nas tabelas `profissionais`, `user_roles` e `booking_convites` (status `enviado`, `respondido_em` nulo, `expira_em` recalculado por `prazo_convite(data, hora)` quando ainda houver janela válida).
- A exclusão em lote toca `auth.users`, o que só a função com privilégio elevado pode fazer — por isso ela roda pelo botão do painel admin, não por script.
- Sem alteração de código de interface.
