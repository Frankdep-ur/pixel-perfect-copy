# A faxina aceita aparecer no app da profissional + link do WhatsApp levar ao painel

## O que aconteceu no seu teste (verificado no banco)

O pedido LAR-2026-0027 funcionou de ponta a ponta: convite enviado por WhatsApp (18:40), aceite pelo link (18:42, canal "link"), cliente pagou e o serviço ficou com o status "aceita" no nome dela — e a confirmação por WhatsApp também saiu. O cadastro dela está aprovado e as permissões deixam ela ver esse serviço.

Ou seja: o serviço existe e é dela, mas o painel não mostra isso na cara:

- A área com as faxinas fica **no fim da página**, depois de perfil, documentos e bloqueios.
- Ela abre sempre na aba **Oportunidades**; a faxina contratada está na aba **Agenda**, que ela precisaria procurar.
- Logo depois de aceitar (antes do cliente pagar) não existe nenhum card dizendo "você aceitou, aguardando a escolha do cliente" — só uma linha discreta no histórico.
- O aceite pelo link foi feito sem estar logada, então o app não a levou para o painel dela.

## O que vai mudar

**Painel da profissional**

- "Minhas faxinas" sobe para o **topo** da página, logo abaixo do cartão de perfil; perfil, documentos e bloqueios vão para baixo.
- Faixa de destaque no topo quando houver faxina contratada: "Você tem 1 faxina confirmada — 22/08 às 09h, Centro, Florianópolis", com botão que abre a aba Agenda.
- A aba inicial passa a ser escolhida pelo que existe: se há faxina confirmada, abre em **Agenda**; se só há oportunidade aberta, abre em **Oportunidades**.
- Convite aceito e ainda sem escolha do cliente ganha um card próprio: "Aceito — aguardando a escolha do cliente", com data, horário, região e valor.
- Atualização em tempo real também nos serviços dela (hoje só os convites atualizam), então a faxina aparece sozinha no segundo em que o cliente paga.

**Link de aceitar do WhatsApp**

- Depois de aceitar pelo link, ela vai **sempre** para o painel dela, com aviso de sucesso no topo.
- Se já estiver logada no celular: aceite e vai direto para `/profissional`, na Agenda/Oportunidades.
- Se não estiver logada: o aceite continua valendo na hora (pelo token, sem travar) e a tela leva para a entrada da profissional já com retorno para `/profissional` depois do login.

Nada muda no cliente, nos prazos, nas rodadas de convite, na reserva ou nos valores.

## Detalhes técnicos

- `src/routes/profissional.tsx`: reordenar as seções, renderizar `ServicosProfissional` antes de `PerfilProfissional`/`DocumentosProfissional`/`BloqueiosProfissional` e adicionar a faixa de destaque (consulta leve de bookings ativos dela).
- `src/components/profissional/servicos-profissional.tsx`: `Tabs` com `value` controlado + estado inicial derivado (agenda quando `meus.length > 0`); assinatura Realtime em `bookings` filtrada por `profissional_id` invalidando `["servicos-profissional", id]`.
- `src/components/profissional/oportunidades-profissional.tsx`: novo bloco para convites com `status = "aceito"` cujo booking ainda não é dela, com o mesmo cartão visual e rótulo de espera.
- `src/routes/oportunidade.$token.tsx`: no `onSuccess` de aceite, navegar para `/profissional` quando houver sessão; sem sessão, navegar para `/profissional/entrar?next=/profissional` (a rota já aceita `next`).
- Sem migração de banco e sem mudança nas funções `responder_convite` / `responder_convite_token` / `confirmar_pagamento_booking`.
