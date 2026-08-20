# Fluxo da contratação e por que a oportunidade não chegou agora

## Como o fluxo funciona hoje

```text
1. Cliente entra em /contratar, descreve o imóvel, escolhe data e hora
2. O pedido é criado com status "buscando"
3. O sistema procura profissionais: aprovada + disponível + mesma região
   + sem bloqueio na data + sem outra faxina já aceita naquela mesma data
4. Convida até 3 delas (tamanho_rodada = 3), com prazo de 5 minutos
5. Cada convite entra na fila de WhatsApp e a Z-API envia a oportunidade
6. Ela aceita pelo link da mensagem, pelo app, ou respondendo "1" na conversa
7. Cada aceite aparece na tela do cliente, que escolhe uma (reserva de 5 min)
8. Pagamento confirma a contratação e dispara a mensagem de confirmação
```

## O que os registros mostram

Confirmado no banco e na Z-API, com o número 17920034155 sendo o correto:

- **LAR-2026-0027** (22/08, 07:00, Ingleses): convite criado para a Juliete e as duas mensagens (oportunidade e confirmação) enviadas para **5517920034155**, com ID de mensagem retornado pela Z-API. A Z-API confirma que esse número tem WhatsApp ativo. Ou seja, esse pedido saiu certo, só para ela.
- **LAR-2026-0028** (criado às 19:05, também para 22/08): **nenhum convite foi criado** — nada foi enviado para ninguém. Motivo: a Juliete já tinha aceito a faxina do dia 22/08, então a busca a exclui daquela data, e todas as outras profissionais de Florianópolis estão marcadas como indisponíveis. O pedido ficou parado em "buscando" em silêncio, sem avisar o cliente.
- Houve também uma mensagem recebida do número **18 99170-9288** (não é o da Juliete). Como esse número não tem convite nenhum, o sistema respondeu "Não entendi — responda 1 ou 2". É esse "outro número" que aparece na fila.
- Existem **8 cadastros com o mesmo telefone** (18 99805-4798). Como o casamento da resposta por WhatsApp usa só os 8 últimos dígitos, uma resposta desse número pode cair no convite da pessoa errada.

## Correções propostas

1. **Pedido sem ninguém para convidar**: em vez de girar em silêncio, a tela do cliente avisa que não há profissional livre naquela data e oferece trocar data/horário ou falar com o suporte; o pedido é marcado como sem profissional e aparece assim no painel Orquestra.
2. **Mesma profissional, duas faxinas no dia**: hoje ela é excluída da data inteira depois de aceitar uma. Deixar essa regra explícita no painel dela e no admin (badge "agenda cheia em 22/08"), para não parecer que o sistema falhou.
3. **Respostas de números sem convite**: registrar quem enviou e mostrar no painel Orquestra ("mensagem de número não vinculado"), em vez de só devolver "Não entendi".
4. **Telefone duplicado**: sinalizar na ficha do admin quando dois cadastros usam o mesmo número e, nesses casos, não aceitar a resposta pelo texto do WhatsApp (o link e o app continuam funcionando).
5. **Painel Orquestra mais claro**: por pedido, mostrar quantas profissionais eram elegíveis, quantas foram convidadas e o motivo quando o número der zero.

## Detalhes técnicos

- Ajuste em `abrir_rodada_convites` para devolver o motivo quando não há candidatas, e na tela de busca (`busca-orquestra.tsx`) para tratar "0 convites na primeira rodada" como estado final com saída para trocar data.
- Nova coluna/registro de log para mensagens recebidas sem convite correspondente, exibido em `admin.orquestra.tsx`.
- `responder_convite_whatsapp` passa a comparar o número completo normalizado e a ignorar telefones duplicados entre profissionais.
- Nada muda no envio para a Juliete: o número 17920034155 já está correto e validado na Z-API.
