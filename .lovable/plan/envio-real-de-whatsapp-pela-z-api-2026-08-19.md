# Envio real de WhatsApp pela Z-API

Hoje toda notificação (novo convite, aceite, finalização) já é gravada na fila `notificacoes_whatsapp` com status "pendente", e alguém precisa abrir o WhatsApp na mão pelo painel da Orquestra. Este plano liga essa fila à sua instância Z-API para o envio sair sozinho.

## O que muda para você

- Convite para a profissional, confirmação para o cliente e aviso de finalização saem automaticamente, em segundos, sem ninguém clicar.
- Cada item da fila passa a mostrar o resultado real: enviada, falhou (com o motivo) ou pendente.
- No painel da Orquestra ficam dois botões por mensagem: "Reenviar pela Z-API" e "Enviar teste", úteis quando o número está errado ou a instância caiu.
- Uma tela rápida de diagnóstico no admin mostra se a instância está conectada.

## Credenciais que preciso

A Z-API exige três valores distintos. Você me passou um deles (`3F7E2C22...`), mas não sei se é o ID ou o token, então vou pedir os três em formulário seguro (nunca ficam no código):

- `ZAPI_INSTANCE_ID` — ID da instância
- `ZAPI_INSTANCE_TOKEN` — token da instância
- `ZAPI_CLIENT_TOKEN` — Client-Token de segurança da conta

## Como fica o funcionamento

```text
RPC grava na fila (pendente)
        │
        ▼
Disparador chama a Z-API  ──►  WhatsApp da profissional / cliente
        │
        ├─ sucesso  → status "enviada" + data/hora + id da mensagem
        └─ erro     → status "falhou" + motivo, com botão de reenvio no admin
```

Fluxo de teste que vou rodar depois de aprovado: cadastro/serviço de teste → convite disparado → mensagem chegando no número **+351 961 395 247** → aceite → confirmação para o cliente. Se o Z-API recusar número internacional fora do padrão brasileiro, ajusto a formatação do número (o helper atual assume Brasil).

## Detalhes técnicos

- Servidor: `POST src/routes/api/public/zapi-enviar.ts` não é necessário para envio; o disparo usa um `createServerFn` (`src/lib/notificacoes.functions.ts`) que lê os segredos dentro do handler e chama `https://api.z-api.io/instances/{id}/token/{token}/send-text` com header `Client-Token`.
- Fila: novas colunas em `notificacoes_whatsapp` (`erro`, `zapi_message_id`, `tentativas`) com GRANTs mantidos; status passa a aceitar `falhou`.
- Disparo imediato: após cada ponto que gera notificação (abertura de rodada, aceite/reserva, confirmação de pagamento, finalização) o cliente chama a server function `dispararFilaWhatsapp`, que drena as pendentes com trava por `id` para não enviar duas vezes.
- Rede de segurança: rota `src/routes/api/public/zapi-drenar.ts` protegida por `CRON_SECRET` para reprocessar pendências/falhas periodicamente, caso o disparo imediato não aconteça (aba fechada).
- Números: `numeroInternacional` em `src/lib/whatsapp.ts` ganha suporte a números já com código de país (ex.: 351) em vez de forçar `55`.
- Admin (`src/routes/admin.orquestra.tsx`): mostra status/erro, botões de reenvio e teste, e um cartão com o estado da instância via endpoint `/status` da Z-API.
- Sem webhook de entrada nesta etapa (não há resposta por WhatsApp); o aceite continua pelo link com token já existente.
