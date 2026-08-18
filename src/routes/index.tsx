import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  ChevronRight,
  Gem,
  LifeBuoy,
  Lock,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Tag,
  UserRound,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroCarrossel } from "@/components/hero-carrossel";
import { useSession } from "@/hooks/use-auth";
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
  { icon: Search, titulo: "Escolha o serviço" },
  { icon: CalendarClock, titulo: "Data e horário" },
  { icon: UserRound, titulo: "Profissional ideal" },
  { icon: ShieldCheck, titulo: "Faxina segura" },
];

const confianca = [
  { icon: BadgeCheck, texto: "Profissionais verificadas" },
  { icon: Lock, texto: "Pagamento protegido" },
  { icon: Tag, texto: "Preço sem surpresa" },
];

const vantagensProfissional = [
  {
    icon: Wallet,
    titulo: "Receba 100% do valor da sua faxina",
    texto:
      "O valor informado para o serviço é o valor que você recebe. Não descontamos comissão do seu pagamento.",
  },
  {
    icon: Lock,
    titulo: "Pagamento garantido",
    texto:
      "Você não precisa ficar preocupada se o cliente vai pagar. Ao finalizar o serviço, basta informar no aplicativo “Faxina Finalizada” e o seu pagamento é processado conforme as condições da plataforma.",
  },
  {
    icon: ShieldCheck,
    titulo: "Trabalhe assegurada",
    texto:
      "Enquanto estiver realizando um serviço contratado pela Lar77, você conta com a proteção oferecida pela empresa, conforme as condições da contratação.",
  },
  {
    icon: Smartphone,
    titulo: "Tudo pelo aplicativo",
    texto:
      "Você recebe as oportunidades, acompanha seus serviços e, ao terminar a faxina, confirma a conclusão diretamente pelo aplicativo.",
  },
  {
    icon: Gem,
    titulo: "Valores padronizados",
    texto:
      "Para garantir mais transparência e igualdade, os valores dos serviços são previamente definidos pela Lar77 e seguem um padrão para todas as profissionais cadastradas.",
  },
];

