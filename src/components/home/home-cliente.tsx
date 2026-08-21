import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Headset,
  Home as HomeIcon,
  MapPin,
  MessageSquare,
  Pencil,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BannerProtecao } from "@/components/home/banner-protecao";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";

export type ReservaHome = {
  status?: string | null;
  data?: string | null;
  hora?: string | null;
  duracao_horas?: number | null;
  codigo?: string | null;
  tipo_limpeza?: string | null;
  valor_profissional?: number | null;
  taxa_admin?: number | null;
  valor_extras?: number | null;
  valor_seguro?: number | null;
  valor_total?: number | null;
  aceito_em?: string | null;
  checkin_em?: string | null;
  iniciado_em?: string | null;
  finalizado_em?: string | null;
  enderecos?: {
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
  } | null;
  profissionais?: {
    cidade?: string | null;
    nota_media?: number | string | null;
    total_servicos?: number | null;
    profiles?: { nome?: string | null; foto_url?: string | null } | null;
  } | null;
};

const ETAPAS = [
  { titulo: "Reserva confirmada", icon: CalendarDays, campo: "aceito_em", fallback: "Aguardando" },
  { titulo: "Profissional a caminho", icon: Sparkles, campo: "checkin_em", fallback: "Em breve" },
  { titulo: "Faxina em andamento", icon: HomeIcon, campo: "iniciado_em", fallback: "No horário" },
  { titulo: "Serviço concluído", icon: CheckCircle2, campo: "finalizado_em", fallback: "Avalie a profissional" },
] as const;

/** Quantas etapas já foram cumpridas (0 a 4). */
function etapasCumpridas(status: string | null | undefined): number {
  switch (status) {
    case "aceita":
    case "confirmada":
      return 1;
    case "a_caminho":
      return 2;
    case "em_andamento":
      return 3;
    case "finalizada":
    case "concluida":
      return 4;
    default:
      return 0;
  }
}

