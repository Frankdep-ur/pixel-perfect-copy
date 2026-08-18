# Teste robusto da barra de abas

Objetivo: validar, com navegação real no app, que a barra inferior aparece nas telas certas, marca a aba ativa correta e nunca cobre o conteúdo.

## O que vai ser testado

1. **Login** — entrar com uma conta de cliente (criar uma conta de teste descartável, já que o preview está deslogado nos testes automatizados).
2. **Navegação pelas abas** — clicar em Início, Minhas reservas, Mensagens, Favoritos e Conta, na barra (não por URL), confirmando em cada passo:
   - a URL de destino (`/`, `/minha-conta`, `/mensagens`, `/favoritos`, `/minha-conta?aba=perfil`);
   - a aba ativa fica dourada e as outras cinzas;
   - a aba "Conta" abre a aba "Meus dados" e a "Minhas reservas" não fica marcada ao mesmo tempo.
3. **Espaçamento inferior (padding-bottom)** — em cada tela, rolar até o fim e medir se o último elemento visível (botão/rodapé) fica acima da barra, sem sobreposição. Medição por geometria: comparar a base do conteúdo com o topo da barra, além de captura de tela.
4. **Área de toque e safe-area** — conferir que cada aba tem no mínimo 48x48px e que a barra reserva `env(safe-area-inset-bottom)`.
5. **Onde a barra não deve aparecer** — `/contratar`, `/auth`, `/admin` (e telas deslogadas).
6. **Badge de mensagens** — confirmar que não aparece com contagem zero.
7. **Console limpo** — nenhum erro de runtime durante o percurso.

## Detalhes técnicos

- Script Playwright em `/tmp/browser/tab-bar/`, viewport 390x844 (mobile).
- Medição do padding: `getBoundingClientRect()` do rodapé/último bloco vs. `rect` do `nav[aria-label="Navegação principal"]`, mais `getComputedStyle` do `main` para checar o `padding-bottom` calculado.
- Coleta de erros via listener de `console` e de `pageerror`.
- Capturas de tela por rota (topo e fim da página) para inspeção visual.
- Nenhuma alteração de código está prevista; se o teste encontrar falha (sobreposição, aba ativa errada, barra em rota proibida), a correção entra em `src/components/tab-bar-mobile.tsx` e/ou na regra `.com-tab-bar` em `src/styles.css`.

## Efeito colateral

O teste cria uma conta de cliente de teste no banco (e-mail `tabbar-<n>@teste.com`), necessária porque a barra só aparece autenticado.
