import type { RegiaoId } from "@/lib/regioes";

export type EnderecoRascunho = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  regiao: RegiaoId | null;
  latitude: number | null;
  longitude: number | null;
};

export type Rascunho = {
  /** Imóvel salvo na conta do cliente escolhido para esta limpeza. */
  endereco_id: string | null;
  endereco: EnderecoRascunho;

  tipo_imovel: string | null;
  quartos: number;
  salas: number;
  banheiros: number;
  cozinha: boolean;
  area_externa: string;
  outros_ambientes: string;
  duracao_horas: 4 | 6 | 8 | null;
  tipo_limpeza: string | null;
  extras_ids: string[];
  data: string | null;
  hora: string | null;
  observacoes: string;
  profissional_id: string | null;
  /** "Deixe que a LAR10 escolha": sorteio entre as profissionais disponíveis. */
  escolha_automatica: boolean;

};

export const RASCUNHO_INICIAL: Rascunho = {
  endereco_id: null,
  endereco: {

    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    regiao: null,
    latitude: null,
    longitude: null,
  },
  tipo_imovel: null,
  quartos: 2,
  salas: 1,
  banheiros: 1,
  cozinha: true,
  area_externa: "nao",
  outros_ambientes: "",
  duracao_horas: null,
  tipo_limpeza: null,
  extras_ids: [],
  data: null,
  hora: null,
  observacoes: "",
  profissional_id: null,
  escolha_automatica: false,
};


const CHAVE = "lar10:rascunho";

export function carregarRascunho(): Rascunho {
  if (typeof window === "undefined") return RASCUNHO_INICIAL;
  try {
    const bruto = window.sessionStorage.getItem(CHAVE);
    if (!bruto) return RASCUNHO_INICIAL;
    return { ...RASCUNHO_INICIAL, ...(JSON.parse(bruto) as Partial<Rascunho>) };
  } catch {
    return RASCUNHO_INICIAL;
  }
}

export function salvarRascunho(rascunho: Rascunho) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CHAVE, JSON.stringify(rascunho));
}

export function limparRascunho() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHAVE);
}

export async function buscarCep(cep: string) {
  const limpo = cep.replace(/\D/g, "");
  const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  if (!resposta.ok) throw new Error("Não foi possível consultar o CEP.");
  const dados = (await resposta.json()) as {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (dados.erro) throw new Error("CEP não encontrado.");
  return dados;
}

export function mascaraCep(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