function horarioCurto(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} · ${String(
    d.getHours(),
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function faixaHorario(hora: string | null | undefined, duracao: number | null | undefined) {
  if (!hora) return "—";
  const inicio = hora.slice(0, 5);
  const partes = inicio.split(":").map(Number);
  const h = partes[0] ?? NaN;
  const m = partes[1] ?? 0;
  if (isNaN(h) || !duracao) return inicio;
  const fim = `${String((h + duracao) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `${inicio} – ${fim}`;
}

const TAGS = ["Experiente", "Pontual", "Caprichosa"];

export function HomeCliente({ nome, reserva }: { nome: string; reserva: ReservaHome }) {
  const prof = reserva.profissionais ?? null;
  const perfilProf = prof?.profiles ?? null;
  const nomeProf: string = perfilProf?.nome ?? "Profissional Lar77";
  const endereco = reserva.enderecos ?? null;
  const cumpridas = etapasCumpridas(reserva.status);
  const aguardando = cumpridas === 0;

  const dataFmt = reserva.data
    ? new Date(`${reserva.data}T12:00:00`).toLocaleDateString("pt-BR")
    : "—";
  const diaSemana = reserva.data
    ? new Date(`${reserva.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" })
    : "";

  const enderecoTexto = endereco
    ? [
        [endereco.rua, endereco.numero].filter(Boolean).join(", "),
        endereco.complemento,
        [endereco.bairro, [endereco.cidade, endereco.estado].filter(Boolean).join(" – ")]
          .filter(Boolean)
          .join(", "),
        endereco.cep ? `CEP ${endereco.cep}` : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-5 md:max-w-2xl">
      {/* Saudação */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[22px] font-bold leading-tight text-foreground">
            Olá, {nome}! 👋
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {aguardando ? "Estamos buscando sua profissional." : "Sua faxina está confirmada."}
          </p>
        </div>
        <Link
          to="/ajuda"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-accent px-4 text-[13px] font-semibold text-accent transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          <Headset size={18} strokeWidth={1.6} aria-hidden />
          Ajuda / Suporte
        </Link>
      </div>

      {/* Status da reserva */}
      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-bold leading-tight text-foreground">
              {aguardando ? "Sua faxina foi solicitada!" : "Sua faxina está confirmada!"}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Informações da sua reserva.</p>
          </div>
          <span
            className="shrink-0 rounded-full border border-success/40 px-3 py-1 text-[12px] font-semibold text-success"
            style={{ backgroundColor: "rgba(61,214,140,0.12)" }}
          >
            {aguardando ? "Em busca" : "Confirmado"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          {[
            { icon: CalendarDays, label: "Data", valor: dataFmt, extra: diaSemana },
            {
              icon: Clock,
              label: "Horário",
              valor: faixaHorario(reserva.hora, reserva.duracao_horas),
              extra: `${reserva.duracao_horas} horas`,
            },
            {
              icon: UserRound,
              label: "Profissional",
              valor: aguardando ? "A definir" : nomeProf,
              extra: "",
            },
            {
              icon: FileText,
              label: "Código da reserva",
              valor: reserva.codigo ? `#${reserva.codigo}` : "—",
              extra: "",
            },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <item.icon size={20} strokeWidth={1.6} className="text-accent" aria-hidden />
              <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{item.label}</p>
              <p className="truncate text-[14px] font-semibold text-foreground">{item.valor}</p>
              {item.extra && (
                <p className="truncate text-[11px] capitalize text-muted-foreground">{item.extra}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Profissional escolhida */}
      {!aguardando && (
        <section className="rounded-[20px] border border-accent/20 bg-card p-4">
          <h2 className="font-display text-[15px] font-semibold text-accent">
            Profissional escolhida
          </h2>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <Avatar className="size-16 shrink-0 ring-2 ring-accent/40">
              {perfilProf?.foto_url && <AvatarImage src={perfilProf.foto_url} alt={nomeProf} />}
              <AvatarFallback>{nomeProf.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] font-semibold text-foreground">
                {nomeProf}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                <Star size={13} className="fill-accent text-accent" aria-hidden />
                {Number(prof?.nota_media ?? 0).toFixed(1).replace(".", ",")} ·{" "}
                {prof?.total_servicos ?? 0} serviços
              </p>
              {prof?.cidade && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                  <MapPin size={13} className="text-accent" aria-hidden />
                  {prof.cidade}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Link
                to="/mensagens"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-accent px-3 text-[13px] font-semibold text-accent transition-transform duration-200 ease-out active:scale-[0.97]"
              >
                <MessageSquare size={16} strokeWidth={1.6} aria-hidden />
                Chat
              </Link>
              <Link
                to="/minha-conta"
                search={{ aba: "ativas" }}
                className="text-[12px] font-semibold text-accent"
              >
                Ver perfil →
              </Link>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Detalhes da faxina */}
      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="font-display text-[15px] font-semibold text-accent">Detalhes da faxina</h2>
          <Link
            to="/minha-conta"
            search={{ aba: "ativas" }}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-accent px-3 text-[12px] font-semibold text-accent"
          >
            <Pencil size={14} strokeWidth={1.7} aria-hidden />
            Editar
          </Link>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Tipo de serviço</p>
            <p className="text-[14px] font-semibold text-foreground">
              {labelTipoLimpeza(reserva.tipo_limpeza) || "Limpeza"} – {reserva.duracao_horas} horas
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Limpeza completa para o dia a dia, mais cômodos e detalhes.
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground">Método de pagamento</p>
            <div className="mt-1 flex items-center gap-2">
              <CreditCard size={20} strokeWidth={1.6} className="text-accent" aria-hidden />
              <span className="text-[13px] font-semibold text-foreground">Pela plataforma</span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-success"
                style={{ backgroundColor: "rgba(61,214,140,0.12)" }}
              >
                Pago
              </span>
            </div>
          </div>

          <dl className="space-y-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Valor do serviço</dt>
              <dd className="font-semibold text-foreground">
                {formatBRL(Number(reserva.valor_profissional ?? 0))}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Taxa Lar-77</dt>
              <dd className="text-foreground">{formatBRL(Number(reserva.taxa_admin ?? 0))}</dd>
            </div>
            {Number(reserva.valor_extras ?? 0) > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Extras</dt>
                <dd className="text-foreground">{formatBRL(Number(reserva.valor_extras))}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Seguro Lar-77</dt>
              <dd className="text-foreground">{formatBRL(Number(reserva.valor_seguro ?? 0))}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
              <dt className="text-[14px] font-semibold text-foreground">Total pago</dt>
              <dd className="font-display text-[20px] font-bold text-accent">
                {formatBRL(Number(reserva.valor_total ?? 0))}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Endereço */}
      {endereco && (
        <section className="rounded-[20px] border border-accent/20 bg-card p-4">
          <h2 className="font-display text-[15px] font-semibold text-accent">Endereço da faxina</h2>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
            <MapPin size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0 text-[13px] leading-snug text-foreground">
              {enderecoTexto.map((linha) => (
                <p key={linha}>{linha}</p>
              ))}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                enderecoTexto.join(", "),
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-accent px-3 text-[12px] font-semibold text-accent"
            >
              <MapPin size={14} strokeWidth={1.7} aria-hidden />
              Ver no mapa
            </a>
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <h2 className="font-display text-[15px] font-semibold text-accent">O que acontece agora?</h2>
        <ol className="-mx-4 mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ETAPAS.map((etapa, i) => {
            const concluida = i < cumpridas;
            const atual = i === cumpridas;
            const quando = horarioCurto((reserva as Record<string, unknown>)[etapa.campo] as string | null);
            return (
              <li
                key={etapa.titulo}
                className="w-[88px] shrink-0 snap-start text-center sm:w-auto sm:flex-1"
              >
                <span
                  className={`mx-auto flex size-11 items-center justify-center rounded-full border ${
                    concluida
                      ? "border-success text-success"
                      : atual
                        ? "border-accent text-accent"
                        : "border-border text-muted-foreground opacity-60"
                  }`}
                >
                  <etapa.icon size={20} strokeWidth={1.6} aria-hidden />
                </span>
                <span
                  className={`mx-auto mt-1.5 flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold ${
                    concluida
                      ? "bg-success text-background"
                      : atual
                        ? "border border-accent text-accent"
                        : "border border-border text-muted-foreground"
                  }`}
                >
                  {concluida ? <CheckCircle2 size={12} /> : i + 1}
                </span>
                <p
                  className={`mt-1.5 text-[12px] font-semibold leading-snug ${
                    atual || concluida ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {etapa.titulo}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {quando ?? etapa.fallback}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <BannerProtecao />
    </div>
  );
}
