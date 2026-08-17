# Funil por tipo de imóvel (Casa, Apartamento, Escritório, Empresa)

## 1. Taxa administrativa

- A "Proteção da contratação" está hoje em R$ 5 e é somada à taxa administrativa. Ela vai a zero.
- A taxa administrativa passa a ser apenas o percentual configurado pela empresa, começando em 15% sobre o valor do serviço (esse valor já está cadastrado).
- Resultado: total = serviço + extras + 15%. O texto do resumo/checkout deixa de mencionar seguro embutido.

## 2. Tipos de imóvel

O passo de tipo de imóvel passa a ter exatamente quatro opções: **Casa, Apartamento, Escritório, Empresa**. Consultório, sala comercial, loja, imóvel vazio e "outro" saem do funil.

### Casa e Apartamento
Mesmas perguntas de hoje, com uma mudança: "Tem cozinha (sim/não)" vira contador de **Cozinhas**, igual a quartos/salas/banheiros. Área externa e "outros ambientes" continuam.

### Escritório
Perguntas totalmente diferentes (nada de quartos/área externa):
- Contadores: Salas, Banheiros, Copa, Sala de reunião, Recepção
- Quantidade de pessoas que trabalham no local: até 5 · 6 a 10 · 11 a 20 · 21 a 40 · mais de 40

### Empresa
Mesmas perguntas do Escritório, mais:
- Metragem: 20 a 50 m² · 51 a 100 m² · 101 a 200 m² · 201 a 300 m² · mais de 301 m²
- Quantas profissionais deseja contratar (1 a 5) — aparece **somente** para Empresa e **somente** quando a metragem for acima de 200 m².
- O valor total é multiplicado pela quantidade de profissionais escolhida. Essa multiplicação nunca se aplica a casa, apartamento ou escritório.

## 3. Níveis de serviço

- Casa e Apartamento: continuam com os tipos atuais de limpeza.
- Escritório e Empresa: três níveis próprios — **🧹 Limpeza Essencial**, **✨ Limpeza Completa**, **💎 Limpeza Intensiva**.
- Em todos os cartões de escolha (residencial e comercial) a descrição deixa de aparecer no cartão. No lugar entra o ícone ⓘ ao lado do nome; ao tocar/passar o mouse abre a descrição completa (Essencial: pisos, poeira, lixeiras, banheiros, copa, superfícies; Completa: tudo da Essencial + limpeza detalhada, portas, áreas de maior circulação, detalhamento de mobiliário; Intensiva: limpeza mais profunda).
- A duração continua sendo escolhida pelo cliente (4h / 6h / 8h) em todos os tipos.

## 4. Cálculo do preço

- Casa/Apartamento: como hoje (base por hora + adicionais de quarto/banheiro/área externa + multiplicador do tipo de limpeza), agora também com adicional por cozinha e por sala quando configurado.
- Escritório: base por hora + adicionais por sala, banheiro, copa, sala de reunião, recepção + adicional da faixa de pessoas, multiplicado pelo nível de limpeza.
- Empresa: mesma conta do escritório + adicional da faixa de metragem, e o total multiplicado pelo número de profissionais.
- Todos esses valores vêm do painel administrativo — nenhum preço fixo no código.

## 5. Painel administrativo — Preços em abas

A tela de Preços passa a ter abas:
- **Geral**: preço base 4h/6h/8h, taxa administrativa (%), proteção.
- **Casa e Apartamento**: adicionais de quarto, sala, banheiro, cozinha, área externa (pequena/média/grande) e multiplicadores dos tipos de limpeza residenciais.
- **Escritório**: adicionais de sala, banheiro, copa, sala de reunião, recepção, valores por faixa de pessoas e multiplicadores Essencial/Completa/Intensiva.
- **Empresa**: os mesmos adicionais comerciais + valores por faixa de metragem.

Cada campo com rótulo em português; salvar continua atualizando o funil na hora.

## Detalhes técnicos

- Migração no banco: novas colunas em `bookings` (`cozinhas`, `copa`, `salas_reuniao`, `recepcao`, `faixa_pessoas`, `faixa_metragem`, `qtd_profissionais`), mantendo `cozinha` por compatibilidade; novas chaves em `pricing_config` para adicionais comerciais, faixas e multiplicadores comerciais; `valor_seguro` zerado.
- `src/lib/catalogo.ts`: tipos de imóvel reduzidos a 4, novos catálogos `TIPOS_LIMPEZA_COMERCIAL`, `FAIXAS_PESSOAS`, `FAIXAS_METRAGEM`, `QTD_PROFISSIONAIS` e helper para saber se o tipo é comercial.
- `src/lib/contratacao.ts`: rascunho ganha os novos campos; trocar tipo de imóvel entre residencial/comercial reseta os campos e o tipo de limpeza incompatíveis.
- `src/lib/pricing.ts`: `calcularOrcamento` recebe o perfil (residencial/escritório/empresa) e a quantidade de profissionais; seguro sai da taxa exibida; multiplicação final por profissionais.
- `src/components/contratar/passos.tsx`: `PassoTamanho` divide em `TamanhoResidencial` e `TamanhoComercial`; `PassoTipoLimpeza` escolhe o catálogo pelo tipo; novo componente `InfoDescricao` (ⓘ com popover) usado em duração, tipo de limpeza e faixas.
- `src/components/contratar/resumo.tsx` e `checkout.tsx`: exibem cômodos/faixas conforme o tipo, quantidade de profissionais e gravam as novas colunas.
- `src/routes/admin.precos.tsx`: agrupa as chaves em abas (Tabs do shadcn) com rótulos por grupo.
