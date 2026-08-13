import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  adminBookingsQuery,
  adminClientesQuery,
  adminProfissionaisQuery,
  type AdminBooking,
} from "@/lib/admin-queries";
import { Painel, StatusBadge, TituloSecao, formatarData } from "@/components/admin/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { STATUS_LABEL, formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { nomeRegiao } from "@/lib/regioes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/contratacoes")({
  component: AdminContratacoes,
});

const STATUS = ["solicitada", "aceita", "confirmada", "em_andamento", "concluida", "cancelada"];

function AdminContratacoes() {
  const { data: bookings } = useQuery(adminBookingsQuery);
  const { data: profissionais } = useQuery(adminProfissionaisQuery);
  const { data: clientes } = useQuery(adminClientesQuery);
  const [status, setStatus] = useState("todos");
  const [regiao, setRegiao] = useState("todas");
  const [periodo, setPeriodo] = useState("todos");
  const [selecionada, setSelecionada] = useState<AdminBooking | null>(null);

  if (!bookings || !profissionais || !clientes) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "—";
  const nomeProfissional = (id: string | null) =>
    id ? (profissionais.find((p) => p.id === id)?.nome ?? "—") : "A definir";

  const agora = Date.now();
  const lista = bookings.filter((b) => {
    if (status !== "todos" && b.status !== status) return false;
    if (regiao !== "todas" && b.regiao !== regiao) return false;
    if (periodo !== "todos" && b.data) {
      const t = new Date(`${b.data}T12:00:00`).getTime();
      if (periodo === "futuras" && t < agora) return false;
      if (periodo === "30d" && (t > agora || t < agora - 30 * 864e5)) return false;
      if (periodo === "7d" && (t > agora || t < agora - 7 * 864e5)) return false;
    }
    return true;
  });

  const Select = ({
    valor,
    setValor,
    opcoes,
    label,
  }: {
    valor: string;
    setValor: (v: string) => void;
    opcoes: { v: string; l: string }[];
    label: string;
  }) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="min-h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
      >
        {opcoes.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <TituloSecao titulo="Contratações" texto="Todas as faxinas, com a quebra completa de valores." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label="Status"
          valor={status}
          setValor={setStatus}
          opcoes={[
            { v: "todos", l: "Todos" },
            ...STATUS.map((s) => ({ v: s, l: STATUS_LABEL[s] ?? s })),
          ]}
        />
        <Select
          label="Região"
          valor={regiao}
          setValor={setRegiao}
          opcoes={[
            { v: "todas", l: "Todas" },
            { v: "grande_floripa", l: "Grande Florianópolis" },
            { v: "balneario", l: "Balneário Camboriú e região" },
          ]}
        />
        <Select
          label="Período"
          valor={periodo}
          setValor={setPeriodo}
          opcoes={[
            { v: "todos", l: "Todos" },
            { v: "futuras", l: "Futuras" },
            { v: "7d", l: "Últimos 7 dias" },
            { v: "30d", l: "Últimos 30 dias" },
          ]}
        />
      </div>

      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Profissional</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelecionada(b)}
                  className="cursor-pointer transition-colors hover:bg-muted/60"
                >
                  <td className="px-5 py-3 font-medium">{b.codigo ?? "—"}</td>
                  <td className="px-5 py-3">{nomeCliente(b.cliente_id)}</td>
                  <td className="px-5 py-3">{nomeProfissional(b.profissional_id)}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatarData(b.data)} {b.hora?.slice(0, 5) ?? ""}
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatBRL(b.valor_total)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lista.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Nenhuma contratação com esses filtros.
            </p>
          )}
        </div>
      </Painel>

      <Sheet open={!!selecionada} onOpenChange={(aberto) => !aberto && setSelecionada(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selecionada && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selecionada.codigo ?? "Contratação"}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <StatusBadge status={selecionada.status} />

                <dl className="space-y-2 rounded-xl bg-surface-tint p-4 text-sm">
                  {[
                    ["Cliente", nomeCliente(selecionada.cliente_id)],
                    ["Profissional", nomeProfissional(selecionada.profissional_id)],
                    [
                      "Data",
                      `${formatarData(selecionada.data)} ${selecionada.hora?.slice(0, 5) ?? ""}`,
                    ],
                    ["Duração", `${selecionada.duracao_horas}h`],
                    ["Tipo", labelTipoLimpeza(selecionada.tipo_limpeza) || selecionada.tipo_limpeza],
                    ["Região", nomeRegiao(selecionada.regiao) || "—"],
                  ].map(([label, valor]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>

                <dl className="space-y-2 text-sm">
                  {[
                    ["Serviço", selecionada.valor_profissional],
                    ["Extras", selecionada.valor_extras],
                    ["Taxa LAR10", selecionada.taxa_admin],
                    ["Proteção", selecionada.valor_seguro],
                  ].map(([label, valor]) => (
                    <div key={label as string} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{formatBRL(valor as number)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-bold">
                    <dt>Total</dt>
                    <dd>{formatBRL(selecionada.valor_total)}</dd>
                  </div>
                </dl>

                <div className={cn("rounded-xl bg-primary p-4 text-primary-foreground")}>
                  <p className="text-sm opacity-80">A profissional recebe</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {formatBRL(selecionada.valor_profissional + selecionada.valor_extras)}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
