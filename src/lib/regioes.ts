export type RegiaoId = "grande_floripa" | "balneario";

export const REGIOES: Record<RegiaoId, { nome: string; cidades: string[] }> = {
  grande_floripa: {
    nome: "Grande Florianópolis",
    cidades: ["Florianópolis", "São José", "Palhoça", "Biguaçu"],
  },
  balneario: {
    nome: "Balneário Camboriú e região",
    cidades: ["Balneário Camboriú", "Camboriú", "Itapema", "Itajaí"],
  },
};

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** Deriva a região operacional a partir da cidade (ViaCEP). */
export function regiaoPorCidade(cidade: string | null | undefined): RegiaoId | null {
  if (!cidade) return null;
  const alvo = normalizar(cidade);
  for (const [id, regiao] of Object.entries(REGIOES) as [
    RegiaoId,
    { nome: string; cidades: string[] },
  ][]) {
    if (regiao.cidades.some((c) => normalizar(c) === alvo)) return id;
  }
  return null;
}

export function nomeRegiao(regiao: string | null | undefined) {
  if (regiao === "grande_floripa" || regiao === "balneario") return REGIOES[regiao].nome;
  return "";
}

/** Distância em km entre dois pontos (Haversine). */
export function distanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Coordenada de referência de cada região, usada quando o endereço não tem geolocalização. */
export const CENTRO_REGIAO: Record<RegiaoId, { lat: number; lng: number }> = {
  grande_floripa: { lat: -27.5954, lng: -48.548 },
  balneario: { lat: -26.9906, lng: -48.6348 },
};
