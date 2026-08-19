# Aceitar a oportunidade respondendo no próprio WhatsApp

Sim, dá para fazer — e é o caminho mais natural para a profissional: ela responde a mensagem e o aceite já entra no sistema, sem abrir link nem app.

## Como fica para a profissional

Mensagem de oportunidade passa a terminar com:

```text
Responda esta mensagem com:
1 = ACEITAR
2 = INDISPONÍVEL

Ou toque no link: https://lar77.lovable.app/oportunidade/{token}
```

Respondendo "1" (ou "aceito", "sim"), ela recebe na hora:
- "Aceite confirmado! Agora é só aguardar a escolha do cliente."
- ou "Essa oportunidade já expirou / já foi preenchida." quando o prazo de 5 minutos passou.

Respondendo "2" (ou "não", "indisponível"): "Ok, avisamos que você não está disponível."

Se a resposta não for entendida: mensagem curta repetindo as opções e o link. O link com token continua funcionando exatamente como hoje — a resposta por WhatsApp é um caminho a mais, não uma troca.

## Regras

- Vale sempre o convite aberto mais recente daquele número. Se ela tiver dois convites abertos ao mesmo tempo, o sistema responde pedindo para usar o link, porque "1" ficaria ambíguo.
- Fora do prazo, aceite por WhatsApp é recusado com aviso — mesma regra do link.
- Número desconhecido (não é de profissional com convite) recebe uma resposta neutra de suporte e nada é alterado.
- Cada mensagem recebida é processada uma única vez, mesmo se a Z-API reenviar o mesmo evento.

## Painel administrativo

Na aba Orquestra, cada convite passa a mostrar por onde veio a resposta: **app**, **link** ou **WhatsApp**. A fila de mensagens ganha também as respostas recebidas, para você auditar o que a profissional escreveu.

## Detalhes técnicos

- Nova rota pública `src/routes/api/public/zapi-webhook.ts` (POST) para o webhook "Ao receber" da Z-API, com verificação por segredo em query string (`?s=...`, novo secret `ZAPI_WEBHOOK_SECRET`) mais checagem do `Client-Token` quando presente. Ignora `fromMe`, grupos e mensagens sem texto.
- Parser de intenção em `src/lib/notificacoes.server.ts` (ou novo `src/lib/resposta-whatsapp.server.ts`): normaliza acentos/caixa e mapeia `1|aceito|aceitar|sim|ok` → aceitar; `2|nao|indisponivel|recusar` → recusar.
- Resolução do convite: consulta `booking_convites` juntando `profissionais`/`profiles` pelo telefone normalizado (`numeroZapi`), status `enviado` e `expira_em > now()`, ordenado por `criado_em desc`. Zero → resposta neutra; mais de um → pede o link.
- Aceite: chama a função existente `responder_convite_token(token, aceitar)` via `supabaseAdmin`, reaproveitando toda a validação de prazo e concorrência já testada. Nenhuma regra de negócio nova.
- Migração: coluna `canal_resposta text` em `booking_convites` (`app` | `link` | `whatsapp`), preenchida pelas funções de resposta; tabela `whatsapp_recebidas` (message_id único, telefone, texto, convite_id, acao, criado_em) com GRANTs (`select` para `authenticated`, `all` para `service_role`), RLS ligada e leitura restrita a admin via `has_role`. O message_id único garante idempotência.
- Resposta ao remetente reusa `enviarTextoZapi` direto (confirmação imediata), sem passar pela fila, e registra o texto enviado em `notificacoes_whatsapp` com tipo `resposta`.
- Textos da oportunidade atualizados no gerador de mensagens da orquestra para incluir as instruções "1 / 2".
- Configuração: depois do deploy é preciso apontar o webhook "Ao receber mensagem" da instância Z-API para a URL pública com o segredo — eu faço isso pela API da Z-API assim que o segredo estiver salvo.
