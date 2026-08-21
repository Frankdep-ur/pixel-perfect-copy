# Começar o funil pelo tipo do imóvel

Hoje o funil abre em "Onde será a limpeza?" (escolha do imóvel salvo). A mudança inverte a ordem: a primeira tela passa a ser "Qual o tipo do imóvel?" (Casa, Apartamento, Escritório, Empresa e Airbnb por último), e só depois vem o endereço, já embutido dentro do fluxo daquele tipo escolhido.

## Como fica

Passo 1 — Qual o tipo do imóvel?
- Lista de tipos com Airbnb como última opção (o destaque com valor fixo continua aparecendo ao escolher Airbnb).

Passo 2 — Endereço da limpeza
- Se o cliente ainda não tem imóvel cadastrado (caso de quem acabou de criar a conta), o formulário de cadastro de endereço abre direto, sem tela intermediária.
- Se já tem imóveis salvos, ele escolhe um e pode cadastrar outro.
- Título ajustado para casar com o tipo escolhido (ex.: "Endereço do apartamento", "Endereço do Airbnb").

Os demais passos (tamanho, duração, tipo de limpeza, extras, data/hora, observações) seguem iguais. O fluxo Airbnb continua curto: tipo → endereço → data/hora → observações.

## Detalhes técnicos

- `src/routes/contratar.tsx`: trocar o que é renderizado nos passos 1 e 2 (`PassoImovel` no 1, `PassoEndereco` no 2) e inverter as validações de `podeAvancar` (caso 1 exige `tipo_imovel`; caso 2 exige `endereco_id` + `regiao`). As sequências `PASSOS_PADRAO` e `PASSOS_AIRBNB` e o agrupamento das bolinhas do stepper permanecem os mesmos.
- `src/components/contratar/passos.tsx`: em `PassoEndereco`, título dinâmico conforme `rascunho.tipo_imovel` e abertura automática do formulário quando a lista de endereços está vazia (comportamento já existente, mantido).
- Nenhuma mudança de banco, preço ou regra de negócio.
