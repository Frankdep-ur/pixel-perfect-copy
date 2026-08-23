import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Headset,
  Heart,
  Home as HomeIcon,
  Info,
  MapPin,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BannerProtecao } from "@/components/home/banner-protecao";
import { ChatServico } from "@/components/chat-servico";
import { AvaliarDialog } from "@/components/avaliar-dialog";
import { EditarReserva } from "@/components/cliente/editar-reserva";
import { CancelarServico } from "@/components/cancelar-servico";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatBRL, labelTipoImovel, labelTipoLimpeza } from "@/lib/catalogo";
import { distanciaKm } from "@/lib/regioes";
import { linkSuporte } from "@/lib/whatsapp";
import { alternarFavorito, ehFavorito } from "@/lib/favoritos";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export type ReservaHome = {
  id?: string;
  status?: string | null;
  data?: string | null;
  hora?: string | null;
  duracao_horas?: number | null;
  codigo?: string | null;
  tipo_limpeza?: string | null;
  tipo_imovel?: string | null;
  observacoes?: string | null;
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
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  profissionais?: {
    id?: string;
    user_id?: string;
    cidade?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    nota_media?: number | string | null;
    total_servicos?: number | null;
    total_avaliacoes?: number | null;
    anos_experiencia?: number | null;
    bio?: string | null;
    verificada?: boolean | null;
    profiles?: { nome?: string | null; foto_url?: string | null } | null;
  } | null;
  booking_extras?: { preco_congelado?: number | null; extras?: { nome?: string | null } | null }[] | null;
};

const ETAPAS = [
  { titulo: "Reserva confirmada", icon: CalendarDays, campo: "aceito_em", fallback: "Pagamento aprovado" },
  { titulo: "Profissional a caminho", icon: Sparkles, campo: "checkin_em", fallback: "Aguardando horário" },
  { titulo: "Serviço em andamento", icon: HomeIcon, campo: "iniciado_em", fallback: "No horário combinado" },
  { titulo: "Serviço concluído", icon: CheckCircle2, campo: "finalizado_em", fallback: "Avalie a profissional" },
] as const;

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

type VisualStatus = { label: string; classe: string };

function visualDoStatus(status: string | null | undefined): VisualStatus {
  switch (status) {
    case "buscando":
    case "solicitada":
    case "aguardando_aceite":
    case "sem_profissional":
      return { label: "Aguardando profissional", classe: "border-accent/50 bg-accent/10 text-accent" };
    case "aceita":
    case "confirmada":
      return { label: "Confirmada", classe: "border-success/40 text-success bg-[rgba(61,214,140,0.12)]" };
    case "a_caminho":
      return { label: "A caminho", classe: "border-sky-400/40 bg-sky-400/10 text-sky-300" };
    case "em_andamento":
      return { label: "Em andamento", classe: "border-violet-400/40 bg-violet-400/10 text-violet-300" };
    case "finalizada":
      return { label: "Aguardando você", classe: "border-success/40 text-success bg-[rgba(61,214,140,0.12)]" };
    case "concluida":
      return { label: "Concluída", classe: "border-success/40 text-success bg-[rgba(61,214,140,0.12)]" };
    case "cancelada":
    case "recusada":
      return { label: "Cancelada", classe: "border-destructive/40 bg-destructive/10 text-destructive" };
    default:
      return { label: "Reserva", classe: "border-border text-muted-foreground" };
  }
}

function podeEditar(reserva: ReservaHome) {
  if (reserva.checkin_em || reserva.iniciado_em) return false;
  return ["buscando", "solicitada", "aceita", "confirmada"].includes(reserva.status ?? "");
}

function descricaoServico(reserva: ReservaHome) {
  const tipo = labelTipoLimpeza(reserva.tipo_limpeza) || "Limpeza";
  const imovel = labelTipoImovel(reserva.tipo_imovel);
  const extras = (reserva.booking_extras ?? [])
    .map((e) => e.extras?.nome)
    .filter(Boolean)
    .join(", ");
  const partes = [
    `${tipo} de ${reserva.duracao_horas ?? 0} horas`,
    imovel ? `no seu ${imovel.toLowerCase()}` : null,
    extras ? `com ${extras.toLowerCase()}` : null,
  ].filter(Boolean);
  return `${partes.join(" ")}.`;
}

function selosDaProfissional(prof: ReservaHome["profissionais"]) {
  const lista: string[] = [];
  if (prof?.verificada) lista.push("Verificada");
  if ((prof?.anos_experiencia ?? 0) >= 2) lista.push("Experiente");
  if (Number(prof?.nota_media ?? 0) >= 4.7) lista.push("Bem avaliada");
  if ((prof?.total_servicos ?? 0) >= 10) lista.push("Rotina de serviços");
  if (lista.length === 0) lista.push("Pontual");
  return lista;
}

