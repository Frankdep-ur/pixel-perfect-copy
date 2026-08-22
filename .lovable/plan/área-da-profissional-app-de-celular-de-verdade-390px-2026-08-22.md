# Área da profissional: app de celular de verdade (390px)

Só camada visual e navegação. Matching, aceite e radar não são tocados.

## 1. Header no celular

`src/components/site-header.tsx`:

- Uma única barra: hambúrguer · logo · sino (mantém como está a estrutura, altura 56px).
- Remover a linha "DIARISTAS DE CONFIANÇA" (hoje em 9px) no mobile — logo sozinho, centralizado.
- Hambúrguer da profissional passa a ter só três itens: **Minha área** (`/profissional`), **Suporte** (WhatsApp) e **Sair**. Saem os itens Oportunidades / Minhas faxinas / Mensagens / Minha conta, que duplicam o menu inferior e cortam palavra.
- Nenhum "ACESSOS", "Contratar agora" ou link de jornada de cliente aparece para a profissional (já é o caso no topo; garantir também no painel).

## 2. Menu inferior (único jeito de navegar)

`src/components/tab-bar-mobile.tsx` — as 4 abas da profissional já existem e o destino se mantém:

| Aba | Destino |
| --- | --- |
| Início | `/profissional` (oportunidades) |
| Minhas faxinas | `/profissional?aba=agenda` |
| Mensagens | `/mensagens` |
| Conta | `/profissional/conta` |

Ajustes: rótulo com 11px em duas linhas quando precisar ("Minhas faxinas" inteiro, sem cortar), sem `truncate`, alvo de toque 44×44 mínimo por aba, `text-balance`/`leading-tight` para caber em 390px.

## 3. Abas Oportunidades · Pedidos · Agenda · Histórico

`src/components/profissional/servicos-profissional.tsx`:

- Trocar a `TabsList` atual (que estoura a largura e joga a primeira aba para fora da tela) por um grid de 4 colunas iguais, largura 100%, altura 44px, fonte 13px, sem overflow horizontal.
- Tirar o `(0)` / `(3)` do texto. A contagem vira um badge redondo pequeno ao lado do rótulo, só quando > 0.
- Aba ativa com fundo/contorno claros, sempre visível sem arrastar.

## 4. Home `/profissional`

`src/routes/profissional.tsx` + `oportunidades-profissional.tsx`:

- Cabeçalho de perfil enxuto no mobile: foto, nome em Title Case, selo Verificada, switch Disponível — em uma faixa compacta, sem card grande.
- Cards de oportunidade: data, hora, bairro/cidade, valor. **Aceitar** e **Indisponível** lado a lado, cada um com altura mínima 48px.
- Confirmar que endereço completo do cliente não aparece antes do aceite (só bairro/cidade); ajustar o card se estiver mostrando rua/número.
- Conteúdo com `padding-bottom` ≥ 80px para nada ficar atrás da tab bar.

## 5. Login `/profissional/entrar`

`src/components/auth/form-acesso.tsx` (variante profissional) e `src/routes/profissional_.entrar.tsx`:

- Cara de app: sem header/rodapé institucional no mobile, sem "Contratar agora", sem "Acesso cliente" no meio (já está oculto para profissional — remover também "Acesso administrativo" dessa variante).
- Título "Acesso profissional" com 22px+, campos com altura 48px, botão Entrar largura total 52px.
- Fonte mínima 13px nos textos de apoio (hoje há `text-xs`).

## 6. Conta `/profissional/conta`

`src/routes/profissional_.conta.tsx`: no celular, cinco blocos recolhíveis (accordion), em vez de um formulário longo:

1. Perfil (aberto por padrão)
2. Endereço e mapa
3. PIX
4. Documentos
5. Folgas (calendário com dia ≥ 44px)

Ajustes complementares: separar PIX e Endereço em blocos próprios a partir do que hoje vive em `perfil-profissional.tsx`/`endereco-profissional.tsx`; `padding-bottom` da página garante que o botão **Salvar** nunca fique sob o menu inferior. No desktop os blocos ficam todos abertos.

## 7. Regras aplicadas em toda a área

- Nenhuma fonte de interface abaixo de 13px (badges numéricos e rótulos da tab bar são a exceção declarada: 10–11px).
- Sem scroll horizontal: revisar linhas com `flex` + conteúdo fixo usando grid + `min-w-0` + `shrink-0`.
- `/mensagens` recebe o mesmo tratamento: fonte mínima, alvo de toque, respiro inferior.
- Badge "Edit with Lovable" continua oculto no mobile (verificar).

## Detalhes técnicos

- Somente tokens do design system; nada de cor hardcoded.
- Accordion via `@/components/ui/accordion` (shadcn já disponível); estado inicial "Perfil" aberto.
- Verificação: typecheck, build e screenshots Playwright em 390×844 de `/profissional` (oportunidades, pedidos, agenda, histórico), `/profissional/conta`, `/profissional/entrar` e `/mensagens`, checando `document.documentElement.scrollWidth === 390` e que nenhum rótulo está truncado.
