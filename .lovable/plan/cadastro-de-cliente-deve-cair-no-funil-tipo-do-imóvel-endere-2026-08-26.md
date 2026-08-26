# Cadastro de cliente deve cair no funil (tipo do imóvel → endereço)

## Problema
Hoje, ao criar conta de cliente, o usuário é redirecionado para `/minha-conta` (destino padrão em `src/components/auth/form-acesso.tsx`, `CONFIG.cliente.destino`). O esperado: após o cadastro, o cliente cai direto em `/contratar`, na etapa "Qual o tipo do imóvel?" e depois cadastra o endereço — fluxo já existente no wizard.

## Mudança
Em `src/components/auth/form-acesso.tsx`:

1. **Separar o destino de cadastro do destino de login.** Login continua indo para `/minha-conta` (quem já tem conta volta para sua área). Cadastro de **cliente** passa a ir para `/contratar`.
   - Na função `cadastrar()`, usar `papel === "cliente" ? "/contratar" : destino` como destino do navigate e do `emailRedirectTo`.
   - Respeitar `next` quando existir (ex.: usuário tentou contratar, foi mandado logar e criou conta): se `next` estiver definido, ele tem prioridade.
2. **Manter o login como está** (`/minha-conta` ou `next`).
3. Profissional não muda: cadastro segue indo para `/profissional`.

## Detalhes técnicos
- Arquivo único: `src/components/auth/form-acesso.tsx`.
- A rota `/contratar` já exige login e já inicia na etapa `PassoImovel` (tipo do imóvel), seguida do `FormEndereco` quando o cliente não tem imóvel salvo — nenhuma mudança necessária no wizard.
- Sem mudanças de banco, cores ou textos (além de nenhum).

## Validação
- Criar conta nova de cliente → cai em `/contratar` na pergunta "Qual o tipo do imóvel?".
- Escolher tipo → formulário de endereço aparece → salvar → botão Continuar habilita.
- Login de conta existente → continua indo para `/minha-conta`.
- Build OK.
