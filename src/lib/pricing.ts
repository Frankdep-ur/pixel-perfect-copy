import type { PerfilImovel } from "@/lib/catalogo";

export type PricingConfig = Record<string, number>;

export type OrcamentoInput = {
  perfil: PerfilImovel;
  duracao_horas: number;
  /** Residencial */
  quartos: number;
  salas: number;
  banheiros: number;
  cozinhas: number;
  area_externa: string;
  /** Comercial (escritório e empresa) */
  copa: number;
  salas_reuniao: number;
  recepcao: number;
  faixa_pessoas: string | null;
  faixa_metragem: string | null;
  qtd_profissionais: number;

  tipo_limpeza: string;
  extras: { preco: number }[];
};

export type Orcamento = {
  base: number;
  adicionalComodos: number;
  subtotalServico: number;
  valorExtras: number;
  valorProfissional: number;
  /** Percentual administrativo (uso interno/admin). */
  taxaAdminBase: number;
  /** Taxa administrativa exibida ao cliente. */
  taxaAdmin: number;
  valorSeguro: number;
  qtdProfissionais: number;
  total: number;
};

const MULT_POR_TIPO: Record<string, string> = {
  padrao: "mult_limpeza_padrao",
  completa: "mult_limpeza_completa",
  pesada: "mult_limpeza_pesada",
  pos_obra: "mult_pos_obra",
  comercial: "mult_limpeza_comercial",
  pos_locacao: "mult_pos_locacao",
  com_essencial: "mult_com_essencial",
  com_completa: "mult_com_completa",
  com_intensiva: "mult_com_intensiva",
};

function arredondar(v: number) {
  return Math.round(v * 100) / 100;
}

/**
 * Função pura de orçamento. Todos os valores vêm de pricing_config —
 * nenhum preço é fixado no código.
 *
 * O preço da tabela (4h/6h/8h + extras) é o que o CLIENTE paga.
 * A Lar77 fica com 17% desse total; a profissional recebe 83%.
 * Seguro entra na taxa — não aparece como linha extra.
 */
export function calcularOrcamento(
  input: OrcamentoInput,
  config: PricingConfig,
): Orcamento {
  const num = (chave: string, fallback = 0) =>
    typeof config[chave] === "number" ? config[chave] : fallback;

  const taxaPct = num("taxa_admin_percentual", 0.17);

  if (input.perfil === "airbnb") {
    const fixo = num("airbnb_preco_fixo", 150);
    const valorExtrasAirbnb = input.extras.reduce((soma, e) => soma + (e.preco ?? 0), 0);
    const subtotal = fixo + valorExtrasAirbnb;
    const taxa = subtotal * taxaPct;
    return {
      base: arredondar(fixo),
      adicionalComodos: 0,
      subtotalServico: arredondar(fixo),
      valorExtras: arredondar(valorExtrasAirbnb),
      valorProfissional: arredondar(subtotal - taxa),
      taxaAdminBase: arredondar(taxa),
      taxaAdmin: arredondar(taxa),
      valorSeguro: 0,
      qtdProfissionais: 1,
      total: arredondar(subtotal),
    };
  }

  const base = num(`preco_${input.duracao_horas}h`);
  const multiplicador = num(MULT_POR_TIPO[input.tipo_limpeza] ?? "mult_limpeza_padrao", 1);
  const subtotalServico = base * multiplicador;
  const valorExtras = input.extras.reduce((soma, e) => soma + (e.preco ?? 0), 0);
  const subtotal = subtotalServico + valorExtras;
  const taxa = subtotal * taxaPct;

  return {
    base: arredondar(base),
    adicionalComodos: 0,
    subtotalServico: arredondar(subtotalServico),
    valorExtras: arredondar(valorExtras),
    valorProfissional: arredondar(subtotal - taxa),
    taxaAdminBase: arredondar(taxa),
    taxaAdmin: arredondar(taxa),
    valorSeguro: 0,
    qtdProfissionais: 1,
    total: arredondar(subtotal),
  };
}
