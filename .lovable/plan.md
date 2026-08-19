# Contratação de teste ao vivo com WhatsApp ponta a ponta

Objetivo: você acompanhar, no seu WhatsApp, todas as mensagens que o sistema envia numa contratação real — convite para a profissional, confirmação depois do pagamento e aviso de finalização.

## O que precisa ser ajustado antes do teste

1. **Números de teste**: as profissionais de demonstração têm telefones fictícios (ex.: `(48) 90001-0001`), então nada chegaria no seu celular. Para o teste vou apontar temporariamente o telefone de **uma** profissional aprovada de Florianópolis e o telefone do **cliente de teste** para o seu número **+351 961 395 247**, e no fim devolvo os valores originais.
2. **Rodada de 1 convite**: enquanto o teste roda, `site_config → orquestra.tamanho_rodada` vai para **1**, para você receber um convite por vez e não 5 mensagens iguais. Depois volta para 5.
3. **Correção de bug encontrado**: a home está falhando com "permission denied for function has_role" ao carregar o carrossel. A política de leitura de `home_slides` chama `has_role`, mas o papel anônimo não tem permissão de executar essa função. Vou conceder `EXECUTE` em `has_role` para `anon` (a função é `security definer` e só devolve verdadeiro/falso, sem expor dados). Sem isso o carrossel da home fica quebrado durante o teste.

## Roteiro do teste (o que vai acontecer, em ordem)

```text
1. Cliente de teste faz o pedido no funil (Florianópolis, 4h, limpeza padrão)
2. Rodada abre  ──► WhatsApp 1: convite com link /oportunidade/{token}
3. Aceite pelo link (5 min de prazo)
4. Ficha da profissional aparece na tela do cliente → reserva de 5 min
5. Pagamento confirmado ──► WhatsApp 2: confirmação para a profissional
6. Profissional inicia e finaliza o serviço ──► WhatsApp 3: aviso de finalização
```

Em cada etapa eu te aviso qual mensagem acabou de sair, com o horário e o id retornado pela Z-API, e confirmo na fila (`notificacoes_whatsapp`) se ficou "enviada" ou "falhou".

## Como vou executar

- Navegador automatizado no preview: criação da conta de teste, endereço em Florianópolis, funil completo (imóvel, ambientes, 4h, padrão, data útil), radar, escolha da profissional e pagamento simulado.
- Aceite feito pelo link com token da própria mensagem, igual ao fluxo real da profissional.
- Início/finalização pelo painel da profissional para disparar a terceira mensagem.
- Checagem final no painel Admin → Orquestra: convites por rodada, status da instância e fila de mensagens.

## Detalhes técnicos

- Migração: `GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;`
- Dados de teste aplicados via SQL direto (não migração): `profiles.telefone` da profissional escolhida e do cliente de teste, e `site_config.orquestra.tamanho_rodada = 1`; reversão ao final no mesmo turno.
- Envio continua pelo caminho já existente: `abrir_rodada_convites` → fila → `dispararFilaWhatsapp`/`drenarFila` → Z-API `send-text`, com a rede de segurança do cron a cada 2 minutos.
- Nenhuma mudança em regras de preço, RLS de bookings ou telas.

## Confirmação que preciso de você

Se o número para receber tudo não for **+351 961 395 247**, me diga qual usar antes de eu começar.
