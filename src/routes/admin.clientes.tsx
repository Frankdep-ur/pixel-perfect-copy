import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";

import { adminBookingsQuery, adminClientesQuery, type AdminCliente } from "@/lib/admin-queries";
import { Painel, TituloSecao, formatarData } from "@/components/admin/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { STATUS_LABEL, formatBRL, labelTipoLimpeza } from "@/lib/catalogo";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientes,
});

function AdminClientes() {
  const { data: clientes } = useQuery(adminClientesQuery);
  const { data: bookings } = useQuery(adminBookingsQuery);
  const [selecionado, setSelecionado] = useState<AdminCliente | null>(null);

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

  const historico = selecionado
    ? bookings.filter((b) => b.cliente_id === selecionado.id)
    : [];

  return (
    <>
      <TituloSecao
        titulo="Clientes"
        texto="Toque em um cliente para ver o endereço completo e o histórico."
      />
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
                <tr
                  key={c.id}
                  onClick={() => setSelecionado(c)}
                  className="cursor-pointer transition-colors hover:bg-muted/60"
                >
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

      <Sheet open={!!selecionado} onOpenChange={(aberto) => !aberto && setSelecionado(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selecionado && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selecionado.nome}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <dl className="space-y-2 rounded-xl bg-surface-tint p-4 text-sm">
                  {[
                    ["E-mail", selecionado.email ?? "—"],
                    ["Telefone", selecionado.telefone ?? "—"],
                  ].map(([label, valor]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="size-4 text-primary" /> Endereço completo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selecionado.endereco ?? "Cliente ainda não cadastrou endereço."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Histórico ({historico.length})</h3>
                  {historico.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma contratação ainda.</p>
                  ) : (
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {historico.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {formatarData(b.data)} {b.hora ? `· ${b.hora.slice(0, 5)}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {labelTipoLimpeza(b.tipo_limpeza)} ·{" "}
                              {STATUS_LABEL[b.status] ?? b.status}
                            </p>
                          </div>
                          <span className="font-medium">{formatBRL(b.valor_total)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