function Home() {
  const { data } = useQuery(siteConfigQuery);
  const t = (data ?? CONFIG_PADRAO).textos;
  const { user } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 pt-4 md:px-5 md:pt-8">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <div className="relative overflow-hidden rounded-[28px] border border-border">
              <HeroCarrossel />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h1
                  className="max-w-md leading-tight text-foreground"
                  style={{ fontSize: "clamp(26px, 6.5vw, 44px)" }}
                >
                  {t.slogan}
                </h1>
                <a
                  href="#como-funciona"
                  className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-all duration-200 ease-out active:scale-[0.97]"
                >
                  Saiba mais <ChevronRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona — 4 passos em ícones */}
        <section id="como-funciona" className="px-4 py-10 md:px-5">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <h2 className="text-center text-xl text-foreground md:text-2xl">{t.como_titulo}</h2>
            <ol className="mt-6 grid grid-cols-4 gap-1">
              {comoFunciona.map((passo, i) => (
                <li key={passo.titulo} className="relative flex flex-col items-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                    <passo.icon strokeWidth={1.6} className="size-6 text-primary" aria-hidden />
                  </span>
                  <span className="mt-2 text-[11px] font-medium leading-tight text-muted-foreground">
                    {passo.titulo}
                  </span>
                  {i < comoFunciona.length - 1 && (
                    <ChevronRight
                      className="absolute -right-2 top-4 size-4 text-primary/50"
                      aria-hidden
                    />
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-6 text-center text-sm text-muted-foreground">{t.como_subtitulo}</p>
          </div>
        </section>

        {/* Ações principais */}
        <section className="px-4 pb-4 md:px-5">
          <div className="mx-auto grid w-full max-w-md gap-3 md:max-w-5xl md:grid-cols-3">
            <Link
              to="/contratar"
              className="flex items-center gap-4 rounded-[24px] bg-primary p-5 text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10">
                <Sprout strokeWidth={1.6} className="size-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">
                  {t.hero_botao_cliente}
                </span>
                <span className="block text-sm opacity-80">Preço na hora, sem surpresa</span>
              </span>
              <ChevronRight className="size-5 shrink-0" aria-hidden />
            </Link>

            <Link
              to="/seja-profissional"
              className="flex items-center gap-4 rounded-[24px] border border-primary/50 bg-card p-5 text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles strokeWidth={1.6} className="size-6 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">
                  {t.hero_botao_profissional}
                </span>
                <span className="block text-sm text-muted-foreground">
                  Trabalhe como diarista Lar77
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
            </Link>

            <a
              href={linkSuporte()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-5 text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <LifeBuoy strokeWidth={1.6} className="size-6 text-primary" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg font-bold">Suporte</span>
                <span className="block text-sm text-muted-foreground">
                  Fale com a nossa equipe
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </a>
          </div>
        </section>

        {/* Entrar / Criar conta */}
        {!user && (
          <section className="px-4 pb-8 md:px-5">
            <div className="mx-auto w-full max-w-md md:max-w-5xl">
              <Link
                to="/entrar"
                search={{ next: undefined }}
                className="flex min-h-14 w-full items-center justify-center rounded-[24px] bg-primary text-base font-bold text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                Entrar / Criar conta
              </Link>
            </div>
          </section>
        )}

        {/* Faixa de confiança */}
        <section className="border-y border-border bg-card px-4 py-5 md:px-5">
          <ul className="mx-auto grid w-full max-w-md grid-cols-3 gap-3 md:max-w-5xl">
            {confianca.map((item) => (
              <li
                key={item.texto}
                className="flex flex-col items-center gap-1.5 text-center text-foreground md:flex-row md:justify-center md:gap-2.5"
              >
                <item.icon strokeWidth={1.5} className="size-5 text-primary" aria-hidden />
                <span className="text-xs font-medium md:text-sm">{item.texto}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Garantia */}
        <section className="px-4 py-10 md:px-5">
          <div className="mx-auto w-full max-w-md rounded-[24px] border border-primary/25 bg-card p-6 md:max-w-5xl">
            <h3 className="flex items-center gap-2 text-lg text-foreground">
              <ShieldCheck strokeWidth={1.5} className="size-5 text-primary" aria-hidden />
              {t.garantia_titulo}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.garantia_texto}</p>
            <p className="mt-4 font-display text-lg font-bold text-primary">
              {t.garantia_fechamento}
            </p>
          </div>
        </section>

        {/* Trabalhe com a Lar77 */}
        <section id="profissionais" className="border-t border-border bg-card px-4 py-12 md:px-5">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Para profissionais de limpeza
            </span>
            <h2 className="mt-4 text-2xl text-foreground md:text-3xl">{t.prof_titulo}</h2>
            <p className="mt-3 font-display text-lg font-bold text-primary">{t.prof_chamada}</p>
            <p className="mt-3 text-base text-muted-foreground">{t.prof_texto}</p>

            <div className="mt-5 space-y-1 text-foreground">
              <p>{t.prof_fechamento_1}</p>
              <p>{t.prof_fechamento_2}</p>
              <p className="font-semibold">{t.prof_fechamento_3}</p>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {vantagensProfissional.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[24px] border border-border bg-surface-tint p-5"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                    <item.icon strokeWidth={1.5} className="size-5 text-primary" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{item.titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.texto}</p>
                </div>
              ))}
            </div>

            <Link
              to="/seja-profissional"
              className="mt-8 flex min-h-14 w-full items-center justify-center rounded-[24px] bg-primary text-base font-bold text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98] md:w-auto md:px-8"
            >
              {t.hero_botao_profissional}
            </Link>

            <p className="mt-10 text-center font-display text-lg font-bold text-foreground">
              {t.rodape}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
