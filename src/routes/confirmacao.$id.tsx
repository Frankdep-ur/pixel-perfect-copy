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
  { titulo: "Reserva confirmada", texto: "Pagamento aprovado e profissional reservada." },
  { titulo: "Profissional a caminho", texto: "Você recebe um aviso quando ela sair." },
  { titulo: "Faxina em andamento", texto: "Acompanhe o serviço pelo chat do pedido." },
  { titulo: "Serviço concluído", texto: "Confirme a conclusão e avalie a profissional." },
];

function Confirmacao() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(
          "*, enderecos(rua, numero, bairro, cidade), profissionais!bookings_profissional_id_fkey(user_id, profiles!profissionais_user_id_fkey(nome))",
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
              <CheckCircle2 className="size-12 text-primary" />
              <h1 className="mt-4 text-3xl leading-tight tracking-tight">
                Sua faxina está confirmada.
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
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Valor do serviço</dt>
                  <dd>{formatBRL(Number(data.valor_profissional ?? 0))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Taxa administrativa</dt>
                  <dd>{formatBRL(Number(data.taxa_admin ?? 0))}</dd>
                </div>
                {Number(data.valor_extras ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Extras</dt>
                    <dd>{formatBRL(Number(data.valor_extras))}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Seguro</dt>
                  <dd>{formatBRL(Number(data.valor_seguro ?? 0))}</dd>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                  <dt className="font-semibold">Total pago</dt>
                  <dd className="font-display text-2xl font-bold text-primary">
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

            {/* Timeline */}
            <div className="rounded-[24px] border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Sparkles className="size-4 text-primary" /> O que acontece agora?
              </h2>
              <ol className="mt-5 space-y-5">
                {etapas.map((etapa, i) => {
                  const concluida = i === 0;
                  return (
                    <li key={etapa.titulo} className="relative flex gap-4">
                      {i < etapas.length - 1 && (
                        <span className="absolute left-[19px] top-10 h-full w-px bg-border" />
                      )}
                      <span
                        className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          concluida
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {concluida ? <CheckCircle2 className="size-5" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="font-semibold">{etapa.titulo}</p>
                        <p className="text-sm text-muted-foreground">{etapa.texto}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

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
