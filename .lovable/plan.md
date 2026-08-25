# Teste de exportação do `TabBarMobile`

## Objetivo

Criar um teste automatizado que importe `TabBarMobile` de `src/components/tab-bar-mobile.tsx` e garanta que o export nomeado esteja correto e renderizável.

## Passos

1. **Adicionar infraestrutura de testes**
   - Instalar como devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
   - Adicionar script `test` no `package.json` apontando para `vitest run`.

2. **Configurar Vitest**
   - Criar `vitest.config.ts` estendendo a config do Vite (`@lovable.dev/vite-tanstack-config`) com ambiente `jsdom` e alias `@/` resolvido.

3. **Criar o teste**
   - Arquivo: `src/components/tab-bar-mobile.test.tsx`.
   - Conteúdo mínimo: importar `{ TabBarMobile }` do módulo e renderizar dentro de um wrapper com `QueryClientProvider` + `RouterProvider` (ou stub) para cobrir as dependências de hooks (`useSession`, `useNaoLidas`, `usePapeis`, `useRouterState`).
   - Asserção principal: o componente é importável e a renderização não lança erro.

4. **Validar**
   - Rodar `bun run test` e confirmar que o teste passa.
   - Rodar `bun run build` para garantir que a adição não quebra o build.

## Escopo

- Apenas o teste de exportação/importação do `TabBarMobile`.
- Não alterar lógica do componente, rotas ou design.
