# Área da profissional: app de operação + matching ligado

## O que está errado hoje (verificado)

- `/` para quem é profissional cai na landing institucional (com "AGENDAR MINHA FAXINA"): o `index.tsx` só desvia para a home do cliente quando o usuário **não** é profissional.
- `/profissional` mostra o painel de operação **e**, logo abaixo, perfil + documentos + calendário de folga na mesma tela — o "formulário infinito".
- Matching: as reservas em `buscando` de Florianópolis (LAR-2026-0031 a 0035) têm apenas **1 convite cada, todos com status `expirado`** (prazo de 5 min). Nada reabre rodada depois disso, então o pedido fica "buscando" para sempre e **nenhuma** profissional vê a oportunidade. A profissional aprovada/disponível de Florianópolis (raio 15 km, com mapa preenchido) nunca foi convidada nessas reservas porque na hora da criação ela não estava elegível — e não existe segunda chance.
- A função que reabre rodada (`abrir_rodada_convites`) exige ser o cliente do pedido ou admin, ou seja não pode ser chamada por rotina automática nem pela profissional.
- Telas da profissional ainda trazem jornada de cliente: menu com "Contratar agora", Mensagens com "quando uma profissional aceita o seu serviço" + botão "Contratar faxina", e a aba Conta é a do cliente (Meus imóveis, Nova limpeza).

## 1. Home da profissional = app

`/profissional` passa a ter só: cabeçalho (foto, nome, badge Verificada, switch Disponível) + 4 abas de operação — **Oportunidades, Pedidos, Agenda, Histórico**. Nada de cadastro embaixo.

- Perfil, documentos, PIX, endereço/mapa e calendário de folga saem de `/profissional` e vão para uma nova rota de conta da profissional (`/profissional/conta`), em abas próprias.
- Se ainda não existe cadastro, `/profissional` continua mostrando o formulário de cadastro (não redesenhado).
- Se o endereço/mapa estiver vazio, aparece um aviso curto no topo com link para a Conta e o switch "Disponível" fica travado até preencher — quem já está aprovada continua recebendo os pedidos atuais.
- Se estiver "Em análise", só a mensagem de análise (como hoje).

Menu inferior quando o usuário é profissional: **Início → `/profissional`**, **Minhas faxinas → `/profissional` (aba Agenda)**, **Mensagens → `/mensagens`**, **Conta → `/profissional/conta`**. E `/` redireciona a profissional para `/profissional`, então a landing do cliente nunca aparece para ela.

## 2. Ligar o matching

Sem mudar as regras de elegibilidade já existentes (aprovada + disponível + dentro do raio pelo mapa, sem domingo, sem dia bloqueado, sem outra faxina aceita no mesmo dia), acrescentar:

- Nova função de banco `reabrir_rodadas_pendentes()` (security definer, sem exigir ser o cliente) que percorre pedidos em `buscando`/`sem_profissional` com data futura e sem convite vivo, e abre nova rodada convidando quem ainda não foi convidada naquele pedido.
- Agendamento com pg_cron de minuto em minuto chamando essa função, para que uma profissional que ficou disponível hoje receba os pedidos abertos.
- Rodar a função uma vez na própria migração para que as reservas Airbnb de Florianópolis em `buscando` caiam agora na aba Oportunidades da profissional aprovada.
- Quando a profissional recusa ou deixa expirar, o convite dela sai da lista e o pedido volta a ser oferecido às outras do raio na próxima rodada (é o que a função passa a garantir).

Aba Oportunidades mantém o que já mostra (data, horário, bairro/cidade, tipo Airbnb ou 4/6/8h, valor que ela recebe, Aceitar/Indisponível) — o texto do botão de recusa passa a "Recusar" e o card ganha o tipo de imóvel. Nada de endereço completo ou telefone do cliente antes do aceite + pagamento (regra já vigente, mantida).

## 3. Andamento na Agenda

Cada faxina aceita na Agenda: data, horário, tipo, bairro; depois do pagamento libera endereço completo e botão Chat; botões **Iniciar faxina** e **Faxina finalizada**. Airbnb continua exigindo o mínimo de fotos antes de finalizar. Ao finalizar, o cliente é avisado no chat interno (já existe) e na fila de WhatsApp da central; o cliente confirma e libera o pagamento.

## 4. Separar as jornadas

- Cabeçalho/menu: para profissional, sem "Contratar agora"; links viram Início / Minhas faxinas / Mensagens / Conta.
- `/mensagens`: texto e botão do estado vazio variam por papel — para profissional, "O chat abre quando um cliente te escolhe" com link para Oportunidades, sem "Contratar faxina".
- `/profissional/entrar`: só entrar / criar conta de profissional, sem atalho de cliente.
- Conta da profissional edita foto, bio, raio, experiência, endereço/mapa, PIX, recado, tipos de limpeza e calendário; nome, telefone, e-mail e documentos ficam somente leitura.

## Detalhes técnicos

- Migração SQL: `reabrir_rodadas_pendentes()` (definer, reaproveita `abrir_rodada_convites` com bypass de permissão via lógica interna), `cron.schedule` de 1 min, e execução única no fim da migração.
- Front: `src/routes/profissional.tsx` enxuto; nova rota `src/routes/profissional.conta.tsx` reunindo `PerfilProfissional`, `DocumentosProfissional`, `EnderecoProfissional`, `BloqueiosProfissional`; `servicos-profissional.tsx` mantém as 4 abas e aceita aba inicial por querystring (`?aba=agenda`); `tab-bar-mobile.tsx` com o conjunto de abas da profissional; `index.tsx` redireciona profissional para `/profissional`; ajustes de texto em `mensagens.tsx`, `site-header.tsx` e `profissional_.entrar.tsx`.
- Home do cliente e funil do cliente não são tocados.
