# Dois ajustes: resposta só para quem tem cadastro + faxina aceita aparecendo no app da profissional

## 1. Mensagem indo para outro número

O que aconteceu no seu teste (verificado nos registros): a oportunidade do pedido LAR-2026-0029 foi enviada **somente** para a Juliete (17 92003-4155). O "outro número" (18 99170-9288) recebeu mensagem porque **ele escreveu para a instância do WhatsApp** — e hoje o webhook responde qualquer pessoa que manda mensagem, mesmo sem cadastro e sem convite ("Não entendi…", "Não encontramos oportunidade…").

Correção: o webhook passa a só responder quando o número pertence a uma profissional cadastrada. Número desconhecido é ignorado em silêncio (nada é enviado, nada entra na fila). Assim ninguém mais recebe mensagem do Lar77 por engano.

## 2. A reserva que ela confirmou não aparece no app

Causa confirmada: enquanto o pedido está na fase "buscando" (ela aceitou, o cliente ainda não escolheu/pagou), as regras de acesso do banco não deixam a profissional ler aquele pedido. O card "Aceito — aguardando a escolha do cliente" existe na tela, mas vem sem dados (data, valor, bairro) e por isso não aparece de forma útil. Depois do pagamento o pedido passa a ser dela e aí aparece — mas ela não vê nada no intervalo, que é justamente quando ela quer conferir.

Correção: os convites da profissional passam a ser lidos por uma função do banco que devolve, junto do convite, apenas o resumo seguro do serviço (tipo, data, hora, duração, bairro, cidade, valor dela, situação do pedido, se ela foi a escolhida). Sem endereço completo e sem dados do cliente antes da confirmação — igual ao que já fazemos no link do WhatsApp.

Com isso ela vê, na aba Oportunidades:

- convite aberto (com contagem de tempo, como hoje);
- "Aceito — aguardando a escolha do cliente", com os dados do serviço;
- e, quando o cliente confirma, a faxina continua aparecendo em destaque na aba Agenda (fluxo atual, sem mudança).

## Detalhes técnicos

- Migração: nova função `convites_profissional()` (security definer, filtrada por `auth.uid()` via `profissionais.user_id`) devolvendo convite + resumo do booking (`tipo_limpeza`, `data`, `hora`, `duracao_horas`, `valor_profissional`, `bairro`, `cidade`, `booking_status`, `escolhida`). Nenhuma política de RLS de `bookings` é afrouxada.
- `src/lib/orquestra.ts`: `listarConvitesProfissional` passa a chamar a RPC nova e o tipo `ConviteProfissional` vira plano (campos do resumo direto no objeto).
- `src/components/profissional/oportunidades-profissional.tsx`: cards lêem os campos planos; regra do "aguardando" usa `escolhida === false`.
- `src/routes/api/public/zapi-receber.ts`: antes de responder, consulta se o telefone (normalizado com `telefone_e164`) pertence a alguma profissional; se não, retorna `{ ignorado: true }` sem enfileirar resposta.
- Verificação no fim: compilar, simular no webhook um número desconhecido (deve ficar sem resposta) e o número da Juliete, e conferir que a listagem de convites dela retorna os dados do serviço na fase "buscando".
