# Área do cliente logado: correções em 8 frentes

## 1. Home do cliente — bug do pedido que desaparece

Confirmado no banco: os pedidos LAR-2026-0031 a 0035 estão com status `buscando`, e a lista de status considerada "reserva ativa" na home não inclui `buscando`. Por isso o LAR-2026-0035 cai no empty state.

- Incluir `buscando` (e manter `sem_profissional`) na reserva ativa da home.
- Estado A (sem reserva): mantido como está hoje, sem redesenho.
- Estado B (com reserva): recriado fiel ao mockup — topo de app (menu · LAR-77 · sino com badge), saudação, botão Ajuda/Suporte, card de reserva com badge verde **Confirmado** ou amarelo **Buscando**, 4 colunas (Data · Horário · Profissional · Código), card da profissional (foto, nota, km, tags, Chat, Ver perfil) ou o aviso "Aguardando uma profissional aceitar na sua região", card de detalhes com Total pago em dourado e botão Editar só antes de iniciar, card de endereço com Ver no mapa, timeline de 4 etapas, banner de proteção e tab bar fixa.

## 2. Travar jornadas

- Cliente logado que abrir `/profissional`, `/seja-profissional` ou `/trabalhe-conosco` é redirecionado para a home do cliente.
- Header logado passa a ser header de app: menu, logo e sino. Saem ACESSOS, Acesso profissional, Acesso administrativo e o CTA de landing.
- Profissional logada não vê botão de contratar faxina.

## 3. Matching na ordem correta

- O funil sempre dispara o alerta para as profissionais no raio antes de qualquer pagamento; só quem aceitou entra no radar do cliente.
- Se ninguém aceitar no prazo, a tela mostra "Estamos procurando. Você será avisado." com ações de trocar data e falar com o suporte — nunca "nenhuma profissional livre" como fim de fluxo. O pedido continua com status `buscando` e reaparece na home (Estado B).
- Pagamento apenas após escolha/aceite. Endereço completo e telefone só liberados após aceite + pagamento.
- Recusa posterior da profissional troca automaticamente por outra do radar, sem novo pagamento.

## 4. Wizard mais curto

Seis passos: Tipo do imóvel → Qual imóvel (lista dos cadastrados + cadastrar outro) → Duração → Data e horário → Profissional → Pagamento.

- Cômodos e tipo de limpeza (padrão/completa/pesada) viram campos opcionais dentro do passo de duração, não telas.
- Durações: 4h Básico (a partir de R$ 130), 6h Médio (R$ 180), 8h Master (R$ 230).
- Horários convencionais: 4h → 07:00, 08:00, 13:00; 6h e 8h → 07:00 e 08:00. Domingo bloqueado e mínimo de 24 horas de antecedência.
- Airbnb: pula a duração (4h fixas), preço fixo R$ 150 + taxa de 15% com o seguro embutido (sem linha de seguro), horários de 07:00 a 16:00, checklist fixo visível (roupa de cama, cozinha, banheiros, fotos após a limpeza).

## 5. Minhas reservas

- Aba própria no menu inferior, separada de Minha conta.
- No mobile deixa de ser tabela: cards com data, hora, imóvel, profissional (nome e foto reais), valor, código e status.
- Status exibidos: Buscando · Confirmada · Em andamento · Concluída · Cancelada.
- Cada card abre o detalhe com o mesmo layout do Estado B da home.

## 6. Airbnb

- Fotos obrigatórias da profissional ao finalizar, visíveis para o cliente no detalhe da reserva.
- Campo de fotos aparece somente nessa modalidade.
- Admin ganha configuração de preço e faixa de horários do checkout (07:00–16:00).

## 7. Limpeza de produto

- Remover o badge "Edit with Lovable" de todas as páginas.
- Suporte: um único botão de WhatsApp usado por cliente, profissional e admin. **Preciso do número real** — enquanto ele não vier, o botão passa a usar o número configurado no painel admin (Configurações do sistema) em vez do placeholder fixo no código.
- Termos, Privacidade e Ajuda: escrevo um texto mínimo real (termos, política de privacidade e FAQ curto) para você revisar depois.
- Favoritos sai do menu inferior (4 abas: Início · Minhas reservas · Mensagens · Conta).
- Rotas mortas (`/login`, `/reservas`, `/conta`, `/suporte`) redirecionam para a tela correta em vez de 404.
- CPF com máscara 000.000.000-00.
- Mensagens com bolinha vermelha quando houver não lida; nenhum contato direto por WhatsApp entre cliente e profissional.

## 8. Header e navegação logado

- Header de app em todas as telas do cliente, tab bar sempre visível.
- Início = home dos dois estados; Conta = meus dados (tudo editável exceto nome e CPF) + imóveis; Mensagens = chat interno.

## Detalhes técnicos

- `src/lib/queries.ts`: `STATUS_RESERVA_ATIVA` ganha `buscando`; nova query de lista de reservas do cliente com join real de profissional; query de fotos do serviço para o detalhe.
- `src/components/home/home-cliente.tsx`: variante "buscando" (badge amarelo, card de espera, timeline na etapa 0) e Editar condicional.
- Novo `src/components/app-header.tsx` (menu, logo, sino) usado quando há sessão de cliente; `site-header.tsx` fica só para visitante.
- Guardas de rota em `profissional.tsx`, `seja-profissional.tsx`, `trabalhe-conosco.tsx` via `usePapeis`.
- `src/routes/contratar.tsx` e `src/components/contratar/passos.tsx`: recomposição dos passos, grades de horário por duração/modalidade, checklist Airbnb, cômodos/tipo de limpeza como campos opcionais.
- Nova rota `src/routes/reservas.tsx` (lista em cards) + `reservas.$id.tsx` reaproveitando os cards do Estado B; rotas mortas com redirect.
- `src/routes/termos.tsx`, `privacidade.tsx`, `ajuda.tsx` deixam de ser placeholder.
- Migração apenas se necessário para configuração do checkout Airbnb em `site_config`; nenhuma alteração de preço ou regra fora do que está descrito.
- Somente tokens semânticos navy/dourado já definidos em `src/styles.css`.
