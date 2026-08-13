import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  ClipboardList,
  CalendarClock,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import heroSala from "@/assets/hero-sala.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CtaFixoMobile } from "@/components/cta-fixo-mobile";
import { ProfissionaisRegiao } from "@/components/profissionais-regiao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LAR10 — Contrate diaristas com segurança em SC" },
      {
        name: "description",
        content:
          "Encontre profissionais de limpeza verificadas, escolha o serviço ideal e contrate com pagamento seguro pela plataforma LAR10.",
      },
      { property: "og:title", content: "LAR10 — Contrate diaristas com segurança" },
      {
        property: "og:description",
        content:
          "Profissionais verificadas, preço transparente e acompanhamento em tempo real. Contrate sua faxina pelo LAR10.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const passos = [
  {
    icon: ClipboardList,
    titulo: "Escolha",
    texto: "Diga o tipo de imóvel e o serviço que precisa",
  },
  {
    icon: CalendarClock,
    titulo: "Combine",
    texto: "Defina data, horário e duração",
  },
  {
    icon: ShieldCheck,
    titulo: "Contrate",
    texto: "Pague com segurança pela plataforma",
  },
  {
    icon: Sparkles,
    titulo: "Relaxe",
    texto: "A profissional cuida do resto",
  },
];

const seguranca = [
  "Profissionais verificadas",
  "Pagamento seguro pela plataforma",
  "Acompanhamento em tempo real",
  "Sistema de avaliação",
  "Proteção incluída em toda contratação",
  "Suporte LAR10",
];

const confianca = [
  { icon: BadgeCheck, texto: "Profissionais verificadas" },
  { icon: Lock, texto: "Pagamento protegido" },
  { icon: Tag, texto: "Preço sem surpresa" },
];



function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="pb-14 pt-6 md:px-5 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-10">
            {/* Mobile: imagem full-bleed acima do texto */}
            <div className="order-1 -mx-0 h-[40vh] overflow-hidden rounded-b-[24px] md:order-2 md:h-auto md:rounded-2xl md:shadow-[0_24px_48px_rgba(14,59,54,0.12)]">
              <img
                src={heroSala}
                alt="Sala de estar clara e organizada após a limpeza"
                width={1280}
                height={1280}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="order-2 px-5 md:order-1 md:px-0">
              <h1
                className="leading-tight text-foreground"
                style={{ fontSize: "clamp(28px, 7vw, 56px)" }}
              >
                Sua casa limpa. Sua contratação segura. Seu tempo de volta.
              </h1>
              <p className="mt-5 text-base text-muted-foreground md:text-lg">
                Encontre profissionais de limpeza, escolha o serviço ideal e contrate tudo
                pelo LAR10.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contratar"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
                >
                  Contratar uma faxina
                </Link>
                <Link
                  to="/seja-profissional"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-border bg-card px-7 text-base font-semibold text-primary transition-all duration-200 ease-out hover:bg-secondary active:scale-[0.98]"
                >
                  Quero ser profissional
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

        {/* Como funciona */}
        <section id="como-funciona" className="bg-surface-tint py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="px-5 text-2xl text-foreground md:text-3xl">Como funciona</h2>
            <div className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mt-8 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible">
              {passos.map((passo, i) => (
                <article
                  key={passo.titulo}
                  className="lar-card w-[78vw] shrink-0 snap-start p-5 transition-all duration-200 ease-out md:w-auto md:p-6 md:hover:-translate-y-0.5 md:hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-base font-bold text-primary">
                      {i + 1}
                    </span>
                    <passo.icon
                      strokeWidth={1.5}
                      className="h-5 w-5 text-accent"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-lg leading-[1.4] text-foreground">{passo.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{passo.texto}</p>
                </article>
              ))}
              <span className="w-1 shrink-0 md:hidden" aria-hidden />
            </div>
          </div>
        </section>

        {/* Profissionais da sua região */}
        <ProfissionaisRegiao />

        {/* Segurança — invertida */}
        <section id="seguranca" className="bg-primary px-5 py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl text-primary-foreground md:text-3xl">
              Limpeza com tecnologia e proteção.
            </h2>
            <ul className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
              {seguranca.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <Check strokeWidth={2} className="h-4 w-4 text-accent" aria-hidden />
                  </span>
                  <span className="pt-1 text-base text-primary-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>


        {/* Faixa profissionais */}
        <section id="profissionais" className="px-5 py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl rounded-2xl bg-primary p-8 md:p-14">
            <h2 className="max-w-2xl text-2xl text-primary-foreground md:text-4xl">
              Transforme seu trabalho em novas oportunidades.
            </h2>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
              Cadastre-se no LAR10, encontre novos clientes e organize sua agenda em um único
              lugar.
            </p>
            <Link
              to="/seja-profissional"
              className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-card px-7 text-base font-semibold text-primary transition-all duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
            >
              Quero ser profissional LAR10
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <CtaFixoMobile />
    </div>
  );
}

