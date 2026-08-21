# Home igual ao mockup (só visual)

Sem mexer em tokens de cor nem na fonte Poppins. Nenhuma regra de negócio, rota ou texto de configuração muda.

## Cabeçalho (`src/components/site-header.tsx`)

- Altura 56px no mobile, fundo `--background`, borda inferior 1px `--border`.
- Hambúrguer à esquerda, 24px, cor `--accent`.
- Centro: logo Lar77 (o asset já existente no projeto) com 30px de altura e, abaixo, "DIARISTAS DE CONFIANÇA" em 8px, letter-spacing 0.28em, `--accent`, centralizado — bloco total de 44px.
- Direita: headset quando deslogado, sino com badge de não lidas quando logado (comportamento atual mantido).

## Hero (`src/routes/index.tsx` + `src/components/hero-carrossel.tsx`)

- Card com radius 16px, margem lateral 16px, altura 210px, `overflow hidden`.
- Imagem de fundo em `object-cover` cobrindo o card.
- Gradiente por cima, da esquerda para a direita: `rgba(245,247,250,0.92)` até transparente, parando em 62%.
- Texto sobre a área clara, alinhado à esquerda, padding 20px: título Poppins 700 26px cor `#04162F` (2 linhas), subtítulo 14px cor `#1B3050` (3 linhas).
- Botão "Saiba mais": fundo `#04162F`, texto `--accent`, radius 8px, altura 40px, padding lateral 20px.
- Abaixo do card, indicadores centralizados: ativo em pílula dourada 20x6px, os demais círculos de 6px em `--border`.

## Como funciona

- Título "Como funciona" à esquerda, `--accent`, Poppins 600, 18px.
- Troca do `grid-cols-4` por faixa de rolagem horizontal: flex, `overflow-x auto`, `scroll-snap-type: x mandatory`, gap 12px, padding lateral 16px, scrollbar escondida.
- Cada passo: item fixo de 148px com `scroll-snap-align: start`, contendo quadrado 64x64 radius 14px fundo `--surface-tint` com ícone `--accent` 28px; badge circular 22px sobreposto no canto superior esquerdo (borda 1px `--accent`, fundo `--background`, número `--accent` 12px); título Poppins 600 14px `--foreground` (até 2 linhas); descrição 12px `--muted-foreground` (até 3 linhas).
- Chevron 16px `--accent` com 50% de opacidade entre os itens.
- Cada passo recebe uma descrição curta de apoio (ex.: escolher tipo de imóvel/serviço, data e horário, profissional mais próxima, faxina acompanhada pelo app).

## Três cards de ação

Largura total menos 16px de cada lado, altura 76px, radius 14px, ícone 28px à esquerda, chevron à direita, gap 12px.

1. "Contratar faxina" — fundo `--accent`, ícone e texto `#04162F`, título Poppins 700 19px, subtítulo 13px com 80% de opacidade.
2. "Trabalhe conosco" — transparente, borda 1px `--accent`, título e ícone `--accent`, subtítulo `--muted-foreground`.
3. "Suporte" — fundo `--surface`, sem borda, ícone em círculo de 44px com borda 1px `--accent`, título `--foreground`.

## Rodapé da home

- Botão "Entrar / Criar conta" em largura total, fundo `--accent`, texto `#04162F`, altura 52px, radius 12px.
- Abaixo, centralizado, 13px `--muted-foreground`: "Já tem uma conta? Faça seu login", com "login" em `--accent` sublinhado (link para a tela de entrar).

## Detalhes técnicos

- Os dois valores de texto fixos do mockup (`#04162F` e `#1B3050`) ficam apenas dentro do hero, onde o fundo é a faixa clara do gradiente; o restante segue os tokens atuais.
- O hero continua usando o carrossel gerido pelo admin: os indicadores refletem a quantidade real de slides (o mockup mostra 5; se houver menos imagens cadastradas, aparecem menos pontos). O título/subtítulo vêm dos textos do slide, com fallback nos textos atuais da configuração.
- Utilitário de scrollbar escondida em `src/styles.css` se ainda não existir; nada de novas cores.
- As seções abaixo do rodapé da home (faixa de confiança, área para profissionais) permanecem como estão.
- Verificação: build/typecheck e screenshots mobile da home.
