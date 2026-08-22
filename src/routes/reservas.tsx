import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, ChevronRight, Clock, Loader2, MapPin } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EstadoVazio } from "@/components/estado-vazio";
import { useSession } from "@/hooks/use-auth";
import { reservasClienteQuery, STATUS_RESERVA_ATIVA } from "@/lib/queries";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { formatarData } from "@/lib/agenda";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "Minhas reservas — Lar77" },
      {
        name: "description",
        content: "Acompanhe suas faxinas contratadas na Lar77: em andamento, concluídas e canceladas.",
      },
      { property: "og:title", content: "Minhas reservas — Lar77" },
      { property: "og:description", content: "Histórico das suas faxinas na Lar77." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reservas,
});

const ROTULO: Record<string, string> = {
  buscando: "Buscando profissional",
  aguardando_aceite: "Aguardando aceite",
  sem_profissional: "Sem profissional",
  solicitada: "Solicitada",
  aceita: "Confirmada",
  confirmada: "Confirmada",
  a_caminho: "A caminho",
  em_andamento: "Em andamento",
  finalizada: "Finalizada",
  concluida: "Concluída",
  cancelada: "Cancelada",
  recusada: "Recusada",
};

function corDoStatus(status: string) {
  if (status === "cancelada" || status === "recusada" || status === "sem_profissional") {
    return "border-destructive/40 text-destructive";
  }
  if (status === "finalizada" || status === "concluida") return "border-success/40 text-success";
  if (STATUS_RESERVA_ATIVA.includes(status)) return "border-accent/50 text-accent";
  return "border-border text-muted-foreground";
}

function Reservas() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const { data: reservas, isLoading } = useQuery(reservasClienteQuery(user?.id));

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/entrar", search: { next: "/reservas" }, replace: true });
    }
  }, [carregando, user, navigate]);

  const lista = reservas ?? [];
  const ativas = lista.filter((r) => STATUS_RESERVA_ATIVA.includes(r.status));
  const passadas = lista.filter((r) => !STATUS_RESERVA_ATIVA.includes(r.status));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 md:max-w-2xl">
        <h1 className="font-display text-[22px] font-bold text-foreground">Minhas reservas</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Toque em uma reserva para ver todos os detalhes.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : lista.length === 0 ? (
          <EstadoVazio
            icon={CalendarCheck}
            titulo="Você ainda não tem reservas"
            texto="Agende sua primeira faxina e acompanhe tudo por aqui."
            acaoLabel="Agendar minha faxina"
            acaoTo="/contratar"
          />
        ) : (
          <div className="mt-5 space-y-5">
            {ativas.length > 0 && (
              <Grupo titulo="Em andamento" reservas={ativas} />
            )}
            {passadas.length > 0 && <Grupo titulo="Histórico" reservas={passadas} />}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type Reserva = {
  id: string;
  status: string;
  codigo: string | null;
  data: string | null;
  hora: string | null;
  duracao_horas: number;
  tipo_limpeza: string;
  valor_total: number | string;
  enderecos?: { bairro?: string | null; cidade?: string | null } | null;
};

function Grupo({ titulo, reservas }: { titulo: string; reservas: Reserva[] }) {
  return (
    <section className="space-y-2.5">
      <h2 className="font-display text-[15px] font-semibold text-accent">{titulo}</h2>
      {reservas.map((r) => (
        <Link
          key={r.id}
          to="/reservas/$id"
          params={{ id: r.id }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[18px] border border-accent/20 bg-card p-4 transition-transform duration-200 ease-out active:scale-[0.99]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-display text-[15px] font-semibold text-foreground">
                {labelTipoLimpeza(r.tipo_limpeza) || "Limpeza"} · {r.duracao_horas}h
              </span>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${corDoStatus(
                  r.status,
                )}`}
              >
                {ROTULO[r.status] ?? r.status}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Clock size={13} className="text-accent" aria-hidden />
              {formatarData(r.data)}
              {r.hora ? ` · ${r.hora.slice(0, 5)}` : ""}
            </p>
            {(r.enderecos?.bairro || r.enderecos?.cidade) && (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted-foreground">
                <MapPin size={13} className="text-accent" aria-hidden />
                {[r.enderecos?.bairro, r.enderecos?.cidade].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-1 text-[13px] font-semibold text-accent">
              {formatBRL(Number(r.valor_total ?? 0))}
              {r.codigo && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  #{r.codigo}
                </span>
              )}
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ))}
    </section>
  );
}