const AJUDAS = [
  { titulo: "Falar com o suporte LAR77", msg: "Olá! Preciso de ajuda com a Lar77." },
  { titulo: "Dúvidas sobre a reserva", msg: "Olá! Tenho uma dúvida sobre a minha reserva" },
  { titulo: "Problemas com pagamento", msg: "Olá! Preciso de ajuda com o pagamento da reserva" },
  { titulo: "Problemas com a profissional", msg: "Olá! Preciso de ajuda com a profissional da minha reserva" },
  { titulo: "Cancelamento ou alteração", msg: "Olá! Quero alterar ou cancelar a minha reserva" },
];

export function HomeCliente({ nome, reserva }: { nome: string; reserva: ReservaHome }) {
  const { user } = useSession();
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [favorito, setFavorito] = useState(() => ehFavorito(user?.id, reserva.profissionais?.id));
  const prof = reserva.profissionais ?? null;
  const perfilProf = prof?.profiles ?? null;
  const nomeProf: string = perfilProf?.nome ?? "Profissional Lar77";
  const endereco = reserva.enderecos ?? null;
  const cumpridas = etapasCumpridas(reserva.status);
  const aguardando = cumpridas === 0;
  const cancelada = reserva.status === "cancelada" || reserva.status === "recusada";
  const badge = visualDoStatus(reserva.status);
  const codigo = reserva.codigo ? `#${reserva.codigo}` : "—";
  const editavel = podeEditar(reserva);
  const pago = !["buscando", "solicitada", "sem_profissional"].includes(reserva.status ?? "");
  const podeAvaliar =
    (reserva.status === "finalizada" || reserva.status === "concluida") &&
    !!reserva.id &&
    !!user?.id &&
    !!prof?.user_id;

  const { data: jaAvaliou } = useQuery({
    queryKey: ["avaliacao-booking", reserva.id, user?.id],
    enabled: !!reserva.id && !!user?.id && podeAvaliar,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id")
        .eq("booking_id", reserva.id!)
        .eq("avaliador_id", user!.id)
        .limit(1);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

  const km = useMemo(() => {
    const elat = endereco?.latitude;
    const elng = endereco?.longitude;
    const plat = prof?.latitude;
    const plng = prof?.longitude;
    if (
      elat == null ||
      elng == null ||
      plat == null ||
      plng == null ||
      !Number.isFinite(Number(elat)) ||
      !Number.isFinite(Number(elng)) ||
      !Number.isFinite(Number(plat)) ||
      !Number.isFinite(Number(plng))
    )
      return null;
    return distanciaKm(Number(elat), Number(elng), Number(plat), Number(plng));
  }, [endereco?.latitude, endereco?.longitude, prof?.latitude, prof?.longitude]);

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

  const tituloPagina = cancelada
    ? "Esta reserva foi cancelada."
    : aguardando
      ? "Estamos buscando sua profissional."
      : cumpridas >= 4
        ? "Serviço concluído."
        : "Sua reserva está confirmada.";

  function copiarCodigo() {
    if (!reserva.codigo) return;
    void navigator.clipboard.writeText(reserva.codigo).then(
      () => toast.success("Código copiado."),
      () => toast.error("Não foi possível copiar."),
    );
  }

  function toggleFavorito() {
    if (!user?.id || !prof?.id) return;
    const agora = alternarFavorito(user.id, prof.id);
    setFavorito(agora);
    toast.success(agora ? "Adicionada aos favoritos." : "Removida dos favoritos.");
  }

  const msgReserva = reserva.codigo ? ` ${codigo}` : "";

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-5 md:max-w-2xl lg:max-w-5xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-[22px] font-bold leading-tight text-foreground">
            Olá, {nome}! 👋
          </h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{tituloPagina}</p>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-accent px-4 text-[13px] font-semibold text-accent transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              <Headset size={18} strokeWidth={1.6} aria-hidden />
              Ajuda / Suporte
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[28px] pb-8">
            <SheetHeader className="text-left">
              <SheetTitle>Como podemos ajudar?</SheetTitle>
              <SheetDescription>
                Fale com a central da Lar77. Tenha o código da reserva em mãos.
              </SheetDescription>
            </SheetHeader>
            <ul className="mt-4 space-y-2">
              {AJUDAS.map((item) => (
                <li key={item.titulo}>
                  <a
                    href={linkSuporte(`${item.msg}${msgReserva}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center rounded-2xl border border-border bg-card px-4 text-[14px] font-medium"
                  >
                    {item.titulo}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/ajuda"
                  className="flex min-h-12 items-center rounded-2xl border border-border bg-card px-4 text-[14px] font-medium"
                >
                  Perguntas frequentes
                </Link>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </div>

      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-bold leading-tight text-foreground">
              {cancelada
                ? "Reserva cancelada"
                : aguardando
                  ? "Sua faxina foi solicitada!"
                  : "Sua reserva está confirmada!"}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Informações da sua reserva</p>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold ${badge.classe}`}>
            {badge.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
          {[
            { icon: CalendarDays, label: "Data", valor: dataFmt, extra: diaSemana },
            {
              icon: Clock,
              label: "Horário",
              valor: faixaHorario(reserva.hora, reserva.duracao_horas),
              extra: reserva.duracao_horas ? `${reserva.duracao_horas} horas` : "",
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
              valor: codigo,
              extra: reserva.codigo ? "Toque para copiar" : "",
              onClick: reserva.codigo ? copiarCodigo : undefined,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="min-w-0 text-left"
              disabled={!item.onClick}
            >
              <item.icon size={20} strokeWidth={1.6} className="text-accent" aria-hidden />
              <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground">{item.label}</p>
              <p className="flex items-center gap-1 truncate text-[14px] font-semibold text-foreground">
                {item.valor}
                {item.onClick && <Copy size={12} className="shrink-0 text-muted-foreground" />}
              </p>
              {item.extra && (
                <p className="truncate text-[11px] capitalize text-muted-foreground">{item.extra}</p>
              )}
            </button>
          ))}
        </div>
      </section>

      {!aguardando && !cancelada && (
        <section className="rounded-[20px] border border-accent/20 bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[15px] font-semibold text-accent">Profissional escolhida</h2>
            {prof?.id && user?.id && (
              <button
                type="button"
                onClick={toggleFavorito}
                aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border transition-colors active:scale-95"
              >
                <Heart
                  size={18}
                  strokeWidth={1.7}
                  className={favorito ? "fill-accent text-accent" : "text-muted-foreground"}
                />
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <Avatar className="size-16 shrink-0 ring-2 ring-accent/40">
              {perfilProf?.foto_url && <AvatarImage src={perfilProf.foto_url} alt={nomeProf} />}
              <AvatarFallback>{nomeProf.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-display text-[16px] font-semibold text-foreground">{nomeProf}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[12px] text-muted-foreground">
                <Star size={13} className="fill-accent text-accent" aria-hidden />
                {Number(prof?.nota_media ?? 0).toFixed(1).replace(".", ",")} · {prof?.total_servicos ?? 0}{" "}
                serviços
              </p>
              {km != null ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                  <MapPin size={13} className="text-accent" aria-hidden />
                  {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`} de você
                </p>
              ) : (
                prof?.cidade && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                    <MapPin size={13} className="text-accent" aria-hidden />
                    {prof.cidade}
                  </p>
                )
              )}
            </div>
            <div className="col-span-2 mt-2 flex flex-wrap gap-2 sm:col-span-1 sm:mt-0 sm:flex-col sm:items-end">
              {reserva.id && user?.id && (
                <ChatServico
                  bookingId={reserva.id}
                  userId={user.id}
                  titulo={`Chat · ${codigo}`}
                  interlocutor={nomeProf.split(" ")[0] ?? "a profissional"}
                />
              )}
              <button
                type="button"
                onClick={() => setPerfilAberto(true)}
                className="h-10 text-[12px] font-semibold text-accent"
              >
                Ver perfil →
              </button>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {selosDaProfissional(prof).map((tag) => (
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

      <Sheet open={perfilAberto} onOpenChange={setPerfilAberto}>
        <SheetContent side="bottom" className="rounded-t-[28px] pb-8">
          <SheetHeader className="text-left">
            <SheetTitle>{nomeProf}</SheetTitle>
            <SheetDescription>
              {Number(prof?.nota_media ?? 0).toFixed(1).replace(".", ",")} · {prof?.total_servicos ?? 0}{" "}
              serviços
              {prof?.cidade ? ` · ${prof.cidade}` : ""}
            </SheetDescription>
          </SheetHeader>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            {prof?.bio || "Profissional verificada da Lar77, pronta para o seu serviço."}
          </p>
        </SheetContent>
      </Sheet>

      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="font-display text-[15px] font-semibold text-accent">Detalhes do serviço</h2>
          {reserva.id && (
            <EditarReserva
              bookingId={reserva.id}
              dataAtual={reserva.data}
              horaAtual={reserva.hora}
              duracaoHoras={reserva.duracao_horas}
              disabled={!editavel}
              onBloqueado={() =>
                toast.message("Esta reserva não pode mais ser alterada", {
                  description: reserva.checkin_em
                    ? "A profissional já iniciou o deslocamento."
                    : "Fale com o suporte se precisar de ajuda.",
                })
              }
            />
          )}
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Tipo de serviço</p>
            <p className="text-[14px] font-semibold text-foreground">
              {labelTipoLimpeza(reserva.tipo_limpeza) || "Limpeza"} — {reserva.duracao_horas} horas
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{descricaoServico(reserva)}</p>
            {reserva.observacoes && (
              <p className="mt-2 text-[12px] text-muted-foreground">Recado: {reserva.observacoes}</p>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">Método de pagamento</p>
            <div className="mt-1 flex items-center gap-2">
              <CreditCard size={20} strokeWidth={1.6} className="text-accent" aria-hidden />
              <span className="text-[13px] font-semibold text-foreground">PIX</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  pago ? "text-success" : "text-accent"
                }`}
                style={{ backgroundColor: pago ? "rgba(61,214,140,0.12)" : "rgba(212,175,55,0.15)" }}
              >
                {pago ? "Pago" : "Pendente"}
              </span>
            </div>
          </div>

          <dl className="space-y-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Valor do serviço</dt>
              <dd className="font-semibold text-foreground">
                {formatBRL(Number(reserva.valor_profissional ?? 0) + Number(reserva.taxa_admin ?? 0))}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="flex items-center gap-1 text-muted-foreground">
                Taxa Lar77
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" aria-label="O que é a taxa Lar77" className="text-accent">
                      <Info size={13} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-sm">
                    17% do valor da contratação. Já está no total — cobre operação, suporte e
                    proteção da plataforma.
                  </PopoverContent>
                </Popover>
              </dt>
              <dd className="text-foreground">{formatBRL(Number(reserva.taxa_admin ?? 0))}</dd>
            </div>
            {Number(reserva.valor_extras ?? 0) > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Extras</dt>
                <dd className="text-foreground">{formatBRL(Number(reserva.valor_extras ?? 0))}</dd>
              </div>
            )}
            {Number(reserva.valor_seguro ?? 0) > 0 && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="flex items-center gap-1 text-muted-foreground">
                  Proteção Lar77
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-label="O que é a proteção" className="text-accent">
                        <Info size={13} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 text-sm">
                      Proteção da contratação, conforme as condições da plataforma.
                    </PopoverContent>
                  </Popover>
                </dt>
                <dd className="text-foreground">{formatBRL(Number(reserva.valor_seguro ?? 0))}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
              <dt className="text-[14px] font-semibold text-foreground">Total pago</dt>
              <dd className="font-display text-[20px] font-bold text-accent">
                {formatBRL(Number(reserva.valor_total ?? 0))}
              </dd>
            </div>
          </dl>
        </div>

        {reserva.id && user?.id && editavel && !cancelada && (
          <div className="mt-4 border-t border-border pt-4">
            <CancelarServico
              bookingId={reserva.id}
              userId={user.id}
              papel="cliente"
              valorTotal={Number(reserva.valor_total ?? 0)}
              invalidar={["reserva", "minhas-reservas", "proxima-reserva"]}
            />
          </div>
        )}
      </section>

      {endereco && (
        <section className="rounded-[20px] border border-accent/20 bg-card p-4">
          <h2 className="font-display text-[15px] font-semibold text-accent">Endereço do serviço</h2>
          <div className="mt-3 flex items-start gap-3">
            <MapPin size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
              {enderecoTexto.map((linha) => (
                <p key={String(linha)}>{linha}</p>
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
              Ver no mapa
            </a>
          </div>
        </section>
      )}

      {!cancelada && (
        <section className="rounded-[20px] border border-accent/20 bg-card p-4">
          <h2 className="font-display text-[15px] font-semibold text-accent">O que acontece agora?</h2>
          <ol className="relative mt-5 space-y-4 sm:grid sm:grid-cols-4 sm:gap-3 sm:space-y-0">
            {ETAPAS.map((etapa, i) => {
              const concluida = i < cumpridas;
              const atual = i === cumpridas;
              const quando = horarioCurto(
                (reserva as Record<string, unknown>)[etapa.campo] as string | null,
              );
              const rotulo =
                i === 3 && cumpridas >= 4 ? "Avalie sua profissional" : etapa.titulo;
              return (
                <li key={etapa.titulo} className="relative flex gap-3 sm:flex-col sm:items-center sm:text-center">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full border ${
                      concluida
                        ? "border-success text-success"
                        : atual
                          ? "border-accent text-accent"
                          : "border-border text-muted-foreground opacity-60"
                    }`}
                  >
                    <etapa.icon size={20} strokeWidth={1.6} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-[13px] font-semibold leading-snug ${
                        atual || concluida ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {rotulo}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {quando ?? etapa.fallback}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {podeAvaliar && !jaAvaliou && reserva.id && user?.id && prof?.user_id && (
        <AvaliarDialog
          bookingId={reserva.id}
          avaliadoId={prof.user_id}
          avaliadorId={user.id}
          trigger={
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-center rounded-[24px] bg-accent text-[15px] font-bold text-background"
            >
              Avaliar profissional
            </button>
          }
        />
      )}

      <BannerProtecao />
    </div>
  );
}
