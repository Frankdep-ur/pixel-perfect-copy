# Orquestra de Contratação Lar77

Mudança conceitual: o cliente não escolhe numa lista de diaristas. Ele descreve o serviço, o Lar77 procura, e as profissionais aparecem conforme aceitam.

## Novo fluxo

```text
Cliente finaliza o pedido
   ↓  pedido criado com status "buscando"
"Aguarde enquanto procuramos as melhores profissionais para você."
   ↓  convites criados para as profissionais disponíveis da região/data
Alerta de oportunidade (WhatsApp simulado + card no app)
   ↓  ACEITAR / INDISPONÍVEL — 5 minutos de prazo
Cada aceite aparece na tela do cliente, uma a uma, em tempo real
   ↓  cliente toca em ESCOLHER PROFISSIONAL
Reserva temporária de 5 minutos
   ↓  pagamento
Contratação confirmada + confirmação para a profissional escolhida
```

## O que muda para o cliente

- Após o último passo do funil, em vez da lista de profissionais, entra a tela **"Estamos encontrando profissionais para você"**: animação de busca, contador do prazo e as fichas aparecendo conforme os aceites chegam (foto, nome, nota, avaliações, experiência).
- Cada ficha tem o botão **ESCOLHER PROFISSIONAL**. Ao escolher, a profissional fica reservada por 5 minutos e o cliente vai direto ao pagamento, com o tempo restante visível.
- Se a reserva expirar sem pagamento, a profissional volta ao pool e o cliente pode escolher outra.
- Sem aceites na rodada: o sistema abre automaticamente uma nova rodada com outras profissionais e mantém a mensagem de busca. Sempre há a saída "trocar data ou horário" e o Suporte.
- Some a opção "Deixe que a Lar77 escolha" como passo separado — a orquestra já é isso.

## O que muda para a profissional

- Card **Nova oportunidade** no painel com serviço, duração, data, horário, bairro, cidade e valor a receber, com contagem regressiva e botões ACEITAR / INDISPONÍVEL.
- O mesmo convite pode ser aceito por um **link público com token único** enviado na mensagem, sem login, válido por 5 minutos. Página mostra os dados sem revelar endereço completo nem dados do cliente.
- Depois do aceite ela fica "à espera da escolha do cliente". Se outra for escolhida, o convite encerra com aviso educado.
- Ao ser escolhida e paga: mensagem de confirmação (data, horário, duração, bairro/cidade) e orientação para entrar no Lar77 e acompanhar.

## WhatsApp

Nesta fase o envio é **simulado**: cada mensagem é registrada em uma fila de notificações, visível numa nova aba do painel administrativo (destinatário, tipo, texto, status, horário) com opção de abrir o wa.me manualmente. Os textos ficam nos modelos pedidos (oportunidade, confirmação, acesso ao app). Quando você tiver as credenciais oficiais (Meta Cloud API ou Twilio), só o disparo troca — o resto do fluxo continua igual.

## Painel administrativo

- Nova aba **Orquestra**: pedidos em busca, convites por pedido (enviado / aceito / indisponível / expirado), rodada atual e reservas ativas.
- Fila de mensagens WhatsApp com reenvio manual.
- Configurações: prazo de aceite (5 min), prazo de reserva (5 min) e tamanho da rodada de convites.

## Detalhes técnicos

- **Banco**: novo status de booking `buscando`; tabela `booking_convites` (booking_id, profissional_id, rodada, token, status, expira_em, respondido_em) e `notificacoes_whatsapp` (destinatário, telefone, tipo, payload, status). Campos `reservado_profissional_id` e `reserva_expira_em` em `bookings`. GRANTs + RLS: profissional lê/responde só os próprios convites; cliente lê apenas os aceites do próprio pedido através de uma função `security definer` que devolve dados públicos (foto, nome, nota) — nunca telefone.
- **Funções no banco**: `abrir_rodada_convites(booking_id)` reaproveitando `profissionais_disponiveis`; `responder_convite(token|convite_id, aceitar)` com validação de prazo; `reservar_profissional(booking_id, profissional_id)` com trava de 5 min; `expirar_convites_e_reservas()` chamada sob demanda pelas telas e por uma rota pública de cron.
- **Tempo real**: canal Supabase Realtime nas tabelas de convites e bookings para as fichas aparecerem sem recarregar; fallback de polling curto.
- **Pagamento**: `checkout.tsx` deixa de sortear profissional; o booking já existe com a reserva, e o pagamento aprovado muda o status para `aguardando_aceite`/`aceita`, limpa a reserva e enfileira a confirmação.
- **Rotas**: `/oportunidade/$token` pública para o aceite via link; a tela de busca vira uma fase nova em `/contratar`; nova rota `admin.orquestra`.
- **Disparo**: rota `/api/public/*` para o cron de expiração, verificada por segredo; enfileiramento das mensagens em server functions.
