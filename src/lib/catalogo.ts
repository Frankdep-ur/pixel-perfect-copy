import { Building2, Home, Briefcase, Factory, type LucideIcon } from "lucide-react";

export const TIPOS_IMOVEL: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "casa", label: "Casa", icon: Home },
  { id: "apartamento", label: "Apartamento", icon: Building2 },
  { id: "escritorio", label: "Escritório", icon: Briefcase },
  { id: "empresa", label: "Empresa", icon: Factory },
];

/** Escritório e Empresa usam perguntas e níveis de limpeza próprios. */
export function ehComercial(tipoImovel: string | null | undefined) {
  return tipoImovel === "escritorio" || tipoImovel === "empresa";
}

export type PerfilImovel = "residencial" | "escritorio" | "empresa";

export function perfilImovel(tipoImovel: string | null | undefined): PerfilImovel {
  if (tipoImovel === "empresa") return "empresa";
  if (tipoImovel === "escritorio") return "escritorio";
  return "residencial";
}

export const TIPOS_LIMPEZA_COMERCIAL: { id: string; label: string; descricao: string }[] = [
  {
    id: "com_essencial",
    label: "🧹 Limpeza Essencial",
    descricao:
      "Limpeza de manutenção: pisos, poeira, lixeiras, banheiros, copa e superfícies.",
  },
  {
    id: "com_completa",
    label: "✨ Limpeza Completa",
    descricao:
      "Tudo da Essencial + limpeza mais detalhada, portas, áreas de maior circulação e detalhamento de mobiliário.",
  },
  {
    id: "com_intensiva",
    label: "💎 Limpeza Intensiva",
    descricao: "Para ambientes que precisam de uma limpeza mais profunda.",
  },
];

export const FAIXAS_PESSOAS: { id: string; label: string }[] = [
  { id: "ate_5", label: "Até 5" },
  { id: "6_10", label: "6 a 10" },
  { id: "11_20", label: "11 a 20" },
  { id: "21_40", label: "21 a 40" },
  { id: "mais_40", label: "+ de 40" },
];

export const FAIXAS_METRAGEM: { id: string; label: string; grande: boolean }[] = [
  { id: "20_50", label: "20 a 50 m²", grande: false },
  { id: "51_100", label: "51 a 100 m²", grande: false },
  { id: "101_200", label: "101 a 200 m²", grande: false },
  { id: "201_300", label: "201 a 300 m²", grande: true },
  { id: "mais_301", label: "+ de 301 m²", grande: true },
];

/** A escolha de mais de uma profissional só existe para Empresa acima de 200 m². */
export function permiteMultiplasProfissionais(
  tipoImovel: string | null | undefined,
  faixaMetragem: string | null | undefined,
) {
  if (tipoImovel !== "empresa") return false;
  return FAIXAS_METRAGEM.find((f) => f.id === faixaMetragem)?.grande === true;
}

/**
 * Escritório e Empresa usam níveis próprios (com_*), mas as profissionais
 * cadastram habilidades residenciais/comerciais — filtramos por "comercial".
 */
export function tipoLimpezaParaFiltro(id: string | null | undefined) {
  if (!id) return id ?? null;
  return id.startsWith("com_") ? "comercial" : id;
}

export const QTD_PROFISSIONAIS = [1, 2, 3, 4, 5];

export const DURACOES: { horas: 4 | 6 | 8; label: string; nivel: string; descricao: string }[] = [
  { horas: 4, label: "4 horas", nivel: "Básico", descricao: "Imóveis compactos e manutenção" },
  { horas: 6, label: "6 horas", nivel: "Médio", descricao: "Apartamentos e salas comerciais" },
  { horas: 8, label: "8 horas", nivel: "Master", descricao: "Casas e escritórios maiores" },
];


export const TIPOS_LIMPEZA: { id: string; label: string; descricao: string }[] = [
  {
    id: "padrao",
    label: "Padrão",
    descricao: "Manutenção do dia a dia: pisos, banheiros e cozinha",
  },
  {
    id: "completa",
    label: "Completa",
    descricao: "Inclui armários por fora, rodapés e detalhes",
  },
  {
    id: "pesada",
    label: "Pesada",
    descricao: "Imóveis com sujeira acumulada ou muito tempo sem limpeza",
  },
  {
    id: "pos_obra",
    label: "Pós-obra",
    descricao: "Remoção de poeira fina, resíduos de tinta e cimento",
  },
  {
    id: "comercial",
    label: "Comercial",
    descricao: "Lojas, salas e consultórios com rotina de atendimento",
  },
  {
    id: "pos_locacao",
    label: "Pós-locação",
    descricao: "Preparação do imóvel entre hóspedes ou inquilinos",
  },
];

export const AREAS_EXTERNAS: { id: string; label: string }[] = [
  { id: "nao", label: "Não" },
  { id: "pequena", label: "Pequena" },
  { id: "media", label: "Média" },
  { id: "grande", label: "Grande" },
];

export const STATUS_BOOKING = [
  "aguardando_aceite",
  "solicitada",
  "aceita",
  "confirmada",
  "a_caminho",
  "em_andamento",
  "finalizada",
  "concluida",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  aguardando_aceite: "Aguardando aceite",
  sem_profissional: "Buscando profissional",
  solicitada: "Solicitada",
  aceita: "Aceita",
  confirmada: "Confirmada",
  a_caminho: "A caminho",
  em_andamento: "Em andamento",
  finalizada: "Aguardando sua confirmação",
  concluida: "Concluída",
  recusada: "Recusada",
  cancelada: "Cancelada",
};


export function labelTipoLimpeza(id: string | null | undefined) {
  return (
    [...TIPOS_LIMPEZA, ...TIPOS_LIMPEZA_COMERCIAL].find((t) => t.id === id)?.label ?? ""
  );
}

export function labelFaixaPessoas(id: string | null | undefined) {
  return FAIXAS_PESSOAS.find((f) => f.id === id)?.label ?? "";
}

export function labelFaixaMetragem(id: string | null | undefined) {
  return FAIXAS_METRAGEM.find((f) => f.id === id)?.label ?? "";
}

/** Tipos antigos que saíram do funil, mantidos para serviços já contratados. */
const TIPOS_IMOVEL_LEGADO: Record<string, string> = {
  consultorio: "Consultório",
  sala_comercial: "Sala comercial",
  loja: "Loja",
  imovel_vazio: "Imóvel vazio",
  outro: "Outro",
};

export function labelTipoImovel(id: string | null | undefined) {
  return (
    TIPOS_IMOVEL.find((t) => t.id === id)?.label ?? (id ? TIPOS_IMOVEL_LEGADO[id] ?? "" : "")
  );
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
