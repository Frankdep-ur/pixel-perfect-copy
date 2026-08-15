# LAR10 — Perfil do cliente, múltiplos imóveis, home institucional e carrossel

## 1. Área do Cliente

**Editar perfil (em Minha conta)**
- Campos editáveis: telefone, e-mail, data de nascimento, foto.
- Campos bloqueados (somente leitura, com aviso "para alterar, fale com o suporte"): nome e CPF.

**Meus imóveis**
- Nova aba "Meus imóveis" em Minha conta: listar, adicionar, editar, excluir e definir imóvel padrão.
- Cada imóvel guarda apelido (ex.: "Casa", "Apartamento praia"), CEP com busca automática, rua, número, complemento, bairro, cidade e região.
- Endereços ficam salvos na conta e reaproveitados em toda contratação.

**Contratação sem fricção**
- "Contratar uma faxina" na home passa a exigir login: quem não estiver logado vai para a tela de entrar/criar conta e volta ao funil depois.
- O passo 1 do funil deixa de pedir endereço do zero: mostra os imóveis salvos em cartões para seleção (o padrão já vem marcado), com opção "Cadastrar novo imóvel" para quem ainda não tem nenhum.
- O imóvel escolhido é vinculado à contratação, sem duplicar endereços no banco.

**Profissional escalada**
- Após o aceite, o cartão do serviço em Minha conta mostra foto, nome, cidade e contato com botão de WhatsApp (mantido e reforçado visualmente). Antes do aceite, nada disso aparece.

## 2. Página inicial

- Remover a seção "Profissionais da sua região".
- Reescrever "Como funciona" como seção institucional em 4 etapas calmas: criar conta → escolher serviço e imóvel → contratar com pagamento protegido → serviço realizado e avaliado.
- Hero com carrossel de até 3 imagens (autoplay suave, setas/indicadores, swipe no mobile), layout no mesmo espírito do print enviado: título grande à esquerda, imagem em cartão arredondado à direita, faixa escura de confiança abaixo. A foto da profissional enviada entra como primeira imagem do carrossel.
- Estrutura preparada para logo e imagens de capa vindas do painel; se o admin não configurar nada, o carrossel usa a imagem padrão.
- "Deixe que a LAR10 escolha a profissional ideal para o seu perfil" continua na etapa de seleção da profissional.

## 3. Painel administrativo

- Novo item "Carrossel": upload de imagens (máx. 3), reordenar, definir título/legenda opcional, ativar/desativar e remover.
- Bloqueio de adicionar a 4ª imagem, com aviso claro.

## Detalhes técnicos

- Banco: adicionar `apelido` em `enderecos` (a tabela já existe com user_id, CEP, região, padrão). Nova tabela `home_slides` (image_url, titulo, ordem, ativo) com leitura pública e escrita apenas para admin; bucket público `site` para as imagens do carrossel.
- `src/lib/contratacao.ts`: rascunho passa a guardar `endereco_id` do imóvel escolhido, mantendo compatibilidade com o rascunho atual em sessionStorage.
- `PassoEndereco` vira seletor de imóveis salvos + formulário de novo imóvel (reaproveitando a busca por CEP e `regiaoPorCidade`).
- `checkout.tsx` deixa de inserir endereço quando um imóvel salvo é usado e apenas referencia `endereco_id`.
- Home: novo `src/components/hero-carrossel.tsx` (Embla, já disponível via shadcn carousel); remoção de `profissionais-regiao.tsx` da home; nova rota `src/routes/admin.carrossel.tsx` + item na navegação do admin.
- Imagem enviada publicada como asset CDN e usada como slide padrão.
