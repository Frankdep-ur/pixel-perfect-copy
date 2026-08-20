# Por que a mensagem não caiu no WhatsApp da Juliete

## O fluxo, como ele funciona hoje

```text
1. Cliente entra em /contratar, descreve o imóvel, escolhe data e hora
2. Ao final, o pedido é criado com status "buscando"
3. O sistema procura profissionais: aprovada + disponível + mesma região
   + sem bloqueio na data + sem outra faxina já aceita naquela data
4. Convida até 3 delas (tamanho_rodada = 3), prazo de 5 minutos
5. Para cada convite, entra uma mensagem na fila de WhatsApp e a Z-API envia
6. Ela aceita: pelo link da mensagem, pelo app, ou respondendo "1" na conversa
7. Cada aceite aparece na tela do cliente; ele escolhe uma (reserva de 5 min)
8. Pagamento confirma a contratação e dispara a mensagem de confirmação
```

## O que realmente aconteceu nos seus testes

Verifiquei os registros do banco:

- Pedido **LAR-2026-0027** (22/08, 07:00, Ingleses): o convite foi criado para a **Juliete** e a mensagem de oportunidade foi enviada com sucesso, seguida da confirmação. Ou seja, o sistema mandou para ela — **mas para o número que está no cadastro dela: 17 92003-4155**.
- A resposta que chegou na conversa veio de outro número: **18 99170-9288**. Como esse número não pertence a nenhum convite, o sistema respondeu "Não entendi".
- Conclusão: o número gravado no cadastro da Juliete está errado (DDD 17 em vez de 18, e sem o nono dígito no formato certo). A mensagem foi para um número que não é o WhatsApp dela.
- Pedido **LAR-2026-0028** (mesma data 22/08, criado 19:05): **zero convites**. A Juliete já tinha aceito a faxina do dia 22/08, então ficou fora da busca, e as demais profissionais de Florianópolis estão marcadas como indisponíveis. O pedido ficou parado em "buscando" sem avisar ninguém.
- Também existem **vários cadastros repetindo o mesmo telefone** (18 99805-4798 em 8 perfis), o que pode fazer uma resposta no WhatsApp cair no convite da pessoa errada.

## O que eu proponho corrigir

1. **Corrigir o número da Juliete** para o WhatsApp real (18 99170-9288) e reenviar a oportunidade, se você quiser repetir o teste.
2. **Validação de telefone no cadastro e no admin**: recusar número brasileiro sem 11 dígitos ou com nono dígito faltando, e mostrar o número já normalizado (+55 18 99170-9288) na tela da profissional e na ficha do admin, para dar para conferir antes de aprovar.
3. **Confirmação do WhatsApp**: no momento em que o admin aprova a profissional, o sistema manda uma mensagem curta de boas-vindas para o número cadastrado. Se ela não responder/receber, o número está errado e aparece um aviso na ficha.
4. **Aviso de número duplicado**: quando dois cadastros compartilham o mesmo telefone, marcar na ficha do admin e não usar a resposta por WhatsApp para esses casos (ela ainda aceita pelo link ou pelo app).
5. **Pedido sem ninguém para convidar**: em vez de ficar girando em silêncio, a tela do cliente passa a dizer que não há profissional livre naquela data e oferece trocar data/horário ou falar com o suporte; o pedido é registrado como sem profissional no painel Orquestra.

## Detalhes técnicos

- Normalização única de telefone (DDI + DDD + nono dígito) reutilizada no cadastro, no admin e no envio Z-API.
- Casamento da resposta por WhatsApp deixa de usar apenas os 8 últimos dígitos: compara o número completo normalizado e ignora convites quando há telefone duplicado entre profissionais.
- Correção do número da Juliete via atualização de dados (não é mudança de schema).
- Ajuste na tela de busca do cliente para o caso "rodada com 0 convites" já na primeira rodada.
