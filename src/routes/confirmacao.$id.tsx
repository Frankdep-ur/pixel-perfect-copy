import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  Loader2,
  MapPin,
  MessageCircle,
  Sparkles,
  UserRound,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";

export const Route = createFileRoute("/confirmacao/$id")({
  head: () => ({
    meta: [
      { title: "Contratação confirmada — Lar77" },
      {
        name: "description",
        content: "Sua limpeza foi agendada com uma profissional verificada do Lar77.",
      },
      { property: "og:title", content: "Contratação confirmada — Lar77" },
      {
        property: "og:description",
        content: "Sua limpeza foi agendada com uma profissional verificada do Lar77.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmacao,
});

const etapas = [
  { titulo: "Reserva confirmada", texto: "Pagamento aprovado e profissional reservada.", campo: "aceito_em" },
  { titulo: "Profissional a caminho", texto: "Você recebe um aviso quando ela sair.", campo: "checkin_em" },
  { titulo: "Faxina em andamento", texto: "Acompanhe o serviço pelo chat do pedido.", campo: "iniciado_em" },
  { titulo: "Serviço concluído", texto: "Confirme a conclusão e avalie a profissional.", campo: "finalizado_em" },
] as const;

function indiceDoStatus(status: string | null | undefined): number {
  if (!status) return 0;
  if (status === "cancelada") return -2;
  if (status === "aceita" || status === "confirmada") return 1;
  if (status === "a_caminho") return 2;
  if (status === "em_andamento") return 3;
  if (status === "finalizada" || status === "concluida") return 4;
  return 0;
}

function formatarHorarioReal(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/^(\d{2})\/(\d{2})\/\d{4}[, ]+(\d{2}):(\d{2})$/, "$1/$2 $3:$4");
}

function getTimestamp(data: unknown, campo: string): string | null {
  if (!data || typeof data !== "object") return null;
  const value = (data as Record<string, unknown>)[campo];
  if (typeof value === "string") return value;
  return null;
}

function Confirmacao() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(
          "*, enderecos(rua, numero, bairro, cidade), profissionais!bookings_profissional_id_fkey(user_id, profiles!profissionais_user_id_fkey(nome)), cancelamentos(criado_em)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return booking;
    },
  });

  const nomeProfissional = data?.profissionais?.profiles?.nome ?? "Profissional Lar77";
  const endereco = data?.enderecos;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8 lg:max-w-2xl">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !data && (
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Contratação não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Faça login com a conta usada na contratação para visualizar os detalhes.
            </p>
            <Button asChild className="mt-6 min-h-14 w-full rounded-[24px]">
              <Link to="/minha-conta">Ir para minha conta</Link>
            </Button>
          </div>
        )}

        {data && (
          <div className="space-y-5">
            <div>
              <span
                className="inline-block rounded-full px-3 py-1 text-[12px] font-semibold text-success"
                style={{ backgroundColor: "rgba(61,214,140,0.15)" }}
              >
                Confirmado
              </span>
              <h1 className="mt-3 text-3xl leading-tight tracking-tight">
                Sua faxina está confirmada!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Limpeza {labelTipoLimpeza(data.tipo_limpeza)} · {data.duracao_horas} horas
              </p>
            </div>

            {/* Resumo em 4 colunas */}
            <div className="grid grid-cols-2 gap-3 rounded-[24px] border border-border bg-card p-5 sm:grid-cols-4">
              {[
                {
                  icon: CalendarDays,
                  label: "Data",
                  valor: data.data
                    ? new Date(`${data.data}T12:00:00`).toLocaleDateString("pt-BR")
                    : "—",
                },
                {
                  icon: Clock,
                  label: "Horário",
                  valor: data.hora ? data.hora.slice(0, 5) : "—",
                },
                { icon: UserRound, label: "Profissional", valor: nomeProfissional.split(" ")[0] },
                { icon: Hash, label: "Código", valor: data.codigo ?? "—" },
              ].map((item) => (
                <div key={item.label}>
                  <item.icon className="size-4 text-primary" />
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="truncate text-sm font-semibold">{item.valor}</p>
                </div>
              ))}
            </div>

            {/* Profissional */}
            <div className="flex items-center gap-4 rounded-[24px] border border-primary/40 bg-primary/10 p-5">
              <Avatar className="size-14 ring-2 ring-primary/40">
                <AvatarFallback>{nomeProfissional.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{nomeProfissional}</p>
                <p className="text-sm text-muted-foreground">Profissional reservada</p>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to="/minha-conta">
                  <MessageCircle className="mr-1 size-4" /> Chat
                </Link>
              </Button>
            </div>

            {/* Detalhes da faxina */}
            <div className="rounded-[24px] border border-border bg-card p-5">
              <h2 className="font-display text-base font-bold">Detalhes da faxina</h2>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valor do serviço</dt>
                  <dd className="text-foreground">{formatBRL(Number(data.valor_profissional ?? 0))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Taxa administrativa</dt>
                  <dd className="text-foreground">{formatBRL(Number(data.taxa_admin ?? 0))}</dd>
                </div>
                {Number(data.valor_extras ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Extras</dt>
                    <dd className="text-foreground">{formatBRL(Number(data.valor_extras))}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Seguro</dt>
                  <dd className="text-foreground">{formatBRL(Number(data.valor_seguro ?? 0))}</dd>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                  <dt className="text-[15px] font-semibold text-foreground">Total pago</dt>
                  <dd className="font-display text-[20px] font-bold text-accent">
                    {formatBRL(Number(data.valor_total))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Endereço */}
            {endereco && (
              <div className="flex items-start gap-3 rounded-[24px] border border-border bg-card p-5">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {endereco.rua}, {endereco.numero} — {endereco.bairro}, {endereco.cidade}
                  </p>
                  <a
                    className="mt-1 inline-block text-sm font-semibold text-primary"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}`,
                    )}`}
                  >
                    Ver no mapa
                  </a>
                </div>
              </div>
            )}

            {/* Timeline ou cancelamento */}
            {(() => {
              const indiceAtual = indiceDoStatus(data.status);
              if (indiceAtual === -2) {
                const cancelamento = Array.isArray(data.cancelamentos) ? data.cancelamentos[0] : null;
                const horarioCancelamento = formatarHorarioReal(
                  cancelamento && typeof cancelamento === "object" && "criado_em" in cancelamento
                    ? (cancelamento as { criado_em?: string | null }).criado_em
                    : null,
                );
                return (
                  <div className="rounded-[24px] border border-destructive/40 bg-surface p-5">
                    <h2 className="font-display text-base font-bold text-destructive">
                      Contratação cancelada
                    </h2>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      {horarioCancelamento
                        ? `Cancelado em ${horarioCancelamento}`
                        : "Este agendamento foi cancelado."}
                    </p>
                  </div>
                );
              }
              return (
                <div className="rounded-[24px] border border-border bg-card p-5">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold">
                    <Sparkles className="size-4 text-primary" /> O que acontece agora?
                  </h2>
                  <ol className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {etapas.map((etapa, i) => {
                      const jaPassou = i < indiceAtual;
                      const atual = i === indiceAtual;
                      const horarioReal = formatarHorarioReal(getTimestamp(data, etapa.campo));
                      return (
                        <li key={etapa.titulo} className="w-[92px] shrink-0 snap-start">
                          <span
                            className={`flex size-8 items-center justify-center rounded-full text-[13px] font-bold ${
                              jaPassou
                                ? "bg-success text-background"
                                : atual
                                  ? "border-2 border-accent text-accent"
                                  : "border border-border text-muted-foreground"
                            }`}
                          >
                            {jaPassou ? <CheckCircle2 className="size-4" /> : i + 1}
                          </span>
                          <p className="mt-2 text-[13px] font-semibold leading-snug">{etapa.titulo}</p>
                          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                            {horarioReal ?? etapa.texto}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })()}

            <div className="flex flex-col gap-3">
              <Button asChild className="min-h-14 w-full rounded-[24px] text-base font-bold">
                <Link to="/minha-conta">Acompanhar na minha conta</Link>
              </Button>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
