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
  distancia_km: number | null;
};

export async function abrirRodada(bookingId: string) {
  const { data, error } = await supabase.rpc("abrir_rodada_convites", {
    _booking_id: bookingId,
  });
  if (error) throw error;
  if ((data ?? 0) > 0) dispararWhatsapp();
  return data ?? 0;
}

/** Quantas profissionais eram elegíveis e quantas já foram convidadas (admin/cliente do pedido). */
export async function diagnosticoOrquestra(bookingId: string) {
  const { data, error } = await supabase.rpc("diagnostico_orquestra", {
    _booking_id: bookingId,
  });
  if (error) throw error;
  const linha = (data ?? [])[0];
  return {
    elegiveis: linha?.elegiveis ?? 0,
    convidadas: linha?.convidadas ?? 0,
  };
}

/** Cadastros de profissionais que compartilham o mesmo telefone (só admin). */
export async function telefonesDuplicados() {
  const { data, error } = await supabase.rpc("profissionais_telefone_duplicado");
  if (error) throw error;
  return data ?? [];
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
    distancia_km: p.distancia_km == null ? null : Number(p.distancia_km),
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
  booking_status: string;
  codigo: string | null;
  tipo_limpeza: string | null;
  tipo_imovel: string | null;
  duracao_horas: number | null;
  data: string | null;
  hora: string | null;
  bairro: string | null;
  cidade: string | null;
  valor_profissional: number;
  escolhida: boolean;
};

/**
 * Convites da profissional logada com o resumo seguro do serviço: durante a
 * fase "buscando" o pedido ainda não é dela, então quem devolve os dados é a
 * função do banco (sem endereço completo nem contato do cliente).
 */
export async function listarConvitesProfissional(): Promise<ConviteProfissional[]> {
  const { data, error } = await supabase.rpc("convites_profissional");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    expira_em: c.expira_em,
    rodada: c.rodada,
    booking_id: c.booking_id,
    booking_status: c.booking_status,
    codigo: c.codigo,
    tipo_limpeza: c.tipo_limpeza,
    tipo_imovel: c.tipo_imovel,
    duracao_horas: c.duracao_horas,
    data: c.data,
    hora: c.hora,
    bairro: c.bairro,
    cidade: c.cidade,
    valor_profissional: Number(c.valor_profissional ?? 0),
    escolhida: !!c.escolhida,
  }));
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
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
