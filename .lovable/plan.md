# Aplicar o pacote de contratação no banco

Objetivo: rodar no banco a migração já escrita em `supabase/migrations/20260822041600_pacote_contratacao.sql`, sem recriar nenhuma conta de demonstração (a migração não contém nenhum INSERT de contas).

## O que muda para quem usa o app

- **Cadastro de imóvel**: o endereço passa a guardar o tipo do imóvel (casa, apartamento, escritório, empresa, Airbnb). O código do app já lê esse campo hoje, então isso conserta a listagem de imóveis.
- **Extras**: ficam ativos apenas dois — "Limpeza de churrasqueira" e "Limpeza de forno e geladeira" (R$ 45, 50 min). Os demais extras são desativados (não apagados).
- **Taxa**: taxa administrativa fixada em 17% do total do cliente (profissional recebe 83%); seguro segue embutido na taxa (linha zerada).
- **Convite**: uma única janela de 5 minutos, enviada de uma vez para **todas** as profissionais aprovadas, ativas e dentro do raio de 15 km. Não há mais rodadas seguidas nem revivência de convite expirado; a reserva do cliente também dura 5 minutos.
- **Textos de WhatsApp**: mensagens novas para (1) nova oportunidade com o aviso claro de que responder "1" é só disponibilidade, (2) confirmação de disponibilidade registrada, (3) "você foi selecionada" após o pagamento e (4) aviso amigável para quem não foi escolhida.

## Detalhes técnicos

Um único migration, exatamente o conteúdo do arquivo citado:

- `ALTER TABLE public.enderecos ADD COLUMN IF NOT EXISTS tipo_imovel text`
- `UPDATE pricing_config`: `taxa_admin_percentual = 0.17`, `valor_seguro = 0`
- `UPDATE/INSERT public.extras`: desativa todos e reativa os dois extras válidos
- `UPDATE site_config` chave `orquestra`: `prazo_aceite_min = 5`, `prazo_reserva_min = 5`, `tamanho_rodada = 500`, `raio_km = 15`
- Funções recriadas: `prazo_convite`, `abrir_rodada_interna`, `reabrir_rodadas_pendentes` (passa a ser no-op), `enfileirar_disponibilidade` (nova, com GRANT), `responder_convite`, `responder_convite_token`, `confirmar_pagamento_booking`

Nenhum `INSERT` em `auth.users`, `profiles` ou `profissionais` — as contas demo `@demo.lar10.app` não voltam.

## Ponto para decidir depois da aplicação

A função `responder_convite_whatsapp` (aceite respondendo "1" na conversa) não está incluída no arquivo e por isso continuará sem disparar a mensagem "disponibilidade registrada". Se quiser, na sequência eu faço uma migração curta ligando `enfileirar_disponibilidade` também nesse caminho.
