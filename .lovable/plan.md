# Lar77 — rebranding, chat interno e configurações do sistema

Entrega em 4 blocos. Tudo mobile-first.

## 1. Identidade Lar77

- Renomear "LAR10" para "Lar77" em todas as telas, títulos, e-mails de texto, rodapé e metadados (SEO/OG).
- Nova paleta a partir da logo: azul-marinho profundo como cor primária e dourado como cor de destaque, definidos como tokens no design system (sem cores fixas em componentes).
- Logo enviada publicada como asset e usada no header, rodapé, tela de login e ícone do app.
- Slogan principal: "Lar77 — O jeito inteligente de cuidar do seu espaço."

## 2. Página inicial

- Menu: remover "Segurança" e "Seja profissional". Ficam apenas "Entrar" e "Sou profissional".
- Hero: carrossel (até 3 imagens) + slogan + dois botões em maiúsculas: AGENDAR MINHA FAXINA e TRABALHE CONOSCO.
- Nova seção "Como funciona a Lar77?" com os 5 passos e o bloco "Garantia Lar77", com os textos exatamente como enviados.
- Nova seção "Trabalhe com a Lar77" com os 5 benefícios e o fechamento, textos exatamente como enviados.
- Remover as seções antigas que foram substituídas (jornada duplicada e faixa de segurança antiga).

## 3. Área do cliente

- CPF obrigatório no cadastro (validação de formato e de 11 dígitos).
- Histórico de serviços completo: data, horário, imóvel, profissional que atendeu e valor — com totalizador para relatório.
- Abas mantidas: Dados do imóvel, Histórico, Meus dados. Em "Meus dados", nome e documentos permanecem bloqueados.
- Remover o botão de WhatsApp entre cliente e profissional.
- Chat interno por serviço, em tempo real, liberado após o aceite e encerrado alguns dias depois da conclusão; o admin pode ler as conversas.

## 4. Área da profissional

- Mesma estrutura da área do cliente: Histórico, Meus dados, Agenda, Serviços.
- "Anos de experiência" e "Distância máxima atendida" passam a nascer em branco e são obrigatórios.
- Chave PIX obrigatória, com confirmação de que está no mesmo nome da titular (nome comparado com o cadastro).
- Documentos obrigatórios com regra: CNH enviada dispensa CPF; RG enviado torna CPF obrigatório. O cadastro só fica "completo" quando a regra é atendida.
- Chat interno com o cliente, sem WhatsApp.

## 5. Painel administrativo

- Nova aba "Cancelamentos": todos os cancelamentos (do cliente ou da profissional) com quem cancelou, quando, motivo e valor envolvido.
- Cancelar passa a registrar motivo e autor.
- Botão "Suporte" visível para admin, cliente e profissional, abrindo o WhatsApp da empresa.
- Nova aba "Configurações do sistema", com edição de:
  - textos do site (slogan, seções da home, rodapé)
  - imagens e banners
  - carrossel (máximo 3 imagens)
  - logo
  - cores do site (primária, destaque, fundo), com pré-visualização
- O site passa a ler esses valores do banco, com os textos atuais como padrão caso nada esteja configurado.

## Detalhes técnicos

Banco (migrações):
- `site_config`: chave/valor JSON para textos, imagens, logo e cores; leitura pública, escrita apenas admin.
- `conversas` e `mensagens` ligadas a `bookings`, com RLS para cliente, profissional do serviço e admin; Realtime habilitado na tabela de mensagens.
- `cancelamentos`: booking, autor, papel, motivo, timestamp; leitura apenas admin (e o próprio autor).
- `profissionais`: colunas `pix_chave`, `pix_tipo`, `pix_titular`; `anos_experiencia` e `raio_km` passam a aceitar nulo para nascerem em branco.
- `profiles.cpf` obrigatório no fluxo de cadastro (validação na aplicação, sem quebrar cadastros existentes).

Frontend:
- Tokens de cor em `src/styles.css`, com sobrescrita em tempo de execução a partir de `site_config` no root.
- Chat com hook de Realtime por conversa, canal criado em `useEffect` e removido no unmount.
- Componentes novos: chat (cliente/profissional/admin), histórico com relatório, configurações do sistema no admin, aba de cancelamentos.
