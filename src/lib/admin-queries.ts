import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type AdminProfissional = {
  id: string;
  user_id: string;
  bio: string | null;
  anos_experiencia: number;
  status: string;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
  raio_km: number;
  cidade: string | null;
  regiao: string | null;
  cidades_atendidas: string[];
  tipos_limpeza: string[];
  verificada: boolean;
  disponivel: boolean;
  criado_em: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  telefone_recado: string | null;
  doc_identidade_url: string | null;
  doc_cpf_url: string | null;
  comprovante_url: string | null;
  foto_url: string | null;
};


export const adminProfissionaisQuery = queryOptions({
  queryKey: ["admin", "profissionais"],
  queryFn: async (): Promise<AdminProfissional[]> => {
    const { data, error } = await supabase
      .from("profissionais")
      .select("*, profiles!profissionais_user_id_fkey(nome, email, telefone, foto_url)")
      .order("criado_em", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p) => {
      const perfil = (
        p as {
          profiles: {
            nome: string | null;
            email: string | null;
            telefone: string | null;
            foto_url: string | null;
          } | null;
        }
      ).profiles;
      return {
        id: p.id,
        user_id: p.user_id,
        bio: p.bio,
        anos_experiencia: p.anos_experiencia,
        status: p.status,
        nota_media: Number(p.nota_media),
        total_avaliacoes: p.total_avaliacoes,
        total_servicos: p.total_servicos,
        raio_km: p.raio_km,
        cidade: p.cidade,
        regiao: p.regiao,
        cidades_atendidas: p.cidades_atendidas ?? [],
        tipos_limpeza: p.tipos_limpeza ?? [],
        verificada: p.verificada,
        disponivel: p.disponivel,
        criado_em: p.criado_em,
        nome: perfil?.nome ?? "Sem nome",
        email: perfil?.email ?? null,
        telefone: perfil?.telefone ?? null,
        foto_url: perfil?.foto_url ?? null,
      };
    });
  },
});

export type AdminBooking = {
  id: string;
  codigo: string | null;
  cliente_id: string;
  profissional_id: string | null;
  status: string;
  regiao: string | null;
  data: string | null;
  hora: string | null;
  duracao_horas: number;
  tipo_limpeza: string;
  valor_profissional: number;
  valor_extras: number;
  taxa_admin: number;
  valor_seguro: number;
  valor_total: number;
  criado_em: string;
};

export const adminBookingsQuery = queryOptions({
  queryKey: ["admin", "bookings"],
  queryFn: async (): Promise<AdminBooking[]> => {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, codigo, cliente_id, profissional_id, status, regiao, data, hora, duracao_horas, tipo_limpeza, valor_profissional, valor_extras, taxa_admin, valor_seguro, valor_total, criado_em",
      )
      .order("criado_em", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((b) => ({
      ...b,
      valor_profissional: Number(b.valor_profissional),
      valor_extras: Number(b.valor_extras),
      taxa_admin: Number(b.taxa_admin),
      valor_seguro: Number(b.valor_seguro),
      valor_total: Number(b.valor_total),
    }));
  },
});

export type AdminCliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
};

export const adminClientesQuery = queryOptions({
  queryKey: ["admin", "clientes"],
  queryFn: async (): Promise<AdminCliente[]> => {
    const { data: papeis, error: erroPapeis } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "cliente");
    if (erroPapeis) throw erroPapeis;
    const ids = (papeis ?? []).map((p) => p.user_id);
    if (ids.length === 0) return [];

    const [{ data: perfis, error: erroPerfis }, { data: enderecos, error: erroEnd }] =
      await Promise.all([
        supabase.from("profiles").select("id, nome, email, telefone").in("id", ids),
        supabase.from("enderecos").select("user_id, cidade").in("user_id", ids),
      ]);
    if (erroPerfis) throw erroPerfis;
    if (erroEnd) throw erroEnd;

    const cidadePorUsuario = new Map<string, string | null>();
    for (const e of enderecos ?? []) {
      if (!cidadePorUsuario.has(e.user_id)) cidadePorUsuario.set(e.user_id, e.cidade);
    }

    return (perfis ?? []).map((p) => ({
      id: p.id,
      nome: p.nome ?? "Sem nome",
      email: p.email,
      telefone: p.telefone,
      cidade: cidadePorUsuario.get(p.id) ?? null,
    }));
  },
});

export const adminExtrasQuery = queryOptions({
  queryKey: ["admin", "extras"],
  queryFn: async () => {
    const { data, error } = await supabase.from("extras").select("*").order("nome");
    if (error) throw error;
    return (data ?? []).map((e) => ({ ...e, preco: Number(e.preco) }));
  },
});

export const adminPrecosQuery = queryOptions({
  queryKey: ["admin", "pricing_config"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("pricing_config")
      .select("chave, valor, descricao")
      .order("chave");
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, valor: Number(r.valor) }));
  },
});

export const adminListaEsperaQuery = queryOptions({
  queryKey: ["admin", "lista_espera"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("lista_espera")
      .select("id, email, cidade, criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export type AdminAvaliacao = {
  id: string;
  nota: number;
  pontualidade: number | null;
  qualidade: number | null;
  cordialidade: number | null;
  comentario: string | null;
  criado_em: string;
  cliente: string;
  profissional: string;
};

export const adminAvaliacoesQuery = queryOptions({
  queryKey: ["admin", "avaliacoes"],
  queryFn: async (): Promise<AdminAvaliacao[]> => {
    const { data, error } = await supabase
      .from("avaliacoes")
      .select(
        "id, nota, pontualidade, qualidade, cordialidade, comentario, criado_em, avaliador:profiles!avaliacoes_avaliador_id_fkey(nome), avaliado:profiles!avaliacoes_avaliado_id_fkey(nome)",
      )
      .order("criado_em", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((a) => {
      const linha = a as unknown as {
        avaliador: { nome: string | null } | null;
        avaliado: { nome: string | null } | null;
      };
      return {
        id: a.id,
        nota: a.nota,
        pontualidade: a.pontualidade,
        qualidade: a.qualidade,
        cordialidade: a.cordialidade,
        comentario: a.comentario,
        criado_em: a.criado_em,
        cliente: linha.avaliador?.nome ?? "Cliente",
        profissional: linha.avaliado?.nome ?? "Profissional",
      };
    });
  },
});
