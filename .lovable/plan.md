# Corrigir linha do tempo da confirmação

Ajuste na tela de confirmação para que a linha do tempo reflita o status real do booking, não fique travada na primeira etapa.

## 1. Mapear status para índice de progresso

Em `src/routes/confirmacao.$id.tsx`, criar uma função que converte o status do booking no índice da etapa atual:

```text
aceita | confirmada  → 0
a_caminho             → 1
em_andamento          → 2
finalizada | concluida → 3
```

Status desconhecidos ou anteriores à aceitação (ex.: pendente, aguardando_pagamento) resultam em `-1`, deixando todas as etapas futuras.

## 2. Redesenhar os estados das etapas

Trocar `const concluida = i === 0` por `const passoAtual = i <= indiceAtual` e adicionar três aparências:

- **Já cumprida** (`i < indiceAtual`): fundo `--success`, ícone `CheckCircle2`, texto `--background`.
- **Atual** (`i === indiceAtual`): borda `2px` `--accent`, número em `--accent`, sem fundo.
- **Futura** (`i > indiceAtual`): borda `1px` `--border`, número `--muted-foreground`.

## 3. Mostrar horários reais abaixo do título

Cada etapa passa a exibir, quando disponível, o timestamp correspondente em vez do texto fixo:

| Etapa | Campo do booking |
|-------|------------------|
| 0 Reserva confirmada | `aceito_em` |
| 1 Profissional a caminho | `checkin_em` |
| 2 Faxina em andamento | `iniciado_em` |
| 3 Serviço concluído | `finalizado_em` |

Formato: `DD/MM HH:MM` (ex.: "21/08 14:30"). Se o campo for nulo, mantém o texto previsto já existente.

## 4. Verificação

- `bunx tsc --noEmit` na pasta do projeto.
- Screenshot mobile (390px) da tela de confirmação com um booking em status `em_andamento`, se houver dados de teste; caso contrário, screenshot do estado padrão.

## Arquivos

- `src/routes/confirmacao.$id.tsx` (único arquivo alterado)
