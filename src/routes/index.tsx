import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  LifeBuoy,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Tag,
  UserRound,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCarrossel } from "@/components/hero-carrossel";
import { useSession, usePapeis, useMeuPerfil } from "@/hooks/use-auth";
import { proximaReservaQuery } from "@/lib/queries";
import { HomeCliente } from "@/components/home/home-cliente";
import { HomeClienteVazia } from "@/components/home/home-cliente-vazia";
import { linkSuporte } from "@/lib/whatsapp";
import { siteConfigQuery, CONFIG_PADRAO } from "@/lib/site-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lar77 — O jeito inteligente de cuidar do seu espaço" },
      {
        name: "description",
        content:
          "Contrate profissionais de limpeza de confiança com valores definidos, pagamento garantido e segurança durante o serviço.",
      },
      { property: "og:title", content: "Lar77 — Diaristas de confiança" },
      {
        property: "og:description",
        content:
          "Agende sua faxina em poucos minutos: profissionais verificadas, preço transparente e acompanhamento pelo app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const comoFunciona = [
  {
    icon: Search,
    titulo: "Escolha o serviço",
    descricao: "Diga o tipo de imóvel e o serviço que você precisa.",
  },
  {
    icon: CalendarClock,
    titulo: "Data e horário",
    descricao: "Escolha o dia e a duração da faxina com preço na hora.",
  },
  {
    icon: UserRound,
    titulo: "Profissional ideal",
    descricao: "Chamamos as diaristas verificadas mais próximas de você.",
  },
  {
    icon: ShieldCheck,
    titulo: "Faxina segura",
    descricao: "Pagamento protegido e acompanhamento pelo aplicativo.",
  },
];

const confianca = [
  { icon: BadgeCheck, texto: "Profissionais verificadas" },
  { icon: Lock, texto: "Pagamento protegido" },
  { icon: Tag, texto: "Preço sem surpresa" },
];


function Home() {
  const { data } = useQuery(siteConfigQuery);
  const t = (data ?? CONFIG_PADRAO).textos;
  const { user } = useSession();
  const { data: papeis } = usePapeis(user);
  const { data: perfil } = useMeuPerfil(user);
  const { data: reserva, isLoading: carregandoReserva } = useQuery(
    proximaReservaQuery(user?.id),
  );
  const ehProfissional = (papeis ?? []).includes("profissional");
  const nomeCliente = (perfil?.nome ?? "").split(" ")[0] || "cliente";

  // Cliente logado vê o app: com faxina ativa (Estado 1) ou o painel vazio (Estado 2).
  if (user && !ehProfissional) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          {carregandoReserva ? (
            <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6 md:max-w-2xl">
              <div className="h-8 w-2/3 animate-pulse rounded-xl bg-surface" />
              <div className="h-40 animate-pulse rounded-[20px] bg-surface" />
              <div className="h-28 animate-pulse rounded-[20px] bg-surface" />
            </div>
          ) : reserva ? (
            <HomeCliente nome={nomeCliente} reserva={reserva} />
          ) : (
            <HomeClienteVazia nome={nomeCliente} />
          )}
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
      <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="pt-4">
          <div className="mx-auto w-full max-w-md md:max-w-2xl">
            <HeroCarrossel tituloPadrao={t.slogan} subtituloPadrao={t.como_subtitulo} />
          </div>
        </section>

        {/* Como funciona — grade de passos */}
        <section id="como-funciona" className="py-8">
          <div className="mx-auto w-full max-w-md px-4 md:max-w-2xl">
            <h2 className="font-display text-[18px] font-semibold text-accent">
              {t.como_titulo}
            </h2>
            <ol className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {comoFunciona.map((passo, i) => (
                <li
                  key={passo.titulo}
                  className="rounded-[14px] border border-border bg-surface p-3"
                >
                  <div className="relative inline-flex">
                    <span className="flex size-[52px] items-center justify-center rounded-xl bg-surface-tint">
                      <passo.icon size={26} strokeWidth={1.5} className="text-accent" aria-hidden />
                    </span>
                    <span className="absolute -left-2 -top-2 flex size-[22px] items-center justify-center rounded-full border border-accent bg-background text-[12px] font-semibold text-accent">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-[14px] font-semibold leading-snug text-foreground">
                    {passo.titulo}
                  </h3>
                  <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                    {passo.descricao}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ações principais */}
        <section className="px-4 pb-4">
          <div className="mx-auto flex w-full max-w-md flex-col gap-3 md:max-w-2xl">
            <Link
              to="/contratar"
              className="flex h-[76px] items-center gap-4 rounded-[14px] bg-accent px-4 transition-transform duration-200 ease-out active:scale-[0.98]"
              style={{ color: "#04162F" }}
            >
              <Sprout size={28} strokeWidth={1.6} aria-hidden className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-bold leading-tight">
                  {t.hero_botao_cliente}
                </span>
                <span className="block text-[13px] opacity-80">Preço na hora, sem surpresa</span>
              </span>
              <ChevronRight size={20} className="shrink-0" aria-hidden />
            </Link>

            <Link
              to="/trabalhe-conosco"
              className="flex h-[76px] items-center gap-4 rounded-[14px] border border-accent bg-transparent px-4 transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              <Sparkles size={28} strokeWidth={1.6} className="shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-bold leading-tight text-accent">
                  {t.hero_botao_profissional}
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  Trabalhe como diarista Lar77
                </span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-accent" aria-hidden />
            </Link>

            <a
              href={linkSuporte()}
              target="_blank"
              rel="noreferrer"
              className="flex h-[76px] items-center gap-4 rounded-[14px] bg-surface px-4 transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent">
                <LifeBuoy size={22} strokeWidth={1.6} className="text-accent" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-bold leading-tight text-foreground">
                  Suporte
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  Fale com a nossa equipe
                </span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
            </a>
          </div>
        </section>

        {/* Entrar / Criar conta */}
        {!user && (
          <section className="px-4 pb-8">
            <div className="mx-auto w-full max-w-md md:max-w-2xl">
              <Link
                to="/entrar"
                search={{ next: undefined }}
                className="flex h-[52px] w-full items-center justify-center rounded-xl bg-accent text-base font-bold transition-transform duration-200 ease-out active:scale-[0.98]"
                style={{ color: "#04162F" }}
              >
                Entrar / Criar conta
              </Link>
              <p className="mt-2 text-center text-[13px] text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/entrar"
                  search={{ next: undefined }}
                  className="inline-flex min-h-11 items-center px-1 text-accent underline"
                >
                  Faça seu login
                </Link>
              </p>
            </div>
          </section>
        )}


        {/* Faixa de confiança */}
        <section className="border-y border-border bg-card px-4 py-5 md:px-5">
          <ul className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 md:max-w-5xl">
            {confianca.map((item) => (
              <li
                key={item.texto}
                className="flex h-full min-h-[62px] flex-col items-center justify-start gap-1.5 text-center text-foreground md:min-h-0 md:flex-row md:justify-center md:gap-2.5"
              >
                <item.icon strokeWidth={1.5} className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="text-[11px] font-medium leading-tight md:text-sm">
                  {item.texto}
                </span>
              </li>
            ))}
          </ul>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
