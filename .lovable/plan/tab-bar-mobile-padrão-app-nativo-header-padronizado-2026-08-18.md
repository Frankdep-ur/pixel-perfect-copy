# Tab bar mobile (padrão app nativo) + header padronizado

## 1. Novo componente `src/components/tab-bar-mobile.tsx`

- Fixa na base (`fixed inset-x-0 bottom-0 z-40`), largura total, fundo `--surface`, borda superior 1px `--border`, `padding-bottom: env(safe-area-inset-bottom)`, visível só no mobile.
- 5 abas com ícone lucide 24px (strokeWidth 1.5) + label 11px, área de toque mínima 48x48:
  - Início → `/` (Home)
  - Minhas reservas → `/minha-conta` (CalendarCheck)
  - Mensagens → `/mensagens` (MessageCircle)
  - Favoritos → `/favoritos` (Heart)
  - Conta → `/minha-conta` com `?aba=perfil` (UserRound)
- Ativa: ícone e label em `--accent`; inativa: `--muted-foreground` (via `activeProps`/`data-status` do `<Link>`; "Início" com `activeOptions.exact`).
- Badge: círculo `--accent` com número no canto superior direito do ícone, renderizado só quando a contagem > 0. Fonte da contagem: mensagens reais com `lida_em` nulo que não foram escritas pelo próprio usuário (query no Supabase, sem número inventado). Favoritos e as outras abas não têm badge.

## 2. Rota `/minha-conta` e a aba "Conta"

`/minha-conta/perfil` não existe hoje — a conta usa abas internas (`ativas`, `historico`, `imoveis`, `perfil`). Em vez de duplicar a página, a aba "Conta" aponta para `/minha-conta?aba=perfil` e a rota passa a ler esse search param para abrir a aba certa (valor padrão continua "ativas"). "Minhas reservas" aponta para `/minha-conta` sem param.

## 3. Onde a barra aparece

Não existe um `<main>` único no `__root.tsx` — cada rota renderiza `SiteHeader` + seu próprio `<main>`. Para respeitar a regra pedida sem reescrever todas as telas:

- Crio um componente único `AppChrome` (header + tab bar) usado nas rotas do cliente, e a lógica de visibilidade fica centralizada nele: só com usuário autenticado e nunca em `/admin*`, `/contratar*` e `/auth` (checando `useRouterState().location.pathname` + sessão).
- Quando a barra está visível, o wrapper aplica `padding-bottom: calc(72px + env(safe-area-inset-bottom))` no conteúdo, para nada ficar escondido atrás dela.
- `cta-fixo-mobile.tsx` hoje não é renderizado em nenhuma rota; ele fica reservado para rotas públicas (home deslogada / institucionais) e nunca é montado junto da tab bar — a decisão é por rota, dentro do mesmo componente de chrome.

## 4. Header (mesmo commit)

Em `src/components/site-header.tsx`:
- Altura 56px, fundo `--background`, borda inferior 1px `--border` (mantendo `safe-area-inset-top`).
- Hambúrguer à esquerda, logo centralizado (32px no mobile), ícone à direita.
- Ícone da direita: headset/`Headset` (suporte) quando deslogado; sino `Bell` com badge de contagem quando logado (mesma contagem de mensagens não lidas, badge só quando > 0), levando para `/mensagens`.
- Menu lateral/desktop e links atuais permanecem iguais.

## 5. Rotas novas

- `src/routes/mensagens.tsx`: lista as conversas reais do usuário (bookings com mensagens), com contador de não lidas e link para o chat existente. Sem conversa: estado vazio honesto ("Nenhuma conversa ainda — as mensagens aparecem quando um serviço é aceito"), sem dados falsos.
- `src/routes/favoritos.tsx`: não existe backend de favoritos; a tela mostra estado vazio explicando que ainda não é possível favoritar profissionais, com link para contratar. Nenhum card fictício.
- Ambas com `head()` próprio (title/description/og) e protegidas por login (redirect para `/entrar` com `next`).

## Detalhes técnicos

- Contagem de não lidas em um hook compartilhado (`useNaoLidas`) com TanStack Query, reaproveitado pelo sino e pela tab bar.
- Só tokens do design system, nenhuma cor hardcoded; ícones lucide com `strokeWidth={1.5}`.
- Verificação: typecheck, build e screenshots mobile de `/`, `/minha-conta`, `/mensagens`, `/favoritos`, `/contratar` (sem barra) e `/admin` (sem barra).
