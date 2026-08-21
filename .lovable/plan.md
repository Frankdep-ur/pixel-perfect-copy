# Plano: enxugar a home e mover conteúdo profissional para página dedicada

## Objetivo
Deixar a página inicial do Lar77 mais curta e direcionada ao cliente: Hero → Como funciona → Ações → Faixa de confiança → Rodapé. O conteúdo institucional de garantia e a landing para profissionais sai da home e vai para uma rota dedicada.

## Mudanças

### 1. Nova rota: `/trabalhe-conosco`
- Criar `src/routes/trabalhe-conosco.tsx`.
- Mover para lá as seções que hoje estão em `src/routes/index.tsx`:
  - **Garantia** (card com `t.garantia_titulo`, `t.garantia_texto`, `t.garantia_fechamento`).
  - **Trabalhe com a Lar77** (badge "Para profissionais de limpeza", título, chamada, texto, fechamento, grid de vantagens, CTA).
- A nova página terá `SiteHeader`, o conteúdo acima e `SiteFooter`.
- Meta tags próprias (título, descrição, og, twitter).

### 2. Atualizar `src/routes/index.tsx`
- Remover as seções de **Garantia** e **Trabalhe com a Lar77**.
- Manter: `SiteHeader`, Hero, Como funciona, Ações principais, Entrar/Criar conta, Faixa de confiança, `SiteFooter`.
- Trocar o link "Trabalhe conosco" dos cards de ação para apontar para `/trabalhe-conosco` (hoje aponta para `/seja-profissional`).

### 3. Ajustar navegação
- Verificar se existem outros links para `/seja-profissional` no restante do app que deveriam ir para `/trabalhe-conosco`. Se houver CTA institucional em outras páginas, redirecionar para a nova rota.
- Manter `/seja-profissional` como está (placeholder de cadastro) — não será alterada.

## Resultado esperado
- A home fica enxuta: o usuário vê só o essencial para contratar e, em seguida, a faixa de confiança e o rodapé.
- O conteúdo profissional continua acessível por `/trabalhe-conosco`, com URL própria e melhor para SEO/compartilhamento.
- Nenhuma alteração de paleta, fontes ou textos — apenas reorganização de rotas e remoção de seções da home.
