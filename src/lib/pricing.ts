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

const AREA_POR_TAMANHO: Record<string, string> = {
  pequena: "area_externa_pequena",
  media: "area_externa_media",
  grande: "area_externa_grande",
};

const PESSOAS_POR_FAIXA: Record<string, string> = {
  ate_5: "pessoas_ate_5",
  "6_10": "pessoas_6_10",
  "11_20": "pessoas_11_20",
  "21_40": "pessoas_21_40",
  mais_40: "pessoas_mais_40",
};

const METRAGEM_POR_FAIXA: Record<string, string> = {
  "20_50": "metragem_20_50",
  "51_100": "metragem_51_100",
  "101_200": "metragem_101_200",
  "201_300": "metragem_201_300",
  mais_301: "metragem_mais_301",
};

function arredondar(v: number) {
  return Math.round(v * 100) / 100;
}

/**
 * Função pura de orçamento. Todos os valores vêm de pricing_config —
 * nenhum preço é fixado no código.
 * Regra crítica: a taxa administrativa é SOMADA ao valor da profissional,
 * nunca descontada dela. Empresas com mais de uma profissional multiplicam o total.
 */
export function calcularOrcamento(
  input: OrcamentoInput,
  config: PricingConfig,
): Orcamento {
  const num = (chave: string, fallback = 0) =>
    typeof config[chave] === "number" ? config[chave] : fallback;

  // Airbnb — Limpeza de Checkout: preço fixo definido pelo admin, sem adicionais.
  if (input.perfil === "airbnb") {
    const fixo = num("airbnb_preco_fixo", 150);
    const valorExtrasAirbnb = input.extras.reduce((soma, e) => soma + (e.preco ?? 0), 0);
    const valorProfissionalAirbnb = fixo + valorExtrasAirbnb;
    const taxaBaseAirbnb = valorProfissionalAirbnb * num("taxa_admin_percentual");
    const seguroAirbnb = num("valor_seguro");
    return {
      base: arredondar(fixo),
      adicionalComodos: 0,
      subtotalServico: arredondar(fixo),
      valorExtras: arredondar(valorExtrasAirbnb),
      valorProfissional: arredondar(valorProfissionalAirbnb),
      taxaAdminBase: arredondar(taxaBaseAirbnb),
      taxaAdmin: arredondar(taxaBaseAirbnb + seguroAirbnb),
      valorSeguro: arredondar(seguroAirbnb),
      qtdProfissionais: 1,
      total: arredondar(valorProfissionalAirbnb + taxaBaseAirbnb + seguroAirbnb),
    };
  }

  const base = num(`preco_${input.duracao_horas}h`);

  let adicionalComodos = 0;
  if (input.perfil === "residencial") {
    adicionalComodos += Math.max(0, input.quartos - 2) * num("adicional_por_quarto_extra");
    adicionalComodos += Math.max(0, input.banheiros - 1) * num("adicional_por_banheiro_extra");
    adicionalComodos += Math.max(0, input.salas - 1) * num("adicional_por_sala_extra");
    adicionalComodos += Math.max(0, input.cozinhas) * num("adicional_por_cozinha");
    const chaveArea = AREA_POR_TAMANHO[input.area_externa];
    adicionalComodos += chaveArea ? num(chaveArea) : 0;
  } else {
    adicionalComodos += Math.max(0, input.salas) * num("com_adicional_sala");
    adicionalComodos += Math.max(0, input.banheiros) * num("com_adicional_banheiro");
    adicionalComodos += Math.max(0, input.copa) * num("com_adicional_copa");
    adicionalComodos += Math.max(0, input.salas_reuniao) * num("com_adicional_sala_reuniao");
    adicionalComodos += Math.max(0, input.recepcao) * num("com_adicional_recepcao");
    const chavePessoas = input.faixa_pessoas
      ? PESSOAS_POR_FAIXA[input.faixa_pessoas]
      : undefined;
    adicionalComodos += chavePessoas ? num(chavePessoas) : 0;
    if (input.perfil === "empresa") {
      const chaveMetragem = input.faixa_metragem
        ? METRAGEM_POR_FAIXA[input.faixa_metragem]
        : undefined;
      adicionalComodos += chaveMetragem ? num(chaveMetragem) : 0;
    }
  }

  const multiplicador = num(MULT_POR_TIPO[input.tipo_limpeza] ?? "mult_limpeza_padrao", 1);
  const qtdProfissionais =
    input.perfil === "empresa" ? Math.max(1, input.qtd_profissionais || 1) : 1;

  const subtotalServico = (base + adicionalComodos) * multiplicador * qtdProfissionais;

  const valorExtras = input.extras.reduce((soma, e) => soma + (e.preco ?? 0), 0);
  const valorProfissional = subtotalServico + valorExtras;
  const taxaAdminBase = valorProfissional * num("taxa_admin_percentual");
  const valorSeguro = num("valor_seguro");
  const taxaAdmin = taxaAdminBase + valorSeguro;
  const total = valorProfissional + taxaAdmin;

  return {
    base: arredondar(base),
    adicionalComodos: arredondar(adicionalComodos),
    subtotalServico: arredondar(subtotalServico),
    valorExtras: arredondar(valorExtras),
    valorProfissional: arredondar(valorProfissional),
    taxaAdminBase: arredondar(taxaAdminBase),
    taxaAdmin: arredondar(taxaAdmin),
    valorSeguro: arredondar(valorSeguro),
    qtdProfissionais,
    total: arredondar(total),
  };
}
