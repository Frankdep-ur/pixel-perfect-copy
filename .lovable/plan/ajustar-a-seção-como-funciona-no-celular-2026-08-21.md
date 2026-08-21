# Ajustar a seção "Como funciona" no celular

A faixa de passos hoje rola na horizontal com cartões estreitos de 148px, então os textos ficam cortados (`line-clamp`) e o último passo aparece pela metade na borda — dando a impressão de conteúdo truncado.

## Mudança

Trocar a rolagem horizontal por uma grade de 2 colunas no celular (2x2 com os quatro passos), promovendo para 4 colunas a partir de `md`.

- Cada passo vira um cartão em `bg-surface` com radius 14px, borda 1px `--border` e padding 12px, ocupando toda a largura da coluna.
- Ícone 26px dentro de quadrado 52x52 radius 12px em `--surface-tint`, com o badge numerado circular de 22px sobreposto no canto superior esquerdo (mantendo cores `--accent`).
- Título Poppins 600 14px `--foreground` e descrição 12px `--muted-foreground`, ambos sem `line-clamp` — o texto passa a aparecer inteiro.
- Remover os chevrons entre os passos (a ordem já é indicada pelos números) e o `snap`/`overflow-x`.
- Título da seção e espaçamentos laterais alinhados aos 16px do resto da home.

## Detalhes técnicos

Arquivo afetado: `src/routes/index.tsx` (apenas a seção `#como-funciona` e a remoção do import `ChevronRight` se deixar de ser usado — ele segue em uso nos cartões de ação, então permanece). Sem mudança de paleta, tokens, fontes ou textos. Verificação: typecheck e screenshot mobile a 390px.
