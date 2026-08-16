import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Gem,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CtaFixoMobile } from "@/components/cta-fixo-mobile";
import { HeroCarrossel } from "@/components/hero-carrossel";
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

const passos = [
  {
    icon: UserPlus,
    titulo: "Cadastre-se",
    texto: "Crie seu cadastro em poucos minutos e informe o endereço do imóvel.",
  },
  {
    icon: Users,
    titulo: "Escolha sua profissional",
    texto:
      "Selecione a profissional que mais combina com o que você precisa ou deixe a Lar77 escolher a profissional ideal para o seu perfil.",
  },
  {
    icon: CalendarClock,
    titulo: "Escolha data e horário",
    texto: "Informe o dia e o horário que deseja receber o serviço.",
  },
  {
    icon: CreditCard,
    titulo: "Realize o pagamento do serviço contratado",
    texto: "",
  },
  {
    icon: Sparkles,
    titulo: "Pronto!",
    texto:
      "Sua profissional estará no local no horário agendado. Você contrata e pode ficar tranquilo.",
  },
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — cliente */}
        <section className="pb-14 pt-6 md:px-5 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-10">
            <div className="order-1 overflow-hidden rounded-b-[24px] md:order-2 md:rounded-2xl md:shadow-[0_24px_48px_oklch(0.22_0.045_258/0.14)]">
              <HeroCarrossel />
            </div>

            <div className="order-2 px-5 md:order-1 md:px-0">
              <h1
                className="leading-tight text-foreground"
                style={{ fontSize: "clamp(28px, 7vw, 52px)" }}
              >
                {t.slogan}
              </h1>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contratar"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-7 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
                >
                  {t.hero_botao_cliente}
                </Link>
                <Link
                  to="/seja-profissional"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-border bg-card px-7 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-all duration-200 ease-out hover:border-primary/30 hover:text-primary active:scale-[0.98]"
                >
                  {t.hero_botao_profissional}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Faixa de confiança */}
        <section className="bg-primary px-5 py-5">
          <ul className="mx-auto grid w-full max-w-6xl grid-cols-3 gap-3">
            {confianca.map((item) => (
              <li
                key={item.texto}
                className="flex flex-col items-center gap-1.5 text-center text-primary-foreground md:flex-row md:justify-center md:gap-2.5"
              >
                <item.icon strokeWidth={1.5} className="h-5 w-5 text-accent" aria-hidden />
                <span className="text-xs font-medium md:text-sm">{item.texto}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Como funciona a Lar77? */}
        <section id="como-funciona" className="bg-surface-tint py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-5">
            <h2 className="text-2xl text-foreground md:text-3xl">{t.como_titulo}</h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">{t.como_subtitulo}</p>

            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {passos.map((passo, i) => (
                <li key={passo.titulo} className="lar-card flex gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-base font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg leading-[1.4] text-foreground">
                      <passo.icon strokeWidth={1.5} className="h-5 w-5 text-accent" aria-hidden />
                      {passo.titulo}
                    </h3>
                    {passo.texto && (
                      <p className="mt-2 text-sm text-muted-foreground">{passo.texto}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 rounded-2xl border border-primary/15 bg-card p-6">
              <h3 className="flex items-center gap-2 text-lg text-foreground">
                <ShieldCheck strokeWidth={1.5} className="h-5 w-5 text-accent" aria-hidden />
                {t.garantia_titulo}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.garantia_texto}</p>
              <p className="mt-4 font-display text-lg font-bold text-primary">
                {t.garantia_fechamento}
              </p>
            </div>
          </div>
        </section>

        {/* Trabalhe com a Lar77 */}
        <section
          id="profissionais"
          className="relative overflow-hidden bg-primary px-5 py-16 md:py-24"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, oklch(0.79 0.125 84) 0%, transparent 25%), radial-gradient(circle at 80% 70%, oklch(0.79 0.125 84) 0%, transparent 30%)",
            }}
          />

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-16">
              <div>
                <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  Para profissionais de limpeza
                </span>
                <h2 className="mt-4 text-3xl text-primary-foreground md:text-4xl">
                  {t.prof_titulo}
                </h2>
                <p className="mt-4 font-display text-xl font-bold text-accent">{t.prof_chamada}</p>
                <p className="mt-4 max-w-lg text-base text-primary-foreground/80">{t.prof_texto}</p>

                <div className="mt-6 space-y-1 text-primary-foreground">
                  <p>{t.prof_fechamento_1}</p>
                  <p>{t.prof_fechamento_2}</p>
                  <p className="font-semibold">{t.prof_fechamento_3}</p>
                </div>

                <Link
                  to="/seja-profissional"
                  className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-accent px-7 text-sm font-bold uppercase tracking-wide text-accent-foreground transition-all duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
                >
                  {t.hero_botao_profissional}
                </Link>
              </div>

              <div className="grid gap-3">
                {vantagensProfissional.map((item) => (
                  <div
                    key={item.titulo}
                    className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur-sm transition-all duration-200 ease-out md:hover:bg-primary-foreground/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                      <item.icon strokeWidth={1.5} className="h-5 w-5 text-accent" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-primary-foreground">
                      {item.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-primary-foreground/70">{item.texto}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-12 text-center font-display text-lg font-bold text-primary-foreground md:text-xl">
              {t.rodape}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
      <CtaFixoMobile />
    </div>
  );
}
