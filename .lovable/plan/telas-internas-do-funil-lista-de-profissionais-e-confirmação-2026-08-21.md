# Telas internas do funil, lista de profissionais e confirmação

Ajuste só de layout/apresentação. Nenhuma regra de negócio, preço ou fluxo muda.

## 1. Topo das etapas do funil

Em `src/routes/contratar.tsx`, trocar a barra "Passo X de Y + Progress" por uma linha única de 56px:

- seta voltar à esquerda (22px, `--accent`) — usa a função `voltar()` que já existe;
- ao centro, stepper de 4 círculos de 26px ligados por linha de 2px: concluído/atual com fundo `--accent` e número `#04162F`; futuro com fundo `--surface-tint`, número `--muted-foreground` e a linha até ele em `--border`;
- headset à direita, abrindo o suporte (`linkSuporte()`).

O funil hoje tem 8 passos (4 no Airbnb). Os 4 círculos representam grupos do funil, não passos individuais: 1) Local e imóvel, 2) Serviço e duração, 3) Data e observações, 4) Profissional e pagamento. O passo atual acende o grupo correspondente. Assim o mockup é respeitado sem inventar etapas.

O `SiteHeader` (logo + tagline) sai das telas do funil — nada de logo dentro das etapas. Fica só o stepper e, abaixo, o título da pergunta em Poppins 700 24px centralizado (`--foreground`) e o subtítulo 14px centralizado (`--muted-foreground`, até 2 linhas). Todos os passos em `passos.tsx` passam a usar esse cabeçalho centralizado padronizado.

## 2. Cards de opção (tipo de imóvel, e demais listas de escolha)

Novo formato do card selecionável: altura 72px, radius 14px, fundo `--surface`, gap 10px entre cards, ícone de contorno 34px `--accent` à esquerda, rótulo Poppins 600 17px, chevron `--muted-foreground` à direita. Selecionado: fundo `--surface-tint` + borda 1px `--accent`. Selo (ex.: Airbnb) como pílula abaixo do rótulo: borda 1px `--accent`, texto 11px `--accent`, padding 2px 8px.

## 3. Cards de duração / tipo de serviço

Altura 108px, radius 14px, fundo `--surface`:

- círculo de 60px com borda 1px `--accent` e ícone de relógio à esquerda;
- centro: nome Poppins 700 20px, pílula de horas abaixo (borda 1px `--accent`, texto 12px `--accent`), descrição 13px `--muted-foreground` em 2 linhas;
- direita: "A partir de" 11px `--muted-foreground`, valor Poppins 700 22px `--accent`, chevron abaixo.

Os valores continuam vindo de `pricing_config` pela query já existente (`precos["preco_4h"]` etc.). Nada de preço no código.

## 4. Card da profissional na lista (radar)

Card radius 14px, fundo `--surface`, padding 14px, em duas faixas:

- faixa de cima: foto circular 56px; nome Poppins 600 17px; abaixo "★ 4,9 · 127 serviços" (13px, estrela `--accent`) e "1,2 km de você" (13px `--muted-foreground`, com pin);
- faixa de baixo (10px de distância): à esquerda no máximo duas tags em pílula (borda 1px `--accent`, texto 11px `--accent`); à direita "A partir de R$ X" com valor `--accent` 17px e botão "Ver perfil" (fundo `--accent`, texto `#04162F`, altura 36px, radius 8px) — esse botão é o que já reserva a profissional e segue para o pagamento.

Tags vêm do que já existe na profissional (Verificada, anos de experiência, nota alta), limitadas às duas primeiras.

Distância: o retorno atual de profissionais aceitas não traz km. Vou incluir `distancia_km` no retorno dessa consulta (só leitura, reaproveitando o cálculo de distância que já existe no banco) para a linha "X km de você" mostrar o valor real. Se preferir, dá para omitir a linha e não tocar em nada do banco — me diga na aprovação.

Cabeçalho da lista: "Profissionais disponíveis" `--accent` 17px, "Encontramos N profissionais próximas a você" 13px `--muted-foreground`, e botão "Filtrar" à direita com borda 1px `--accent` (elemento visual do mockup, sem lógica nova).

## 5. Confirmação

- A grade 2x2 fica como está.
- Pílula "Confirmado": fundo `rgba(61,214,140,0.15)`, texto `--success`, radius 999px, 12px, padding 4px 12px. Hoje `--success` aponta para o dourado; passa a ser o verde `#3DD68C` em `src/styles.css` (usado só para status).
- Quebra de valores alinhada à direita: rótulos 13px `--muted-foreground`, valores 13px `--foreground`; linha "Total pago" com rótulo `--foreground` 15px e valor `--accent` Poppins 700 20px.
- Linha do tempo "O que acontece agora?": rolagem horizontal com scroll-snap, itens de 92px. Só as etapas já cumpridas (conforme o status real do pedido) recebem o selo verde preenchido; as futuras ficam com círculo de borda 1px `--border` e número `--muted-foreground`.
- Texto: garantir "Sua faxina está confirmada!" (o arquivo hoje está sem o "!" e sem acento errado; fica exatamente com a frase correta).

## Detalhes técnicos

- Arquivos: `src/routes/contratar.tsx` (stepper/topo), `src/components/contratar/passos.tsx` (cabeçalhos e cards de opção/duração), `src/components/contratar/busca-orquestra.tsx` (cabeçalho da lista e card em duas faixas), `src/routes/confirmacao.$id.tsx` (pílula, valores, timeline horizontal, texto), `src/styles.css` (token `--success` verde).
- Componentes reutilizáveis novos: `StepperFunil`, `CardOpcao`, `CardDuracao`.
- Tudo por tokens; `#04162F` só onde o mockup pede texto sobre dourado.
- Verificação: screenshots mobile (390px) das etapas 2 e 4, do radar e da confirmação, mais typecheck.
