# Telefone/WhatsApp: aceitar DDD de qualquer lugar

Objetivo: qualquer pessoa (cliente ou profissional) pode cadastrar o WhatsApp com qualquer DDD do Brasil ou número internacional, e as notificações vão para o número real informado.

## O que muda

1. **Campo de telefone unificado e tolerante**
   - Um único componente de input de WhatsApp usado no cadastro (cliente e profissional), em "Meu perfil" e no perfil da profissional.
   - Aceita: `(48) 99999-9999`, `48999999999`, `+55 11 ...`, `+351 961 ...` — qualquer DDD e qualquer DDI, com ou sem espaços, parênteses, pontos ou hífens.
   - Sem lista fixa de DDDs válidos e sem travar em 11 dígitos. Validação mínima apenas: pelo menos 8 dígitos (evita salvar número vazio/incompleto).
   - Dica visível abaixo do campo: "Qualquer DDD do Brasil ou número internacional (use +DDI)".

2. **Normalização única do número**
   - Regra central: se o número começar com `+`, respeita o DDI informado; se tiver 10–11 dígitos sem DDI, assume Brasil (55); qualquer outro caso mantém o que foi digitado.
   - Mesma regra usada nos links `wa.me` e no envio pela Z-API, evitando divergência entre tela e mensagem.

3. **Notificações para o número real**
   - Os avisos da orquestra passam a ir sempre para o WhatsApp cadastrado por cada pessoa (nada de número de teste fixo).
   - O tamanho da rodada de convites volta ao valor normal (3) e as profissionais de demonstração que foram desativadas para o teste voltam a ficar disponíveis apenas se você quiser — por padrão vou manter as de demonstração indisponíveis para não poluir os envios reais.

4. **Aviso de erro claro**
   - Se a Z-API rejeitar o número (fora do WhatsApp, DDI inválido), a falha aparece no painel Administrativo > Orquestra com o motivo, em vez de falhar em silêncio.

## Detalhes técnicos

- Novo `src/components/campo-telefone.tsx` (input controlado + máscara suave apenas para números brasileiros, texto livre para internacionais).
- `src/lib/whatsapp.ts`: `numeroInternacional` passa a preservar DDI quando o usuário digita `+`; adiciona `telefoneValido()` (>= 8 dígitos).
- `src/lib/zapi.server.ts`: `numeroZapi` reaproveita a mesma lógica de normalização.
- Ajuste em `src/components/auth/form-acesso.tsx`, `src/components/cliente/meu-perfil.tsx`, `src/components/profissional/cadastro-profissional.tsx` e `perfil-profissional.tsx` para usar o novo campo.
- Migração pequena: `site_config.orquestra.tamanho_rodada` de 1 para 3.

## Fora do escopo

- Nenhuma mudança de paleta, fontes, textos da home ou estrutura de telas.
- Nenhuma mudança nas regras de preço, seguro ou taxa administrativa.
