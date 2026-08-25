# Verificação do cadastro do cliente no funil

O fluxo já está conforme o descrito: tipo do imóvel (SeletorTipoImovel com Casa, Apartamento, Escritório, Empresa e Airbnb por último) → formulário de endereço → botão Continuar do wizard → duração/serviço → data/hora → Buscar profissionais. Nenhuma mudança estrutural necessária.

## Dois refinamentos pequenos

1. **Mostrar o valor fixo do Airbnb no seletor dentro do funil**
   - Em `src/components/contratar/passos.tsx` (`PassoEndereco`), passar `precoAirbnb` ao `FormEndereco` usando `precos` da `pricingQuery` (chave `airbnb_preco_fixo`), para o cliente ver o valor fixo antes de escolher Airbnb.

2. **Título do passo de endereço conforme o tipo**
   - Em `PassoEndereco`, título dinâmico: "Onde será a limpeza?" permanece para a lista de imóveis salvos; o `FormEndereco` já mostra o rótulo do tipo ("Onde fica?") — manter. Apenas ajustar o subtítulo da lista para mencionar o tipo quando houver `rascunho.tipo_imovel`.

## Detalhes técnicos

- `PassoEndereco` precisa receber `precos` (ou só o preço Airbnb) de `contratar.tsx`.
- Sem mudança de banco, preços ou regras de negócio.
