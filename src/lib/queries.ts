import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Select completo da reserva para a página de detalhes (HomeCliente). */
export const SELECT_RESERVA = `
  id,
  status,
  data,
  hora,
  duracao_horas,
  codigo,
  tipo_limpeza,
  tipo_imovel,
  observacoes,
  valor_profissional,
  taxa_admin,
  valor_extras,
  valor_seguro,
  valor_total,
  aceito_em,
  checkin_em,
  iniciado_em,
  finalizado_em,
  cliente_id,
  profissional_id,
  enderecos (
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    cep,
    latitude,
    longitude
  ),
  profissionais!profissional_id (
    id,
    user_id,
    cidade,
    latitude,
    longitude,
    nota_media,
    total_servicos,
    total_avaliacoes,
    anos_experiencia,
    bio,
    verificada,
    profiles (
      nome,
      foto_url
    )
  ),
  booking_extras (
    preco_congelado,
    extras (
      nome
    )
  )
`;

export function reservaQuery(id: string) {
  return queryOptions({
    queryKey: ["reserva", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(SELECT_RESERVA)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export const STATUS_RESERVA_ATIVA: string[] = [
  "buscando",
  "solicitada",
  "aguardando_aceite",
  "aceita",
  "confirmada",
  "a_caminho",
  "em_andamento",
  "finalizada",
];

export function reservasClienteQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["minhas-reservas", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id, status, data, hora, duracao_horas, codigo, tipo_limpeza, tipo_imovel,
          valor_total, profissional_id,
          profissionais!profissional_id (
            id,
            profiles ( nome, foto_url )
          )
        `,
        )
        .eq("cliente_id", userId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function proximaReservaQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["proxima-reserva", userId],
    enabled: !!userId,
    queryFn: async () => {
      const hoje = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("bookings")
        .select(SELECT_RESERVA)
        .eq("cliente_id", userId!)
        .in("status", [...STATUS_RESERVA_ATIVA])
        .gte("data", hoje)
        .order("data", { ascending: true })
        .order("hora", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export const extrasQuery = queryOptions({
  queryKey: ["extras"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("extras")
      .select("id, nome, preco, descricao, ativo")
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const pricingQuery = queryOptions({
  queryKey: ["pricing-config"],
  queryFn: async () => {
    const { data, error } = await supabase.from("pricing_config").select("*").maybeSingle();
    if (error) throw error;
    // pricing_config is a single-row key/value table of numbers
    const row = (data ?? {}) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "number") out[k] = v;
      else if (v != null && !Number.isNaN(Number(v))) out[k] = Number(v);
    }
    return out;
  },
  staleTime: 60_000,
});
