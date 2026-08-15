import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { RegiaoId } from "@/lib/regioes";

export type Endereco = {
  id: string;
  apelido: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  regiao: string | null;
  padrao: boolean;
};

export function enderecosQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["enderecos", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Endereco[]> => {
      const { data, error } = await supabase
        .from("enderecos")
        .select("id, apelido, cep, rua, numero, complemento, bairro, cidade, estado, regiao, padrao")
        .eq("user_id", userId!)
        .order("padrao", { ascending: false })
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data as Endereco[];
    },
  });
}

export function resumoEndereco(e: Endereco) {
  const linha = [e.rua, e.numero].filter(Boolean).join(", ");
  const cidade = [e.bairro, e.cidade].filter(Boolean).join(" · ");
  return [linha, cidade].filter(Boolean).join(" — ");
}

export function regiaoDoEndereco(e: Endereco | undefined | null): RegiaoId | null {
  if (!e?.regiao) return null;
  return e.regiao as RegiaoId;
}
