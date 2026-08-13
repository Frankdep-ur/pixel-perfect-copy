import {
  Building2,
  Home,
  Store,
  Briefcase,
  Stethoscope,
  DoorOpen,
  PackageOpen,
  Shapes,
  type LucideIcon,
} from "lucide-react";

export const TIPOS_IMOVEL: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "casa", label: "Casa", icon: Home },
  { id: "apartamento", label: "Apartamento", icon: Building2 },
  { id: "escritorio", label: "Escritório", icon: Briefcase },
  { id: "consultorio", label: "Consultório", icon: Stethoscope },
  { id: "sala_comercial", label: "Sala comercial", icon: DoorOpen },
  { id: "loja", label: "Loja", icon: Store },
  { id: "imovel_vazio", label: "Imóvel vazio", icon: PackageOpen },
  { id: "outro", label: "Outro", icon: Shapes },
];

export const DURACOES: { horas: 4 | 6 | 8; label: string; descricao: string }[] = [
  { horas: 4, label: "4 horas", descricao: "Limpeza básica e imóveis menores" },
  { horas: 6, label: "6 horas", descricao: "Limpeza mais completa" },
  { horas: 8, label: "8 horas", descricao: "Limpeza completa de imóveis maiores" },
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

export const HORARIOS = Array.from({ length: 10 }, (_, i) => {
  const h = 7 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

export const STATUS_BOOKING = [
  "solicitada",
  "aceita",
  "confirmada",
  "a_caminho",
  "em_andamento",
  "finalizada",
  "concluida",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  solicitada: "Solicitada",
  aceita: "Aceita",
  confirmada: "Confirmada",
  a_caminho: "A caminho",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export function labelTipoLimpeza(id: string | null | undefined) {
  return TIPOS_LIMPEZA.find((t) => t.id === id)?.label ?? "";
}

export function labelTipoImovel(id: string | null | undefined) {
  return TIPOS_IMOVEL.find((t) => t.id === id)?.label ?? "";
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
