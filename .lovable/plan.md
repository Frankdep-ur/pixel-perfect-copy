# Home do cliente logado: dois estados (com e sem faxina)

A página inicial passa a se comportar como o app da imagem quando o cliente está logado. Visitante não logado continua vendo a home institucional atual.

## Estado 1 — cliente com faxina ativa

Ordem exata da imagem, em coluna única mobile:

1. Header: hamburger à esquerda, logo LAR-77 centralizado com "DIARISTAS DE CONFIANÇA", sino com badge vermelho à direita.
2. Saudação "Olá, [Nome]!" + "Sua faxina está confirmada." e botão outline dourado "Ajuda / Suporte" (headset) à direita.
3. Card de status: título, subtítulo, badge verde "Confirmado" e 4 colunas com ícones dourados — Data (data + dia da semana), Horário (faixa + duração), Profissional (nome), Código da reserva (#LAR77-xxxx).
4. Card "Profissional escolhida": foto circular, nome, ⭐ nota · nº de serviços, 📍 distância, tags (Experiente · Pontual · Caprichosa), botão outline "Chat" e link "Ver perfil →". Nenhum documento ou telefone exposto — contato só pelo chat interno.
5. Card "Detalhes da faxina": à esquerda tipo de serviço + descrição + método de pagamento com badge verde "Pago"; à direita valor do serviço, taxa Lar-77 (15%), seguro e Total pago em dourado grande. Botão outline "Editar".
6. Card "Endereço da faxina": pin, endereço completo com CEP, botão "Ver no mapa".
7. Card "O que acontece agora?": timeline horizontal de 4 etapas com ícones em círculo; etapa concluída com check verde, etapa atual destacada, futuras apagadas. Reaproveita a lógica de status já usada na tela de confirmação.
8. Banner de proteção: escudo dourado, "Você e sua casa protegidos!", texto sobre verificação e seguro, seta.
9. Tab bar inferior fixa já existente (Início ativo em dourado, badge de mensagens não lidas).

Se houver mais de uma faxina ativa, mostra a mais próxima no tempo.

## Estado 2 — cliente sem reserva ativa

Mesmo header, mesma identidade, mesma tab bar:

- Saudação "Olá, [Nome]!" + "Pronto para deixar sua casa brilhando?"
- Card dourado grande: "AGENDAR MINHA FAXINA" / "Preço na hora, sem surpresa" / seta → fluxo de contratação
- Dois atalhos: "Minhas reservas" (histórico) e "Imóveis cadastrados"
- Mini "Como funciona" em 4 passos compactos
- Banner de proteção em versão curta

## Regras

- Faxina com status pendente/confirmada/aceita/a caminho/em andamento → Estado 1. Sem nenhuma ativa → Estado 2.
- Visitante deslogado → home institucional atual, sem alteração.
- Zero link direto de WhatsApp nesses estados; contato com a profissional só via chat interno.

## Detalhes técnicos

- Nova query em `src/lib/queries.ts`: próxima reserva ativa do cliente (booking + endereço + profissional + nota/serviços/distância), reaproveitando o padrão de seleção já usado em `confirmacao.$id.tsx`.
- `src/routes/index.tsx` passa a ramificar: sem `user` → conteúdo institucional atual; com `user` → novo componente de home do app.
- Novos componentes em `src/components/home/`: `home-cliente.tsx` (Estado 1), `home-cliente-vazia.tsx` (Estado 2) e cards reutilizáveis (status, profissional, detalhes, endereço, timeline, banner de proteção).
- Header: variante logada com hamburger + logo central + sino com badge, dentro do `site-header` existente.
- Somente tokens semânticos do design system (navy/dourado já definidos em `src/styles.css`); nenhuma cor nova hardcoded.
- Nenhuma mudança de schema, preço ou regra de negócio — apenas leitura e apresentação.
