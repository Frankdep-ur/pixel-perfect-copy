import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Quantidade real de mensagens não lidas recebidas pelo usuário.
 * A RLS de `mensagens` já limita aos serviços em que ele participa.
 */
export function useNaoLidas(user: User | null) {
  return useQuery({
    queryKey: ["mensagens-nao-lidas", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("mensagens")
        .select("id", { count: "exact", head: true })
        .is("lida_em", null)
        .neq("autor_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
