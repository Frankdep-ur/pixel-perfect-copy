export type PricingConfig = Record<string, number>;

export type OrcamentoInput = {
  duracao_horas: number;
  quartos: number;
  banheiros: number;
  area_externa: string;
  tipo_limpeza: string;
  extras: { preco: number }[];
};

export type Orcamento = {
  base: number;
  adicionalComodos: number;
  subtotalServico: number;
  valorExtras: number;
  valorProfissional: number;
  taxaAdmin: number;
  valorSeguro: number;
  total: number;
};

const MULT_POR_TIPO: Record<string, string> = {
  padrao: "mult_limpeza_padrao",
  completa: "mult_limpeza_completa",
  pesada: "mult_limpeza_pesada",
  pos_obra: "mult_pos_obra",
  comercial: "mult_limpeza_comercial",
  pos_locacao: "mult_pos_locacao",
};

const AREA_POR_TAMANHO: Record<string, string> = {
  pequena: "area_externa_pequena",
  media: "area_externa_media",
  grande: "area_externa_grande",
};

function arredondar(v: number) {
  return Math.round(v * 100) / 100;
}

/**
 * Função pura de orçamento. Todos os valores vêm de pricing_config —
 * nenhum preço é fixado no código.
 * Regra crítica: a taxa administrativa é SOMADA ao valor da profissional,
 * nunca descontada dela.
 */
export function calcularOrcamento(
  input: OrcamentoInput,
  config: PricingConfig,
): Orcamento {
  const num = (chave: string, fallback = 0) =>
    typeof config[chave] === "number" ? config[chave] : fallback;

  const base = num(`preco_${input.duracao_horas}h`);
  const adicionalQuartos = Math.max(0, input.quartos - 2) * num("adicional_por_quarto_extra");
  const adicionalBanheiros =
    Math.max(0, input.banheiros - 1) * num("adicional_por_banheiro_extra");
  const chaveArea = AREA_POR_TAMANHO[input.area_externa];
  const adicionalArea = chaveArea ? num(chaveArea) : 0;
  const adicionalComodos = adicionalQuartos + adicionalBanheiros + adicionalArea;

  const multiplicador = num(MULT_POR_TIPO[input.tipo_limpeza] ?? "mult_limpeza_padrao", 1);
  const subtotalServico = (base + adicionalComodos) * multiplicador;

  const valorExtras = input.extras.reduce((soma, e) => soma + (e.preco ?? 0), 0);
  const valorProfissional = subtotalServico + valorExtras;
  const taxaAdmin = valorProfissional * num("taxa_admin_percentual");
  const valorSeguro = num("valor_seguro");
  const total = valorProfissional + taxaAdmin + valorSeguro;

  return {
    base: arredondar(base),
    adicionalComodos: arredondar(adicionalComodos),
    subtotalServico: arredondar(subtotalServico),
    valorExtras: arredondar(valorExtras),
    valorProfissional: arredondar(valorProfissional),
    taxaAdmin: arredondar(taxaAdmin),
    valorSeguro: arredondar(valorSeguro),
    total: arredondar(total),
  };
}
