/** Favoritos do cliente — salvos no aparelho (sem tabela no banco por enquanto). */

const chave = (userId: string) => `lar77_favoritos_${userId}`;

export function listarFavoritos(userId: string | undefined): string[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const bruto = localStorage.getItem(chave(userId));
    if (!bruto) return [];
    const parsed = JSON.parse(bruto) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function salvarFavoritos(userId: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(chave(userId), JSON.stringify([...new Set(ids)]));
}

export function ehFavorito(userId: string | undefined, profissionalId: string | undefined): boolean {
  if (!userId || !profissionalId) return false;
  return listarFavoritos(userId).includes(profissionalId);
}

export function alternarFavorito(userId: string, profissionalId: string): boolean {
  const atual = listarFavoritos(userId);
  const ja = atual.includes(profissionalId);
  const proximo = ja ? atual.filter((id) => id !== profissionalId) : [...atual, profissionalId];
  salvarFavoritos(userId, proximo);
  return !ja;
}
