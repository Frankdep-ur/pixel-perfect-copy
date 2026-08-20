# Aceite pelo WhatsApp (responder na conversa) + aceite no app

Hoje ela só aceita de duas formas: no painel do app ou abrindo o link do WhatsApp. Falta a terceira: **responder direto na conversa do WhatsApp**. Isso é o que este plano adiciona — sem mexer em nada do fluxo atual.

## Como fica para a mulher da limpeza

1. A mensagem de oportunidade passa a terminar com:
   "Responda *1* para ACEITAR ou *2* se estiver INDISPONÍVEL — ou toque no link para abrir o Lar77."
2. Ela responde **1** (também aceita: SIM, ACEITO, ACEITAR) → o aceite entra na hora, mesmo resultado do botão do app.
3. Responde **2** (ou NAO, NÃO, INDISPONIVEL) → fica marcada como indisponível.
4. O sistema responde na conversa:
   - aceito: "Recebemos seu aceite! Agora aguarde a escolha do cliente."
   - indisponível: "Ok, avisamos que você não está disponível."
   - prazo vencido / vaga preenchida: mensagem explicando e convidando a abrir o app.
   - texto que não entendemos: "Não entendi. Responda 1 para aceitar ou 2 para indisponível."
5. Se ela tiver mais de um convite aberto, vale o mais recente enviado para o número dela.

Os caminhos já existentes (aceite no painel e aceite pelo link) continuam iguais, e o card no app aparece do mesmo jeito depois do aceite pelo WhatsApp.

## Painel administrativo

Na aba Orquestra o convite passa a mostrar também o canal **whatsapp**, além de **app** e **link**, para você saber por onde ela respondeu.

## Detalhes técnicos

- Migração: nova função `responder_convite_whatsapp(_telefone text, _aceitar boolean)` (security definer) que normaliza o telefone, acha o convite `enviado` e não expirado mais recente da profissional dona daquele número e reaproveita a mesma lógica de `responder_convite` (prazo, reserva, encerramento dos outros), gravando `canal_resposta = 'whatsapp'`. Retorna o status resultante (`aceito`, `indisponivel`, `expirado`, `sem_convite`).
- Nova rota pública `src/routes/api/public/zapi-receber.ts` (webhook "Ao receber" da Z-API): valida um segredo na querystring, extrai telefone e texto do payload, interpreta a intenção (1/sim/aceito vs 2/nao/indisponivel), chama a função do banco com o cliente admin e enfileira a resposta de volta em `notificacoes_whatsapp` (a fila/cron existente entrega).
- Texto da oportunidade ajustado no gerador da orquestra para incluir as instruções 1/2, mantendo o link com token.
- Admin Orquestra: rótulo do novo canal.
- Segredo `ZAPI_WEBHOOK_TOKEN` pedido a você para proteger a rota; depois é só colar a URL do webhook no painel da Z-API (eu te passo a URL pronta).
- Verificação no fim: rodo o app, confiro que compila e faço um teste do webhook simulando "1" e "2" num convite de teste, checando `booking_convites.status`, `canal_resposta` e a resposta enfileirada.
