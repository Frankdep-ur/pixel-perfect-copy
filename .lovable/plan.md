# Airbnb, matching por raio, fotos do serviço e chat com badge

## 1. Modalidade Airbnb — Limpeza de Checkout

- Novo tipo de imóvel no funil: **Airbnb** (5º cartão, com selo "Grande atrativo!" e o bloco "Limpeza para receber melhor", como na referência enviada).
- Serviço de **preço fixo**, sem cálculo por cômodos/duração: valor inicial **R$ 150,00**, guardado em configuração de preços (`airbnb_preco_fixo`) para o admin alterar quando quiser.
- Escopo mostrado ao cliente antes de continuar: troca de roupa de cama, limpeza de cozinha, limpeza de banheiros e **fotos após a limpeza (obrigatório)**.
- O funil pula as perguntas de metragem/nível de limpeza e vai direto para imóvel → data/horário → radar → pagamento. A taxa administrativa continua sendo somada por cima (15%).
- Duração padrão do serviço configurável (`airbnb_duracao_horas`, começa em 4h) para a agenda da profissional.

## 2. Fotos do serviço (exclusivo Airbnb)

- Nova tabela `booking_fotos` (serviço, autor, caminho do arquivo, legenda opcional).
- Novo bucket privado de armazenamento; leitura por link assinado apenas para o cliente do pedido, a profissional escalada e o admin.
- **Profissional:** ao finalizar um serviço Airbnb, tela de envio de fotos direto pela câmera do celular (mínimo de 3 fotos para concluir). Enquanto faltarem fotos, o botão "Finalizar" explica o que falta.
- **Cliente:** galeria "Fotos da limpeza" no detalhe do serviço, visível após o término, com visualização ampliada.

## 3. Aba Airbnb no painel administrativo

Nova seção `/admin/airbnb` com:
- preço fixo, duração e itens inclusos (editáveis);
- raio padrão e regras de operação da modalidade;
- lista dos pedidos Airbnb com status, profissional, quantidade de fotos enviadas e acesso à galeria.

## 4. Endereço completo + localizador no cadastro da profissional

- Cadastro e perfil da profissional passam a pedir **endereço completo** (CEP com busca automática, rua, número, complemento, bairro, cidade, estado).
- **Localizador no mapa** (mapa OpenStreetMap gratuito, sem chave): o pino é posicionado a partir do CEP e a profissional pode arrastar para o ponto exato; a coordenada é gravada em `latitude`/`longitude`.
- Raio de atuação em km continua obrigatório e passa a valer para o matching.
- Endereço e coordenadas ficam visíveis somente para ela e para o admin.

## 5. Matching por raio de km

- A busca de candidatas passa a considerar **distância real** entre o imóvel do cliente e o endereço da profissional, em vez de apenas a região:
  - dentro do raio configurado no sistema (`orquestra.raio_km`, padrão 15 km, ajustável no admin) **e** dentro do raio de atuação da própria profissional;
  - ordenadas por distância e nota;
  - região continua como critério de reserva quando ainda não há coordenada cadastrada.
- O comportamento de aceite permanece: ninguém é atribuído automaticamente. O alerta vai para todas as ativas no raio, apenas quem aceita entra no radar do cliente, o cliente escolhe e paga, e só então a escolhida é confirmada.
- O painel Orquestra mostra a distância de cada convidada e o raio usado.

## 6. Notificação de faxina confirmada

- Após o pagamento confirmado, a profissional escolhida recebe mensagem de confirmação (app + WhatsApp da central Lar-77) com data, horário, duração, endereço completo do serviço e valor a receber — hoje a mensagem não traz o endereço completo.
- As demais candidatas recebem aviso de encerramento do convite.

## 7. Chat interno com badge de não lida

- Ao abrir uma conversa, as mensagens recebidas são marcadas como lidas (`lida_em`).
- Badge vermelho com contagem no ícone de chat: no botão "Chat do serviço", na aba Mensagens da barra inferior e no cartão de cada serviço.
- Atualização em tempo real nas duas pontas (cliente e profissional), sem precisar recarregar.

## Detalhes técnicos

- Migrações: `airbnb` em `TIPOS_IMOVEL`; chaves `airbnb_preco_fixo`, `airbnb_duracao_horas` em `pricing_config`; `orquestra.raio_km` em `site_config`; tabela `booking_fotos` com GRANTs + RLS (cliente do pedido, profissional escalada, admin); colunas de endereço em `profissionais` (`cep`, `rua`, `numero`, `complemento`, `bairro`, `estado`).
- `profissionais_disponiveis` ganha parâmetros de coordenada/raio e passa a calcular distância por haversine em SQL; `abrir_rodada_convites` usa esse filtro e inclui a distância no diagnóstico.
- `calcularOrcamento` recebe o perfil `airbnb`: base fixa, sem adicionais de cômodos e sem multiplicador, taxa administrativa por cima.
- Mapa: Leaflet + tiles OpenStreetMap carregado apenas no cliente (import dinâmico), geocodificação a partir do CEP.
- Fotos: upload direto do celular (`capture="environment"`), compressão no cliente antes do envio, URLs assinadas para leitura.
- Chat: RPC para marcar lidas, `useNaoLidas` por serviço e canal realtime compartilhado.
