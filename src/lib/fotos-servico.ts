import { supabase } from "@/integrations/supabase/client";

const BUCKET = "fotos-servico";

export type FotoServico = {
  id: string;
  caminho: string;
  legenda: string | null;
  criado_em: string;
  url: string;
};

/** Reduz a foto no próprio celular antes de subir: envio rápido mesmo em 4G fraco. */
async function comprimir(arquivo: File, maxLado = 1600, qualidade = 0.82): Promise<Blob> {
  if (typeof document === "undefined") return arquivo;
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", qualidade),
    );
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}

export async function enviarFotoServico(bookingId: string, autorId: string, arquivo: File) {
  const blob = await comprimir(arquivo);
  const caminho = `${bookingId}/${crypto.randomUUID()}.jpg`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
  if (erroUpload) throw erroUpload;

  const { error } = await supabase
    .from("booking_fotos")
    .insert({ booking_id: bookingId, autor_id: autorId, caminho });
  if (error) throw error;
}

export async function listarFotosServico(bookingId: string): Promise<FotoServico[]> {
  const { data, error } = await supabase
    .from("booking_fotos")
    .select("id, caminho, legenda, criado_em")
    .eq("booking_id", bookingId)
    .order("criado_em", { ascending: true });
  if (error) throw error;

  const linhas = data ?? [];
  if (linhas.length === 0) return [];

  const { data: assinadas } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(
      linhas.map((l) => l.caminho),
      60 * 60,
    );

  return linhas.map((l, i) => ({
    id: l.id,
    caminho: l.caminho,
    legenda: l.legenda,
    criado_em: l.criado_em,
    url: assinadas?.[i]?.signedUrl ?? "",
  }));
}

export async function removerFotoServico(foto: { id: string; caminho: string }) {
  const { error } = await supabase.from("booking_fotos").delete().eq("id", foto.id);
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove([foto.caminho]);
}

export function fotosServicoQueryKey(bookingId: string) {
  return ["fotos-servico", bookingId] as const;
}
