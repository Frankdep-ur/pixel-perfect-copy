import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { PricingConfig } from "@/lib/pricing";

export const pricingQuery = queryOptions({
  queryKey: ["pricing_config"],
  queryFn: async (): Promise<PricingConfig> => {
    const { data, error } = await supabase.from("pricing_config").select("chave, valor");
    if (error) throw error;
    return Object.fromEntries(data.map((r) => [r.chave, Number(r.valor)]));
  },
});

export const extrasQuery = queryOptions({
  queryKey: ["extras"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("extras")
      .select("*")
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    return data;
  },
});

export type ProfissionalPublica = {
  id: string;
  user_id: string;
  bio: string | null;
  anos_experiencia: number;
  nota_media: number;
  total_avaliacoes: number;
  total_servicos: number;
  raio_km: number;
  cidade: string | null;
  regiao: string | null;
  cidades_atendidas: string[];
  latitude: number | null;
  longitude: number | null;
  tipos_limpeza: string[];
  verificada: boolean;
  disponivel: boolean;
  nome: string;
  foto_url: string | null;
};

/**
 * Somente profissionais realmente disponíveis na data escolhida:
 * a função no banco cruza região, dias bloqueados e compromissos já agendados.
 */
export function disponiveisQuery(
  regiao: string | null,
  data: string | null,
  tipoLimpeza: string | null,
) {
  return queryOptions({
    queryKey: ["profissionais-disponiveis", regiao, data, tipoLimpeza],
    enabled: !!regiao && !!data,
    queryFn: async (): Promise<ProfissionalPublica[]> => {
      const { data: linhas, error } = await supabase.rpc("profissionais_disponiveis", {
        _regiao: regiao!,
        _data: data!,
        ...(tipoLimpeza ? { _tipo_limpeza: tipoLimpeza } : {}),
      });

      if (error) throw error;
      return (linhas ?? []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        bio: p.bio,
        anos_experiencia: p.anos_experiencia,
        nota_media: Number(p.nota_media),
        total_avaliacoes: p.total_avaliacoes,
        total_servicos: p.total_servicos,
        raio_km: p.raio_km,
        cidade: p.cidade,
        regiao: p.regiao,
        cidades_atendidas: [],
        latitude: p.latitude === null ? null : Number(p.latitude),
        longitude: p.longitude === null ? null : Number(p.longitude),
        tipos_limpeza: p.tipos_limpeza ?? [],
        verificada: p.verificada,
        disponivel: true,
        nome: p.nome ?? "Profissional LAR10",
        foto_url: p.foto_url ?? null,
      }));
    },
  });
}

export function profissionaisQuery(regiao: string | null) {

  return queryOptions({
    queryKey: ["profissionais", regiao],
    enabled: !!regiao,
    queryFn: async (): Promise<ProfissionalPublica[]> => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("*, profiles!profissionais_user_id_fkey(nome, foto_url)")
        .eq("status", "aprovada")
        .eq("disponivel", true)
        .eq("regiao", regiao!);
      if (error) throw error;

      return (data ?? []).map((p) => {
        const perfil = (p as { profiles: { nome: string | null; foto_url: string | null } | null })
          .profiles;
        return {
          id: p.id,
          user_id: p.user_id,
          bio: p.bio,
          anos_experiencia: p.anos_experiencia,
          nota_media: Number(p.nota_media),
          total_avaliacoes: p.total_avaliacoes,
          total_servicos: p.total_servicos,
          raio_km: p.raio_km,
          cidade: p.cidade,
          regiao: p.regiao,
          cidades_atendidas: p.cidades_atendidas ?? [],
          latitude: p.latitude === null ? null : Number(p.latitude),
          longitude: p.longitude === null ? null : Number(p.longitude),
          tipos_limpeza: p.tipos_limpeza ?? [],
          verificada: p.verificada,
          disponivel: p.disponivel,
          nome: perfil?.nome ?? "Profissional LAR10",
          foto_url: perfil?.foto_url ?? null,
        };
      });
    },
  });
}
