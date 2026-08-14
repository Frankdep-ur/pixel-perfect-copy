export type Duracao = 4 | 6 | 8;

export const NIVEIS_DURACAO: Record<Duracao, { nome: string; descricao: string }> = {
  4: { nome: "Básico", descricao: "Imóveis compactos e manutenção do dia a dia" },
  6: { nome: "Médio", descricao: "Apartamentos e salas comerciais" },
  8: { nome: "Master", descricao: "Casas e escritórios maiores" },
};

/** Regra de negócio: 4h pode começar 07:00, 08:00 ou 13:00. 6h e 8h só 07:00 ou 08:00. */
export const HORARIOS_POR_DURACAO: Record<Duracao, string[]> = {
  4: ["07:00", "08:00", "13:00"],
  6: ["07:00", "08:00"],
  8: ["07:00", "08:00"],
};

export function horariosPermitidos(duracao: Duracao | null): string[] {
  if (!duracao) return [];
  return HORARIOS_POR_DURACAO[duracao];
}

export function horarioValido(duracao: Duracao | null, hora: string | null): boolean {
  if (!duracao || !hora) return false;
  return horariosPermitidos(duracao).includes(hora.slice(0, 5));
}

/** Domingo é bloqueado em todo o sistema. */
export function ehDomingo(dataISO: string | null | undefined): boolean {
  if (!dataISO) return false;
  return new Date(`${dataISO}T12:00:00`).getDay() === 0;
}

export function paraISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Primeira data agendável: 24h de antecedência e nunca domingo. */
export function dataMinimaAgendamento(): string {
  const alvo = new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (alvo.getDay() === 0) alvo.setDate(alvo.getDate() + 1);
  return paraISO(alvo);
}

export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) return "A combinar";
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatarDataLonga(dataISO: string | null | undefined): string {
  if (!dataISO) return "A combinar";
  return new Date(`${dataISO}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

/** Dias do mês para o calendário da profissional (segunda a sábado; domingo desabilitado). */
export function diasDoMes(ano: number, mes: number) {
  const primeiro = new Date(ano, mes, 1);
  const total = new Date(ano, mes + 1, 0).getDate();
  const vazios = primeiro.getDay();
  const dias: { iso: string; dia: number; domingo: boolean; passado: boolean }[] = [];
  const hojeISO = paraISO(new Date());

  for (let d = 1; d <= total; d++) {
    const data = new Date(ano, mes, d);
    const iso = paraISO(data);
    dias.push({ iso, dia: d, domingo: data.getDay() === 0, passado: iso < hojeISO });
  }
  return { vazios, dias };
}

export const NOMES_MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
