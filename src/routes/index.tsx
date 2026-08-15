import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  ClipboardList,
  CalendarClock,
  CalendarDays,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CtaFixoMobile } from "@/components/cta-fixo-mobile";
import { HeroCarrossel } from "@/components/hero-carrossel";


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

const jornada = [
  {
    icon: UserPlus,
    titulo: "Crie sua conta",
    texto:
      "Cadastro rápido com seus dados e seus imóveis salvos. Na próxima contratação, é só escolher o imóvel.",
  },
  {
    icon: ClipboardList,
    titulo: "Monte o serviço",
    texto:
      "Informe tamanho do imóvel, duração (4h, 6h ou 8h), tipo de limpeza e extras. O preço aparece na hora.",
  },
  {
    icon: ShieldCheck,
    titulo: "Contrate com segurança",
    texto:
      "Escolha a profissional ou deixe a LAR10 escolher. O pagamento fica protegido na plataforma até a conclusão.",
  },
  {
    icon: Sparkles,
    titulo: "Serviço realizado",
    texto:
      "Você acompanha início e fim da faxina, confirma a conclusão e avalia a profissional. Simples e tranquilo.",
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

const vantagensProfissional = [
  {
    icon: CalendarDays,
    titulo: "Agenda organizada",
    texto: "Receba solicitações e gerencie seus horários em um só lugar.",
  },
  {
    icon: MapPin,
    titulo: "Clientes próximos",
    texto: "Atenda apenas na sua região e dentro do raio que você escolher.",
  },
  {
    icon: Wallet,
    titulo: "Pagamento garantido",
    texto: "O valor do serviço fica reservado e você recebe integralmente.",
  },
  {
    icon: TrendingUp,
    titulo: "Reputação que cresce",
    texto: "Avaliações reais aumentam suas chances de ser escolhida.",
  },
  {
    icon: ShieldCheck,
    titulo: "Mais segurança",
    texto: "Documentação verificada e suporte LAR10 em cada contratação.",
  },
  {
    icon: Users,
    titulo: "Comunidade",
    texto: "Faça parte de uma rede de profissionais de confiança.",
  },
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — 100% focado no Cliente */}
        <section className="pb-14 pt-6 md:px-5 md:py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 md:grid-cols-2 md:gap-10">
            {/* Mobile: carrossel full-bleed acima do texto (até 3 imagens) */}
            <div className="order-1 -mx-0 overflow-hidden rounded-b-[24px] md:order-2 md:rounded-2xl md:shadow-[0_24px_48px_rgba(14,59,54,0.12)]">
              <HeroCarrossel />
            </div>


            <div className="order-2 px-5 md:order-1 md:px-0">
              <h1
                className="leading-tight text-foreground"
                style={{ fontSize: "clamp(28px, 7vw, 56px)" }}
              >
                Sua casa limpa. Sua contratação segura. Seu tempo de volta.
              </h1>
              <p className="mt-5 text-base text-muted-foreground md:text-lg">
                Encontre profissionais de limpeza verificadas, escolha o serviço ideal e
                contrate tudo pelo LAR10.
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
                  className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-border bg-card px-7 text-base font-semibold text-muted-foreground transition-all duration-200 ease-out hover:border-primary/30 hover:text-primary active:scale-[0.98]"
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

        {/* Como funciona — versão institucional, passo a passo tranquilo */}
        <section id="jornada" className="bg-background py-14 md:py-20">
          <div className="mx-auto w-full max-w-6xl px-5">
            <h2 className="text-2xl text-foreground md:text-3xl">
              Do cadastro à casa limpa, sem surpresas
            </h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Um processo simples, transparente e acompanhado pela LAR10 do início ao fim.
            </p>

            <ol className="mt-8 grid gap-5 md:grid-cols-2">
              {jornada.map((item, i) => (
                <li key={item.titulo} className="lar-card flex gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-base font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg leading-[1.4] text-foreground">
                      <item.icon strokeWidth={1.5} className="h-5 w-5 text-accent" aria-hidden />
                      {item.titulo}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 rounded-2xl bg-surface-tint px-5 py-4 text-sm text-muted-foreground">
              Não quer escolher? Marque a opção{" "}
              <strong className="text-foreground">
                “Deixe que a LAR10 escolha a profissional ideal para o seu perfil”
              </strong>{" "}
              e nós indicamos uma profissional verificada e disponível para a sua data.
            </p>
          </div>
        </section>


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

        {/* Seção Profissional — jornada secundária, visualmente distinta */}
        <section
          id="profissionais"
          className="relative overflow-hidden bg-primary px-5 py-16 md:py-24"
        >
          {/* Textura sutil de fundo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, oklch(0.9756 0.0026 106.45) 0%, transparent 25%), radial-gradient(circle at 80% 70%, oklch(0.9756 0.0026 106.45) 0%, transparent 30%)",
            }}
          />

          <div className="relative mx-auto w-full max-w-6xl">
            <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
              <div>
                <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  Para profissionais de limpeza
                </span>
                <h2 className="mt-4 text-3xl text-primary-foreground md:text-4xl">
                  Transforme suas faxinas em uma agenda organizada e clientes confiáveis.
                </h2>
                <p className="mt-4 max-w-lg text-base text-primary-foreground/80 md:text-lg">
                  No LAR10 você recebe solicitações da sua região, escolhe quando trabalhar e
                  tem a segurança de um pagamento garantido.
                </p>
                <Link
                  to="/seja-profissional"
                  className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-card px-7 text-base font-semibold text-primary transition-all duration-200 ease-out hover:opacity-90 active:scale-[0.98]"
                >
                  Quero me cadastrar como profissional
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {vantagensProfissional.map((item) => (
                  <div
                    key={item.titulo}
                    className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur-sm transition-all duration-200 ease-out md:hover:bg-primary-foreground/10"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                      <item.icon
                        strokeWidth={1.5}
                        className="h-5 w-5 text-accent"
                        aria-hidden
                      />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-primary-foreground">
                      {item.titulo}
                    </h3>
                    <p className="mt-1 text-sm text-primary-foreground/70">{item.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <CtaFixoMobile />
    </div>
  );
}
