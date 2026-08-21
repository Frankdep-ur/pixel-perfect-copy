# Ajustes de layout mobile e revisão de textos

Revisei a home, a página "Trabalhe com a Lar77", o funil e o login em largura de celular (390px). Não há rolagem horizontal indevida nem quebra de layout grave. Os pontos abaixo são acabamento e correções de texto.

## Layout mobile

1. **Hero — legibilidade do texto sobre a foto**
   O título e o subtítulo ficam sobre a parte clara da imagem e a linha "Uniformizadas, avaliadas e prontas para cuidar da sua casa." fica difícil de ler. Reforçar o degradê escuro na base/esquerda do slide e limitar a largura do texto para não invadir o rosto da profissional.

2. **Logo do cabeçalho com pouco contraste**
   A marca no topo aparece apagada e quase ilegível sobre o fundo navy. Aumentar levemente a altura do logo e o contraste, mantendo a barra de 56px e a tagline "DIARISTAS DE CONFIANÇA".

3. **Carrossel "Como funciona"**
   A seta entre o último cartão visível e a borda fica solta no canto direito. Ajustar o espaçamento final (padding-right) e remover a seta após o último passo, para o corte indicar continuação de forma limpa.

4. **Espaço vazio antes do rodapé**
   Em telas altas sobra uma faixa grande de fundo entre a faixa de confiança e o rodapé. Manter o rodapé colado ao final do conteúdo em vez de empurrado para o fim da viewport.

5. **Faixa de confiança em 3 colunas**
   Em telas estreitas os textos quebram em duas linhas desalinhadas. Igualar a altura dos itens e reduzir levemente o texto para manter as três colunas alinhadas.

6. **Área de toque dos links secundários**
   "Faça seu login" e os links do rodapé ficam com alvo abaixo de 44px. Aumentar o espaçamento vertical desses links.

## Textos

- "Suporte / Fale com a nossa equipe" → manter, está correto.
- Em `/trabalhe-conosco`: "Trabalhe assegurada" fica ambíguo; sugiro "Trabalhe protegida" (mesma ideia, leitura mais natural). Confirmo antes de trocar.
- "Você não precisa ficar preocupada se o cliente vai pagar." → "Você não precisa se preocupar se o cliente vai pagar."
- Padronizar as aspas do texto do app: usar “Faxina finalizada” com inicial minúscula na segunda palavra, igual ao botão real do aplicativo.
- Restante da ortografia e acentuação (imóvel, horário, tranquilidade, assegurada, condições) está correto; nenhum erro encontrado nos títulos, botões e rodapé.

## Detalhes técnicos

Arquivos afetados: `src/components/hero-carrossel.tsx` (degradê e largura do texto), `src/components/site-header.tsx` (logo), `src/routes/index.tsx` (carrossel, faixa de confiança, espaçamentos, rodapé), `src/routes/trabalhe-conosco.tsx` (ajustes de texto). Sem mudança de paleta, fontes, tokens ou estrutura de seções.
