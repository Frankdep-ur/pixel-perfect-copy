# Redesign visual Lar77 — tema navy + dourado idêntico às referências

Objetivo: trocar 100% da aparência do app para o design das imagens (navy quase preto, dourado, cards arredondados, cara de app nativo), mantendo todas as funcionalidades atuais (funil, orquestra em tempo real, pagamento simulado, painéis profissional/admin).

## 1. Tema global (base de tudo)

- Em `src/styles.css`: tornar o tema escuro o padrão (`:root` = navy).
  - fundo `#0B1426`, superfícies/cards navy um pouco mais claras, bordas sutis
  - `--primary` = dourado/âmbar `#D4AF37` com texto navy em cima
  - texto principal branco, secundário cinza claro
  - raio maior (cards ~1.25rem, botões pill/arredondados), sombras suaves
- Botões, inputs, tabs, progress, badges, sheets herdam automaticamente pelos tokens — nenhuma cor fixa em componente.
- Container mobile-first (máx. 480px, centralizado) aplicado nas telas do fluxo, para o app não parecer site desktop.

## 2. Telas redesenhadas (uma a uma, conforme as imagens)

**Home (`src/routes/index.tsx`, `site-header.tsx`)**
- Header: menu hambúrguer à esquerda, logo Lar77 centralizada, ícone de headset (Suporte) à direita.
- Carrossel do hero com card arredondado, título grande, subtítulo e botão dourado "Saiba mais" + dots.
- "Como funciona" em 4 passos com ícones em quadrados navy, numerados 1–4 e setas entre eles.
- Blocos de ação empilhados: "Contratar faxina" (card dourado cheio), "Trabalhe conosco" (contorno dourado), "Suporte" (card navy suave).
- Rodapé do bloco: botão dourado "Entrar / Criar conta" + linha "Já tem uma conta? Faça seu login".

**Fluxo de contratação (`src/routes/contratar.tsx`, `components/contratar/passos.tsx`)**
- Topo de cada passo: seta voltar, stepper de bolinhas numeradas (concluídas em dourado, atuais destacadas), headset à direita, logo centralizada.
- Título grande + subtítulo explicativo centralizados.
- Tipo de imóvel: cards em lista, ícone à esquerda em linha dourada, rótulo, chevron à direita; selecionado com borda dourada. Card informativo de apoio abaixo.
- Tipo de serviço/duração: cards com ícone de relógio circular, nome (Básico/Convencional/Completo), chip de horas, descrição e "A partir de R$ X" à direita.
- Card de reforço "Segurança em primeiro lugar" antes do rodapé.
- Rodapé fixo: botão dourado "Continuar" com seta + link "Voltar" sublinhado.

**Escolha da profissional (`components/contratar/busca-orquestra.tsx`)**
- Card de radar: "Buscando a profissional ideal mais próxima de você…" com ícone circular dourado e mapa/pulso à direita.
- Cabeçalho "Profissionais disponíveis" + contagem, com botão "Filtrar" (visual; sem nova lógica).
- Lista em tempo real: à medida que cada profissional aceita, entra um card com foto redonda, nome, nota + nº de serviços, distância, chips de qualidades, preço "A partir de R$ X", duração e botão dourado de seleção.
- Card final "Todas as nossas diaristas são verificadas".

**Pagamento (`components/contratar/checkout.tsx`)**
- Card da profissional reservada, contagem regressiva da reserva, formas de pagamento como cards selecionáveis com borda dourada, resumo de valores (serviço, taxa 15%, total) e botão dourado de pagar.

**Confirmação e acompanhamento (`src/routes/confirmacao.$id.tsx`, `src/routes/minha-conta.tsx`)**
- Saudação "Olá, {nome}" + botão "Ajuda / Suporte".
- Card "Sua faxina está confirmada!" com badge verde e 4 colunas: Data, Horário, Profissional, Código da reserva.
- Card "Profissional escolhida" com foto, nota, chips, botão "Chat" e "Ver perfil".
- Card "Detalhes da faxina": tipo/duração, método de pagamento, e coluna de valores (serviço, taxa Lar77 15%, seguro, Total pago).
- Card "Endereço da faxina" com botão "Ver no mapa".
- Timeline "O que acontece agora?" com 4 etapas em círculos, números verdes quando concluídas, refletindo o status real do pedido (confirmada → a caminho → em andamento → concluída).
- Card final "Você e sua casa protegidos!".
- Barra de navegação inferior estilo app (Início, Minhas reservas, Mensagens, Favoritos, Conta) apontando para as rotas/abas que já existem.

**Demais telas (login/cadastro, área da profissional, admin, ajuda, termos)**
- Herdam o tema novo; ajustes pontuais de espaçamento, cards e botões para o mesmo padrão.

## 3. Observações de escopo

- Nenhuma regra de negócio muda: preços, taxa de 15%, rodadas de convite, reserva de 5 min, permissões e RLS continuam iguais.
- A imagem do tipo de imóvel mostra a opção "Airbnb", que hoje não existe no funil nem na tabela de preços. Deixo de fora deste redesign (é mudança funcional); posso adicionar depois em um passo separado.
- "Filtrar", "Favoritos" e "Ver no mapa" entram apenas como elementos visuais das telas de referência, ligados ao que já existe (ou desabilitados) — sem inventar backend novo.

## Detalhes técnicos

- Todo o redesign é feito por tokens em `src/styles.css` (`@theme inline` + `:root`) e classes utilitárias nos componentes; sem cores hardcoded.
- Ícones continuam em lucide-react, em traço dourado.
- Novo componente de stepper e um `AppShell` mobile (header com hambúrguer/logo/headset + bottom nav) reutilizados nas telas do cliente.
- Verificação final: build/typecheck, e conferência das telas no preview em viewport mobile.
