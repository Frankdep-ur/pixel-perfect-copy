# LAR10 — Acessos separados, agenda real e fluxo de aceite

Entrega em 3 etapas, mobile-first. WhatsApp via links `wa.me` com mensagem pronta (1 clique), mais avisos dentro do site — sem custo de API.

## Etapa 1 — Acessos separados + agenda e regras de horário

**Três portas de entrada**
- `/entrar` (cliente): login/cadastro do cliente, leva para "Minha conta".
- `/profissional/entrar`: login/cadastro da profissional, leva para o painel dela.
- `/admin/login` (já existe): mantido separado, fora do site.
- Cada login valida o papel do usuário e recusa quem não pertence ao ambiente. Header mostra "Entrar" (cliente) e "Sou profissional" como itens distintos; botão **Suporte** visível no header e no rodapé.

**Regras de horário por duração**
- 4h = Básico → 07:00, 08:00 ou 13:00
- 6h = Médio / 8h = Master → apenas 07:00 ou 08:00
- Trocar a duração reajusta o horário escolhido automaticamente.
- **Domingo bloqueado em todo o sistema** (cliente e profissional).

**Agenda da profissional**
- Calendário no painel dela para marcar dias indisponíveis (faxina em outro lugar), com desmarcar.
- Dias bloqueados e dias com serviço aceito somem para os clientes.

**Disponibilidade na contratação**
- Depois de data + horário, a lista mostra somente profissionais da região que não estão bloqueadas nem com compromisso naquela data/horário.
- Opção "Deixe que a LAR10 escolha a profissional ideal" — sorteio entre as disponíveis no momento do pagamento.

**Seguro**
- O valor do seguro passa a ser somado dentro da taxa administrativa; nenhuma linha "Seguro" aparece no resumo/checkout do cliente. O admin continua vendo a composição.

## Etapa 2 — Fluxo de aceite e comunicação

- Após o pagamento: agenda do cliente reservada, serviço fica "aguardando aceite".
- A profissional vê o pedido no painel com **Aceitar** / **Recusar** e um botão de WhatsApp pronto para o aviso.
- Recusa → o sistema reatribui automaticamente para outra profissional disponível (sem ação do cliente); se não houver ninguém, o serviço volta para a fila aberta e o cliente é avisado.
- Só após o aceite o cliente vê a profissional e **apenas**: Nome, Telefone, Cidade e Foto — mais nada.
- Após confirmação, botão de WhatsApp entre cliente e profissional.
- Controle do serviço: profissional tem "Iniciar Faxina" e "Faxina Finalizada"; cliente tem "Faxina Finalizada". Ao finalizar, o sistema gera o aviso de WhatsApp para o cliente confirmar; com a confirmação o pagamento é liberado e serviço + seguro são encerrados.
- Painel da profissional deixa de exibir qualquer CTA de "Contratar faxina".

## Etapa 3 — Painel administrativo completo

**Profissional**
- Ficha com todos os dados, foto e documentos.
- Documentos: CNH ou RG, CPF e comprovante de residência — enviados pela profissional no cadastro (com opção de tirar foto pelo celular) e também substituíveis pelo admin.
- Telefone de recado (contato de emergência) obrigatório no cadastro.
- Campo de mensagem interna: admin envia mensagem que aparece no painel da profissional.
- Agenda completa da profissional: dias bloqueados + compromissos agendados.

**Cliente**
- Ficha com nome, telefone, e-mail, **endereço completo** (obrigatório e destacado), nº de contratações e valor total gasto.

**Avaliações**
- Admin vê todas e pode editar o texto, ocultar/bloquear ou excluir (moderação de linguagem imprópria). Avaliações bloqueadas não aparecem no site.

**Edição limitada pela profissional**
- Nome, Telefone, E-mail e Documentos ficam somente leitura para ela (alteração só pelo admin); bio, cidades, regiões, tipos de limpeza, raio e disponibilidade seguem editáveis.

## Detalhes técnicos

- Banco: novas colunas em `profissionais` (documentos: `doc_identidade_url`, `doc_cpf_url`, `comprovante_url`, `telefone_recado`), tabela `profissional_bloqueios` (dias indisponíveis), `mensagens_admin` (mensagem interna), colunas de moderação em `avaliacoes` (`bloqueada`, `editada_em`), e novos status em `bookings` (`aguardando_aceite`, `recusada`, `aguardando_confirmacao_cliente`, `concluida`). Todas com GRANTs e RLS: profissional lê/escreve o que é dela, admin via `has_role`, cliente só o próprio booking.
- Disponibilidade calculada por função no banco (server-side) cruzando região, bloqueios e bookings ativos por data/hora — evita expor dados de profissionais indisponíveis.
- Sorteio automático e reatribuição em server function, com transação para não atribuir a mesma profissional duas vezes no mesmo horário.
- Documentos em bucket privado, exibidos via URL assinada apenas para a própria profissional e admin.
- Regras de horário e bloqueio de domingo centralizados num único módulo usado por cliente, profissional e admin.
