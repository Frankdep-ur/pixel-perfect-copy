import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  adminBookingsQuery,
  adminClientesQuery,
  adminProfissionaisQuery,
} from "@/lib/admin-queries";
import { CardMetrica, Painel, StatusBadge, TituloSecao, formatarData } from "@/components/admin/ui";
import { formatBRL } from "@/lib/catalogo";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function mesmoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function AdminDashboard() {
  const { data: bookings } = useQuery(adminBookingsQuery);
  const { data: profissionais } = useQuery(adminProfissionaisQuery);
  const { data: clientes } = useQuery(adminClientesQuery);

  if (!bookings || !profissionais || !clientes) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const hoje = new Date();
  const noMes = (valor: string | null) => {
    if (!valor) return false;
    const d = new Date(valor.length <= 10 ? `${valor}T12:00:00` : valor);
    return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
  };

  const concluidasMes = bookings.filter((b) => b.status === "concluida" && noMes(b.data));
  const gmv = concluidasMes.reduce((s, b) => s + b.valor_total, 0);
  const receita = concluidasMes.reduce((s, b) => s + b.taxa_admin, 0);
  const ticket = concluidasMes.length ? gmv / concluidasMes.length : 0;

  const metricas = [
    { label: "Clientes cadastrados", valor: clientes.length },
    {
      label: "Profissionais aprovadas",
      valor: profissionais.filter((p) => p.status === "aprovada").length,
    },
    {
      label: "Profissionais pendentes",
      valor: profissionais.filter((p) => p.status === "pendente").length,
      destaque: profissionais.some((p) => p.status === "pendente"),
      detalhe: "Precisam de aprovação",
    },
    {
      label: "Faxinas hoje",
      valor: bookings.filter(
        (b) => b.data && mesmoDia(new Date(`${b.data}T12:00:00`), hoje) && b.status !== "cancelada",
      ).length,
    },
    { label: "Faxinas este mês", valor: bookings.filter((b) => noMes(b.data)).length },
    {
      label: "Canceladas este mês",
      valor: bookings.filter((b) => b.status === "cancelada" && noMes(b.data)).length,
    },
    { label: "GMV do mês", valor: formatBRL(gmv), detalhe: "Concluídas no mês" },
    { label: "Receita LAR10", valor: formatBRL(receita), detalhe: "Taxa de 15%" },
    { label: "Ticket médio", valor: formatBRL(ticket) },
  ];

  return (
    <>
      <TituloSecao titulo="Dashboard" texto="Visão geral da operação nas duas regiões piloto." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricas.map((m) => (
          <CardMetrica key={m.label} {...m} />
        ))}
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold tracking-tight">Contratações recentes</h2>
      <Painel>
        <ul className="divide-y divide-border">
          {bookings.slice(0, 10).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium leading-snug">{b.codigo ?? "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {formatarData(b.data)} · {b.hora?.slice(0, 5) ?? "—"} ·{" "}
                  {b.regiao === "balneario" ? "Balneário" : "Grande Floripa"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{formatBRL(b.valor_total)}</span>
                <StatusBadge status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      </Painel>
    </>
  );
}
