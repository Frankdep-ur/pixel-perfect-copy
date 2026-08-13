# LAR10 — MVP Fase 0

Marketplace brasileiro de diaristas, mobile first, acabamento premium. Construção em 6 fases sequenciais, cada uma testável antes da próxima. Duas regiões piloto: Grande Floripa e Balneário.

## Identidade visual (fixa em todas as fases)

Tokens semânticos no design system: fundo #F7F7F5, superfície branca, primary verde-petróleo #0E3B36 (hover #14524B), accent verde-menta #16C79A, texto #101F1C, muted #6B7C79, borda #E4E7E5, danger, warning. Plus Jakarta Sans nos títulos (600-700, letter-spacing -0.02em), Inter no corpo. Cards raio 16px com borda fina e sombra sutil; botões e inputs raio 12px, altura 52px no mobile; container mobile 480px. Ícones lucide, stroke 1.5. Sem gradientes, roxo, emojis em títulos ou sombras pesadas — referência Nubank/Airbnb.

## Fase 1 — Design system + Home

Home na rota `/` com header fixo (logo LAR10, menu, "Contratar agora", hambúrguer no mobile), hero com os dois CTAs e imagem de sala clara, "Como funciona" em 4 cards numerados, seção de segurança com checks em accent, faixa primary para profissionais e footer.

## Fase 2 — Backend e autenticação

Ativar o Lovable Cloud e criar o schema com RLS e grants: `profiles`, `enderecos`, `profissionais`, `disponibilidade`, `extras`, `pricing_config`, `bookings` (com código LAR-2026-XXXX automático), `booking_extras` (preço congelado), `avaliacoes`, `lista_espera`. Papéis (`cliente`/`profissional`/`admin`) em tabela separada de papéis, com função de verificação segura — nunca no perfil. `pricing_config` populado com as chaves de preço, adicionais, multiplicadores, taxa 15% e seguro R$ 5; nenhum preço no código. Regiões como constante em `src/lib/regioes.ts`. Login por e-mail e senha com escolha de perfil no cadastro.

## Fase 3 — Funil de contratação `/contratar`

Oito passos, uma pergunta por tela, barra de progresso fina, voltar discreto, estado preservado: CEP via ViaCEP + número/complemento (e "usar minha localização"), tipo de imóvel, tamanho (steppers, cozinha, área externa, outros ambientes), duração 4/6/8h, tipo de limpeza, extras vindos do banco, data e horário 07:00–16:00, observações especiais.

Motor de preço `calcularOrcamento()` puro, lendo tudo de `pricing_config`: base por duração + adicionais de cômodos e área externa, multiplicador do tipo de limpeza, extras, taxa admin de 15% **somada** ao valor da profissional (ela recebe integral) e seguro de R$ 5. A partir do passo 4, barra fixa com total estimado em tempo real.

Cidade fora das regiões atendidas: mensagem honesta + captura de e-mail na lista de espera.

## Fase 4 — Escolha da profissional + checkout

Abas "Escolher profissional" e "LAR10 encontra pra mim". Cards com foto, nome, nota e avaliações, serviços realizados, badge de verificada, distância, disponibilidade e valor que ela recebe; ordenação por proximidade, nota ou experiência. Filtro na ordem: aprovada → disponível → mesma região → distância Haversine dentro do raio → tipo de limpeza aceito. Regiões nunca se misturam. Estado vazio honesto quando não houver ninguém.

Checkout com resumo editável por bloco, quebra de valores transparente (serviço, extras, taxa 15%, proteção R$ 5, total) e a linha "A profissional recebe R$ X integralmente". Card de proteção com linguagem condicionada à apólice — nunca promessa de pagamento automático. Pagamento simulado isolado em `src/lib/pagamento.ts` (Pix/crédito/débito, aprovação após 2s), depois tela de confirmação com o código do booking e status `confirmada`.

## Fase 5 — Áreas do cliente e da profissional

`/minha-conta`: navegação inferior, card "Próxima faxina" com status colorido, detalhe com timeline de status, botões "Confirmar serviço" e "Relatar problema" quando finalizada, modal de avaliação (nota geral + pontualidade/qualidade/cordialidade + comentário) recalculando a média da profissional, e histórico.

`/seja-profissional`: cadastro em 4 passos (dados, endereço com região derivada + cidades atendidas + raio, experiência e disponibilidade, upload de foto e documentos), status inicial `pendente`.

`/profissional`: dashboard com totais do dia/semana/mês, toggle de disponibilidade, oportunidades da região com "Você recebe R$ X" e aceitar/recusar, botão único de fluxo do dia (a caminho → cheguei → iniciar → finalizar) com timestamps, agenda mensal e ganhos com saque visual.

## Fase 6 — Admin e dados de teste

`/admin` restrito por papel admin, com sidebar: dashboard de métricas (GMV, receita, ticket médio), aprovação de profissionais, clientes, contratações com filtros e quebra de valores, edição de `pricing_config`, CRUD de extras e lista de avaliações.

Seed via migração com dados literais: 12 profissionais aprovadas (7 na Grande Floripa, 5 no Balneário com `pos_locacao`), coordenadas reais, notas 4,5–5,0, 7 verificadas, os 14 extras da lista, 3 contratações em estados diferentes e um usuário admin.

## Fora de escopo agora

Gateway de pagamento real e split, seguro com apólice, Google Maps, chat interno, push/SMS/WhatsApp, IA, recorrência/cupons/fidelidade, LAR10 Empresas, expansão além das duas regiões, app nativo e antifraude.

## Notas técnicas

O projeto roda em TanStack Start (React 19 + Vite), então as páginas vivem em `src/routes/` e os tokens no design system em `src/styles.css` (não `index.css`). Acesso a dados via server functions e TanStack Query; leitura de preços sempre do banco. Fontes carregadas por `<link>` na rota raiz. Cada rota de conteúdo recebe seu próprio `head()` com título e descrição próprios.
