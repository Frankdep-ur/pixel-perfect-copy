# Preparar o teste real (profissional + contratante) com WhatsApp

Verifiquei o caminho todo do convite até o WhatsApp. O envio em si está funcionando (as últimas 4 mensagens saíram com status "enviada"), mas encontrei 3 pontos que vão atrapalhar o seu teste se não forem ajustados antes.

## O que está OK (verificado agora)

- Fila de WhatsApp: últimas mensagens de oportunidade e confirmação saíram como "enviada", com id da Z-API e sem erro.
- Normalização de número: aceita número brasileiro com 10/11 dígitos (adiciona 55) e número com DDI, como o de Portugal.
- Rede de segurança: o cron reprocessa a fila a cada 2 minutos caso o disparo imediato falhe.

## Problemas encontrados (precisam de correção antes do teste)

1. **O link do WhatsApp está apontando para um endereço que não existe.** A mensagem de oportunidade monta o link com `base_url`, e como esse campo não está definido em `site_config → orquestra`, ele cai no padrão `https://lar77.lovable.app`, que responde **404**. O endereço publicado real é `https://lar10.lovable.app`. Hoje a profissional receberia a mensagem, mas o link de aceitar abriria página de erro.
2. **A profissional nova entra como "pendente" e não recebe convite.** Quando a mulher da limpeza se cadastrar, o status fica `pendente`; a rodada só convida quem está `aprovada` e `disponivel`. Sem aprovar no Admin, o WhatsApp dela nunca recebe nada.
3. **Ela pode ficar fora da rodada por causa das profissionais de demonstração.** A rodada convida 5 por ordem de nota; existem 8 perfis de demonstração em Grande Florianópolis com nota 4.5–5.0 e telefones fictícios, enquanto um cadastro novo entra com nota 0. Resultado provável: as 5 mensagens vão para números falsos e ela não recebe nada.

## Correções propostas

- Definir `site_config → orquestra.base_url = https://lar10.lovable.app` para o link do WhatsApp abrir a tela "Nova oportunidade" de verdade.
- Colocar as profissionais de demonstração de Grande Florianópolis como indisponíveis durante o teste (`disponivel = false`), para a rodada convidar somente a profissional real.
- Ajustar `tamanho_rodada` para 1 durante o teste, evitando mensagens duplicadas, e voltar para 5 depois.
- Aprovar o cadastro da profissional real no Admin assim que ela terminar o cadastro (status `aprovada`, `disponivel = true`), com região Grande Florianópolis.

## Roteiro do teste depois do ajuste

```text
1. Profissional se cadastra (telefone real, com DDD) → eu aprovo no Admin
2. Contratante se cadastra, salva endereço em Florianópolis e faz o pedido
3. Rodada abre ──► WhatsApp 1: convite com link /oportunidade/{token}
4. Ela abre o link e aceita (prazo de 5 min)
5. Ficha dela aparece na tela do contratante → reserva de 5 min
6. Pagamento confirmado ──► WhatsApp 2: confirmação para ela
7. Início e finalização do serviço ──► WhatsApp 3: aviso de finalização
```

Observações do fluxo: a data não pode ser domingo (bloqueado por regra), o endereço precisa ser da região Grande Florianópolis e o telefone dela precisa estar com DDD (ex.: 48 9xxxx-xxxx) ou com DDI.

## Detalhes técnicos

- `site_config` e `profissionais.disponivel` ajustados por SQL direto (dados, não migração); reversão do `tamanho_rodada` e das demos no fim do teste.
- Nenhuma mudança em preços, RLS, telas ou nas funções `abrir_rodada_convites` / `responder_convite_token`.
- Verificação final na aba Admin → Orquestra: convites por rodada, canal da resposta (app/link) e status da fila.
