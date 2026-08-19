import { supabase } from "@/integrations/supabase/client";
import { dispararFilaWhatsapp } from "@/lib/notificacoes.functions";

/**
 * Orquestra de contratação: o cliente descreve o serviço, o Lar77 convida as
 * profissionais disponíveis e elas vão aparecendo conforme aceitam.
 */

/**
 * Dispara a fila de WhatsApp sem travar a interface: qualquer falha aqui é
 * apenas registrada, a rede de segurança (cron) reprocessa depois.
 */
export function dispararWhatsapp() {
  void dispararFilaWhatsapp().catch((e) => {
    console.warn("[whatsapp] falha ao disparar fila", e);
  });
}


export type ProfissionalAceite = {
  convite_id: string;
  profissional_id: string;
  nome: string | null;
  foto_url: string | null;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
  anos_experiencia: number | null;
  bio: string | null;
  verificada: boolean;
  respondido_em: string | null;
};

export async function abrirRodada(bookingId: string) {
  const { data, error } = await supabase.rpc("abrir_rodada_convites", {
    _booking_id: bookingId,
  });
  if (error) throw error;
  if ((data ?? 0) > 0) dispararWhatsapp();
  return data ?? 0;
}


export async function listarAceites(bookingId: string): Promise<ProfissionalAceite[]> {
  const { data, error } = await supabase.rpc("convites_aceitos", { _booking_id: bookingId });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    convite_id: p.convite_id,
    profissional_id: p.profissional_id,
    nome: p.nome,
    foto_url: p.foto_url,
    nota_media: Number(p.nota_media ?? 0),
    total_avaliacoes: p.total_avaliacoes ?? 0,
    total_servicos: p.total_servicos ?? 0,
    anos_experiencia: p.anos_experiencia,
    bio: p.bio,
    verificada: !!p.verificada,
    respondido_em: p.respondido_em,
  }));
}

/** Convites ainda aguardando resposta: usado para saber se vale abrir nova rodada. */
export async function contarConvitesAbertos(bookingId: string) {
  const { count, error } = await supabase
    .from("booking_convites")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId)
    .eq("status", "enviado")
    .gt("expira_em", new Date().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function reservarProfissional(bookingId: string, profissionalId: string) {
  const { data, error } = await supabase.rpc("reservar_profissional", {
    _booking_id: bookingId,
    _profissional_id: profissionalId,
  });
  if (error) throw error;
  return data as string;
}

export async function confirmarPagamento(bookingId: string) {
  const { data, error } = await supabase.rpc("confirmar_pagamento_booking", {
    _booking_id: bookingId,
  });
  if (error) throw error;
  dispararWhatsapp();
  return data;
}


export type ConviteProfissional = {
  id: string;
  status: string;
  expira_em: string;
  rodada: number;
  booking_id: string;
  bookings: {
    id: string;
    codigo: string | null;
    status: string;
    data: string | null;
    hora: string | null;
    duracao_horas: number;
    tipo_limpeza: string;
    tipo_imovel: string | null;
    valor_profissional: number;
    profissional_id: string | null;
    enderecos: { bairro: string | null; cidade: string | null } | null;
  } | null;
};

export async function listarConvitesProfissional(profissionalId: string) {
  const { data, error } = await supabase
    .from("booking_convites")
    .select(
      "id, status, expira_em, rodada, booking_id, bookings(id, codigo, status, data, hora, duracao_horas, tipo_limpeza, tipo_imovel, valor_profissional, profissional_id, enderecos(bairro, cidade))",
    )
    .eq("profissional_id", profissionalId)
    .order("criado_em", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as ConviteProfissional[];
}

export async function responderConvite(conviteId: string, aceitar: boolean) {
  const { data, error } = await supabase.rpc("responder_convite", {
    _convite_id: conviteId,
    _aceitar: aceitar,
  });
  if (error) throw error;
  return data as string;
}

export async function responderConviteToken(token: string, aceitar: boolean) {
  const { data, error } = await supabase.rpc("responder_convite_token", {
    _token: token,
    _aceitar: aceitar,
  });
  if (error) throw error;
  return data as string;
}

export async function convitePorToken(token: string) {
  const { data, error } = await supabase.rpc("convite_por_token", { _token: token });
  if (error) throw error;
  return (data ?? [])[0] ?? null;
}

/** Segundos restantes até um instante ISO (nunca negativo). */
export function segundosRestantes(iso: string | null | undefined) {
  if (!iso) return 0;
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
  return diff > 0 ? diff : 0;
}

export function formatarContagem(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
