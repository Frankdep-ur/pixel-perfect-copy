import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { adminBookingsQuery, adminClientesQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { formatBRL } from "@/lib/catalogo";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientes,
});

function AdminClientes() {
  const { data: clientes } = useQuery(adminClientesQuery);
  const { data: bookings } = useQuery(adminBookingsQuery);

  if (!clientes || !bookings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const linhas = clientes
    .map((c) => {
      const meus = bookings.filter((b) => b.cliente_id === c.id && b.status !== "cancelada");
      return {
        ...c,
        total: meus.length,
        gasto: meus.reduce((s, b) => s + b.valor_total, 0),
      };
    })
    .sort((a, b) => b.gasto - a.gasto);

  return (
    <>
      <TituloSecao titulo="Clientes" texto="Quem contrata, onde mora e quanto já gastou." />
      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Cidade</th>
                <th className="px-5 py-3 font-medium">Contratações</th>
                <th className="px-5 py-3 font-medium">Total gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/60">
                  <td className="px-5 py-3 font-medium">{c.nome}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.telefone ?? "—"}</td>
                  <td className="px-5 py-3">{c.cidade ?? "—"}</td>
                  <td className="px-5 py-3">{c.total}</td>
                  <td className="px-5 py-3 font-semibold">{formatBRL(c.gasto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>
    </>
  );
}
