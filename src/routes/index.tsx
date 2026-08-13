import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  ClipboardList,
  CalendarClock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import heroSala from "@/assets/hero-sala.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 py-12 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-3xl leading-tight text-foreground md:text-5xl">
                Sua casa limpa. Sua contratação segura. Seu tempo de volta.
              </h1>
              <p className="mt-5 text-base text-muted-foreground md:text-lg">
                Encontre profissionais de limpeza, escolha o serviço ideal e contrate tudo
                pelo LAR10.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contratar"
                  className="inline-flex h-[52px] items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  Contratar uma faxina
                </Link>
                <a
                  href="#profissionais"
                  className="inline-flex h-[52px] items-center justify-center rounded-xl border border-border bg-card px-7 text-base font-semibold text-primary transition-colors hover:bg-secondary"
                >
                  Quero ser profissional
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
              <img
                src={heroSala}
                alt="Sala de estar clara e organizada após a limpeza"
                width={1280}
                height={1280}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="px-5 py-12 md:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl text-foreground md:text-3xl">Como funciona</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {passos.map((passo, i) => (
                <article key={passo.titulo} className="lar-card p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <passo.icon
                      strokeWidth={1.5}
                      className="h-5 w-5 text-accent"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-lg text-foreground">{passo.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{passo.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section id="seguranca" className="px-5 py-12 md:py-16">
          <div className="mx-auto w-full max-w-6xl">
            <div className="lar-card p-7 md:p-10">
              <h2 className="text-2xl text-foreground md:text-3xl">
                Limpeza com tecnologia e proteção.
              </h2>
              <ul className="mt-7 grid gap-4 md:grid-cols-2">
                {seguranca.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                      <Check strokeWidth={1.5} className="h-4 w-4 text-accent" aria-hidden />
                    </span>
                    <span className="text-base text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Faixa profissionais */}
        <section id="profissionais" className="px-5 py-12 md:py-16">
          <div className="mx-auto w-full max-w-6xl rounded-2xl bg-primary p-8 md:p-14">
            <h2 className="max-w-2xl text-2xl text-primary-foreground md:text-4xl">
              Transforme seu trabalho em novas oportunidades.
            </h2>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/80">
              Cadastre-se no LAR10, encontre novos clientes e organize sua agenda em um único
              lugar.
            </p>
            <a
              href="#cadastro-profissional"
              className="mt-8 inline-flex h-[52px] items-center justify-center rounded-xl bg-card px-7 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Quero ser profissional LAR10
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
