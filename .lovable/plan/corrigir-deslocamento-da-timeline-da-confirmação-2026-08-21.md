# Corrigir deslocamento da timeline da confirmação

Ajuste na tela de confirmação para que a timeline trate o status como um marco já cumprido, não como etapa em curso, e lide com contratações canceladas.

## 1. Reindexar `indiceDoStatus`

Em `src/routes/confirmacao.$id.tsx`, alterar a função para que ela devolva o índice da PRÓXIMA etapa esperada:

```text
aceita | confirmada   → 1
a_caminho             → 2
em_andamento          → 3
finalizada | concluida→ 4
cancelada             → -2
qualquer outro        → 0
```

Assim `jaPassou = i < indiceAtual` continua funcionando: em `aceita`, a etapa 0 fica verde e a etapa 1 recebe o anel `--accent`; em `finalizada`, todas as quatro etapas ficam verdes e nenhuma recebe anel.

## 2. Tratar status `cancelada`

Quando `indiceDoStatus` devolver `-2`:

- Não renderizar o título "O que acontece agora?" nem a lista de etapas.
- Buscar os dados de cancelamento do booking. Adicionar `cancelamentos(*)` à consulta do Supabase na query de booking.
- Exibir um card com:
  - fundo `--surface`;
  - borda `1px` `--destructive/40`;
  - título "Contratação cancelada";
  - data/hora do cancelamento (`criado_em` da tabela `cancelamentos`), formatada pelo `formatarHorarioReal`, quando existir.

## 3. Corrigir `formatarHorarioReal`

Trocar `toLocaleDateString` por `toLocaleString` e usar opções explícitas de data/hora para produzir o formato `"DD/MM HH:MM"`, sem `replace` de vírgula.

## 4. Verificação

- `bunx tsc --noEmit`.
- Screenshot mobile (390px) da tela de confirmação. Como não há sessão ativa, o estado padrão será capturado; se possível, validar visualmente os estados via dados de teste após login.

## Arquivos

- `src/routes/confirmacao.$id.tsx` (único arquivo alterado)
