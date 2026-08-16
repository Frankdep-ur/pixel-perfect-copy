import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/pricing";

export const Route = createFileRoute("/admin/cancelamentos")({
  component: AdminCancelamentos,
});

type Cancelamento = {
  id: string;
  motivo: string;
  papel: string;
  valor_total: number;
  criado_em: string;
  profiles: { nome: string | null; telefone: string | null } | null;
  bookings: {
    codigo: string | null;
    data: string | null;
    hora: string | null;
    status: string;
  } | null;
};

function AdminCancelamentos() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "cancelamentos"],
    queryFn: async (): Promise<Cancelamento[]> => {
      const { data, error } = await supabase
        .from("cancelamentos")
        .select(
          "id, motivo, papel, valor_total, criado_em, profiles!cancelamentos_autor_id_fkey(nome, telefone), bookings(codigo, data, hora, status)",
        )
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as unknown as Cancelamento[];
    },
  });

  const lista = data ?? [];

  return (
    <div className="space-y-6">
      <TituloSecao
        titulo="Cancelamentos"
        descricao="Todos os serviços cancelados, com autor e motivo informado."
      />

      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && lista.length === 0 && (
        <Painel>
          <p className="text-sm text-muted-foreground">Nenhum cancelamento registrado.</p>
        </Painel>
      )}

      <div className="space-y-3">
        {lista.map((c) => (
          <Painel key={c.id}>
            <div className="flex flex-wrap items-center gap-2">
              <XCircle className="size-4 text-destructive" aria-hidden />
              <span className="font-medium">{c.bookings?.codigo ?? "Serviço"}</span>
              <Badge variant="secondary">
                {c.papel === "cliente" ? "Cancelado pelo cliente" : "Cancelado pela profissional"}
              </Badge>
              <span className="ml-auto text-sm font-semibold">
                {formatBRL(Number(c.valor_total))}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {c.profiles?.nome ?? "—"}
              {c.profiles?.telefone ? ` · ${c.profiles.telefone}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Serviço marcado para{" "}
              {c.bookings?.data
                ? new Date(`${c.bookings.data}T12:00:00`).toLocaleDateString("pt-BR")
                : "—"}
              {c.bookings?.hora ? ` às ${c.bookings.hora.slice(0, 5)}` : ""} · cancelado em{" "}
              {new Date(c.criado_em).toLocaleString("pt-BR")}
            </p>
            <p className="mt-3 rounded-xl bg-surface-tint p-3 text-sm text-foreground">
              {c.motivo}
            </p>
          </Painel>
        ))}
      </div>
    </div>
  );
}
