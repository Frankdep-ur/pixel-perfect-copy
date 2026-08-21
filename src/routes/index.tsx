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
        <section className="pt-4">
          <div className="mx-auto w-full max-w-md md:max-w-2xl">
            <HeroCarrossel tituloPadrao={t.slogan} subtituloPadrao={t.como_subtitulo} />
          </div>
        </section>

        {/* Como funciona — faixa horizontal de passos */}
        <section id="como-funciona" className="py-8">
          <div className="mx-auto w-full max-w-md md:max-w-2xl">
            <h2 className="px-4 font-display text-[18px] font-semibold text-accent">
              {t.como_titulo}
            </h2>
            <ol className="no-scrollbar mt-5 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-1 pl-6 pr-4">
              {comoFunciona.map((passo, i) => (
                <li key={passo.titulo} className="flex shrink-0 items-start gap-3 snap-start">
                  <div className="w-[148px]">
                    <div className="relative">
                      <span className="flex size-16 items-center justify-center rounded-[14px] bg-surface-tint">
                        <passo.icon size={28} strokeWidth={1.5} className="text-accent" aria-hidden />
                      </span>
                      <span className="absolute -left-2 -top-2 flex size-[22px] items-center justify-center rounded-full border border-accent bg-background text-[12px] font-semibold text-accent">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-[14px] font-semibold leading-snug text-foreground line-clamp-2">
                      {passo.titulo}
                    </h3>
                    <p className="mt-1 text-[12px] leading-snug text-muted-foreground line-clamp-3">
                      {passo.descricao}
                    </p>
                  </div>
                  {i < comoFunciona.length - 1 && (
                    <ChevronRight
                      size={16}
                      className="mt-6 shrink-0 text-accent opacity-50"
                      aria-hidden
                    />
                  )}
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
              to="/seja-profissional"
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
              <p className="mt-3 text-center text-[13px] text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  to="/entrar"
                  search={{ next: undefined }}
                  className="text-accent underline"
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
