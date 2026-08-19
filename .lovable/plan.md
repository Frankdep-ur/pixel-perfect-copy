# Aceite pelo link do WhatsApp abrindo o app

Melhor caminho: manter o aceite no link — mas com o link levando ela para dentro do Lar77, não para uma página solta. Assim ela conhece o app, vê o painel dela e o aceite fica sempre no mesmo lugar.

## Como fica para a profissional

1. Chega a mensagem de oportunidade com um botão de link único (token de 5 min).
2. O link abre o app na tela **Nova oportunidade**, em tela cheia, com serviço, duração, data, hora, bairro/cidade e valor a receber — mais a contagem regressiva.
3. Dois botões grandes: **ACEITAR** e **ESTOU INDISPONÍVEL**.
4. Se ela já estiver logada no celular (o normal, porque a sessão fica salva), o aceite acontece na hora e ela cai direto no painel dela, com o serviço já na aba "Aguardando escolha do cliente".
5. Se não estiver logada, ela aceita ali mesmo pelo token (sem travar o aceite por causa de login) e a tela oferece **Entrar no app para acompanhar** — depois do login ela volta exatamente para essa oportunidade.
6. Prazo vencido ou vaga já preenchida: a página explica com clareza e mostra as próximas oportunidades / botão para abrir o painel.

Nada muda para o cliente e nenhuma regra de prazo, rodada ou reserva é alterada.

## Instalar como app

Para o link parecer app de verdade no celular:
- a página de oportunidade ganha o convite discreto **"Adicionar Lar77 à tela de início"** (Android/Chrome com o prompt nativo, iPhone com as instruções de Compartilhar → Adicionar à Tela de Início);
- quando o app já está instalado, o link abre dentro dele em vez do navegador.

## Painel administrativo

Na aba Orquestra cada convite mostra por onde veio a resposta: **app** (logada) ou **link** (token). A fila de WhatsApp continua igual, com o texto exato enviado.

## Detalhes técnicos

- `src/routes/oportunidade.$token.tsx` é redesenhada como tela de app (header Lar77, card do serviço, contagem, dois botões de 52px), reaproveitando `convite_por_token` e `responder_convite_token` — nenhuma função nova no banco para o aceite.
- Detecção de sessão: se `supabase.auth.getUser()` retorna a profissional dona do convite, a resposta usa `responder_convite` (canal `app`) e navega para `/profissional`; senão usa o token (canal `link`).
- Retorno pós-login: link "Entrar no app" vai para `/profissional_/entrar?redirect=/oportunidade/{token}` e a tela de acesso navega de volta para o caminho salvo (validado como caminho interno, nunca URL externa).
- Texto da mensagem de oportunidade ajustado no gerador da orquestra para chamar a ação ("Toque para abrir o Lar77 e aceitar") — o link continua o mesmo formato com token.
- Migração: coluna `canal_resposta text` em `booking_convites` (`app` | `link`), preenchida por `responder_convite` e `responder_convite_token`; exibida no admin.
- PWA: usa o `public/manifest.json` já existente; adiciono um componente de convite de instalação (`beforeinstallprompt` no Android, instruções no iOS) exibido na tela de oportunidade e no painel da profissional.
- Sem webhook e sem novos segredos nesta fase. Se depois você quiser aceite respondendo "1" direto na conversa, isso entra como camada extra em cima desse mesmo fluxo.
