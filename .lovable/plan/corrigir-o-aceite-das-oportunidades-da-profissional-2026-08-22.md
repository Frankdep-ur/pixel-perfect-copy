# Corrigir o aceite das oportunidades da profissional

## O que está acontecendo hoje (verificado)

- A configuração da orquestra usa `prazo_aceite_min: 5` — todo convite nasce válido por apenas 5 minutos.
- A rotina automática que reabre rodadas roda a cada minuto e reescreve `expira_em = agora + 5 min` nos convites vencidos. Consultando os convites atuais, todos os 8 têm exatamente o mesmo `expira_em`, faltando ~1 min. É por isso que a profissional abre o app e o contador já está quase zerado, mostrando "Prazo encerrado" em segundos.
- O botão também aparece desabilitado porque a tela desabilita Aceitar/Indisponível sempre que a contagem chega a zero, inclusive no primeiro render antes do relógio atualizar.

## Novo prazo do convite

Regra única, calculada no banco no momento em que o convite é criado ou revalidado:

```text
prazo = agora + 2 horas
se a faxina é hoje (ou o início está a menos de 3h):
    prazo = início da faxina - 1 hora
prazo nunca é menor que agora (se já passou, o convite não é criado/revalidado)
```

- Convites de datas passadas (ou com o horário de início já vencido) não são criados nem reabertos como oportunidade nova.
- A rotina automática passa a apenas **estender** o prazo, nunca encurtar: se o convite ainda tem mais tempo que o novo cálculo, o valor atual é mantido.

## Comportamento na tela (sem mudar o visual)

- Aceitar e Indisponível ficam clicáveis enquanto `expira_em` estiver no futuro. Nada é desabilitado durante o carregamento — só quando o prazo realmente passou.
- Aceitar → o cartão sai de Oportunidades e passa a aparecer como "Aceito — aguardando a escolha do cliente" (Agenda/Pedidos), como já acontece.
- Indisponível → o convite fica `indisponivel` só para ela; os convites das outras profissionais do raio continuam válidos (nenhuma mudança necessária, já é por convite).
- Oportunidades com data já passada deixam de ser listadas.

## Detalhes técnicos

Migração no banco:
- `site_config.orquestra`: `prazo_aceite_min` → 120, novo campo `prazo_min_antes_inicio_min` = 60.
- Nova função auxiliar `public.prazo_convite(_data date, _hora time)` que devolve o `timestamptz` do prazo (ou `NULL` quando já não dá tempo).
- `abrir_rodada_interna`: usa `prazo_convite(b.data, b.hora)`; se vier `NULL`, não convida ninguém para aquele pedido. A mensagem de WhatsApp passa a dizer o prazo em horas/minutos calculado.
- `reabrir_rodadas_pendentes`: filtra pedidos cujo início já passou e revalida convites com `expira_em = GREATEST(expira_em, prazo_convite(...))`, ignorando quando o prazo é `NULL`.
- `convites_profissional`: não devolve convites `enviado`/`expirado` de pedidos cuja data/hora já passou.
- Correção pontual de dados: recalcular `expira_em` dos convites `enviado` atuais com a nova regra.

Frontend (`src/components/profissional/oportunidades-profissional.tsx`):
- Calcular `expirado` a partir de `expira_em` diretamente (comparação com o horário atual), não do valor inicial da contagem, mantendo classes e layout atuais.
