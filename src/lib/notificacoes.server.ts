import { enviarTextoZapi, statusInstanciaZapi } from "./zapi.server";

const LIMITE_TENTATIVAS = 3;

export type ResumoDisparo = {
  processadas: number;
  enviadas: number;
  falhas: number;
};

type FilaItem = {
  id: string;
  telefone: string | null;
  mensagem: string;
  tentativas: number | null;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function enviarItem(item: FilaItem): Promise<"enviada" | "falhou"> {
  const db = await admin();
  const tentativas = (item.tentativas ?? 0) + 1;
  const resultado = await enviarTextoZapi(item.telefone, item.mensagem);

  if (resultado.ok) {
    await db
      .from("notificacoes_whatsapp")
      .update({
        status: "enviada",
        enviado_em: new Date().toISOString(),
        tentado_em: new Date().toISOString(),
        tentativas,
        erro: null,
        zapi_message_id: resultado.messageId,
      })
      .eq("id", item.id);
    return "enviada";
  }

  await db
    .from("notificacoes_whatsapp")
    .update({
      status: "falhou",
      tentado_em: new Date().toISOString(),
      tentativas,
      erro: resultado.erro.slice(0, 500),
    })
    .eq("id", item.id);
  return "falhou";
}

/** Drena a fila: manda as pendentes e retenta as falhas até o limite. */
export async function drenarFila(limite = 20): Promise<ResumoDisparo> {
  const db = await admin();
  const { data, error } = await db
    .from("notificacoes_whatsapp")
    .select("id, telefone, mensagem, tentativas, status")
    .in("status", ["pendente", "falhou"])
    .lt("tentativas", LIMITE_TENTATIVAS)
    .order("criado_em", { ascending: true })
    .limit(limite);

  if (error) throw new Error(error.message);

  const itens = (data ?? []) as (FilaItem & { status: string })[];
  let enviadas = 0;
  let falhas = 0;

  for (const item of itens) {
    // Trava otimista: só processa se o status ainda for o que lemos.
    const { data: travado } = await db
      .from("notificacoes_whatsapp")
      .update({ status: "enviando" })
      .eq("id", item.id)
      .eq("status", item.status)
      .select("id")
      .maybeSingle();
    if (!travado) continue;

    const r = await enviarItem(item);
    if (r === "enviada") enviadas += 1;
    else falhas += 1;
  }

  return { processadas: enviadas + falhas, enviadas, falhas };
}

/** Reenvio manual de um item específico da fila (usado pelo admin). */
export async function reenviarItem(id: string): Promise<ResumoDisparo> {
  const db = await admin();
  const { data, error } = await db
    .from("notificacoes_whatsapp")
    .select("id, telefone, mensagem, tentativas")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Mensagem não encontrada na fila.");

  const r = await enviarItem({ ...(data as FilaItem), tentativas: 0 });
  return { processadas: 1, enviadas: r === "enviada" ? 1 : 0, falhas: r === "falhou" ? 1 : 0 };
}

export async function enviarTeste(telefone: string, mensagem: string) {
  const resultado = await enviarTextoZapi(telefone, mensagem);
  return resultado.ok
    ? { ok: true as const, messageId: resultado.messageId }
    : { ok: false as const, erro: resultado.erro };
}

export async function statusInstancia() {
  return statusInstanciaZapi();
}
