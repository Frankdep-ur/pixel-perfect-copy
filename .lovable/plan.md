# Tema escuro navy + dourado (só sistema visual)

Objetivo: aplicar a paleta navy/dourado das imagens em todo o app, sem mudar estrutura de páginas, textos ou funcionalidades.

## 1. Tokens (src/styles.css)

- Substituir os valores em `:root` pelos oklch informados (background, foreground, surface, surface-tint, card, popover, border, input, primary, primary-hover, accent, accent-soft, secondary, muted, muted-foreground, ring, destructive, warning), mantendo os nomes das variáveis.
- Criar/replicar um bloco `.dark` com exatamente os mesmos valores.
- `--shadow-card` e `--shadow-card-hover`: trocar sombras externas por borda 1px `--border` + leve brilho interno (`inset 0 1px 0` em branco baixa opacidade).

## 2. Fontes

- `--font-display` passa a "Poppins" (600/700); `--font-sans` continua Inter.
- Carregar Poppins pelo `<link>` do Google Fonts no head de `src/routes/__root.tsx` (junto do link atual), sem `@import` de URL no CSS.

## 3. Ajustes exigidos pelo tema escuro

- `lar-card` (e cards shadcn): fundo `--surface`, borda 1px `--border`, radius 16px, sem sombra.
- Estado selecionado: fundo `--surface-tint`, borda 1px `--accent`.
- Ícones lucide: stroke `--accent` e `strokeWidth 1.5` como padrão nas telas do fluxo/home/painéis.
- Ícone em círculo/quadrado: fundo `--surface-tint`, ícone `--accent`.
- Botão primário: fundo `--accent`, texto `--accent-foreground`, altura 52px.
- Botão secundário/outline: fundo transparente, borda 1px `--accent`, texto `--accent`.
- Inputs/select/textarea: fundo `--surface-tint`, borda `--border`, foco borda `--accent`.
- `theme-color` em `src/routes/__root.tsx` → `#04162F`.
- `background_color` (e `theme_color`) em `public/manifest.json` → `#04162F`.

## 4. Cores dinâmicas

`src/lib/site-config.ts` (CORES_PADRAO) e o override de `TemaSite` usam os mesmos novos valores de primary/accent/background, para o admin não reintroduzir a paleta antiga.

## 5. Logo

Uso o logo Lar77 já hospedado no projeto no header, altura 32px no mobile (nada de logo em fonte). Se você subir o arquivo novo LAR-77, eu troco o asset e mantenho o mesmo encaixe.

## Detalhes técnicos

- Tudo por tokens em `@theme inline` + `:root`/`.dark`; nenhuma cor hardcoded em componente.
- Sem mudança de layout, rotas, textos ou regras de negócio (taxa 15%, orquestra, reservas).
- Verificação: build/typecheck e screenshots mobile de home, funil, radar, pagamento e acompanhamento.
