import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Gem,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteConfigQuery, CONFIG_PADRAO } from "@/lib/site-config";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () => ({
    meta: [
      { title: "Trabalhe com a Lar77 — Diaristas de confiança" },
      {
        name: "description",
        content:
          "Cadastre-se como profissional de limpeza no Lar77. Receba oportunidades, organize sua agenda e trabalhe com segurança.",
      },
      { property: "og:title", content: "Trabalhe com a Lar77" },
      {
        property: "og:description",
        content:
          "Junte-se às diaristas de confiança do Lar77 e receba oportunidades de faxina na sua região.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrabalheConosco,
});

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

function TrabalheConosco() {
  const { data } = useQuery(siteConfigQuery);
  const t = (data ?? CONFIG_PADRAO).textos;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero interno */}
        <section className="px-4 pt-8 md:px-5">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Para profissionais de limpeza
            </span>
            <h1 className="mt-4 text-2xl text-foreground md:text-3xl">
              {t.prof_titulo}
            </h1>
            <p className="mt-3 font-display text-lg font-bold text-primary">
              {t.prof_chamada}
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              {t.prof_texto}
            </p>

            <div className="mt-5 space-y-1 text-foreground">
              <p>{t.prof_fechamento_1}</p>
              <p>{t.prof_fechamento_2}</p>
              <p className="font-semibold">{t.prof_fechamento_3}</p>
            </div>

            <Link
              to="/seja-profissional"
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-[24px] bg-primary text-base font-bold text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98] md:w-auto md:px-8"
            >
              {t.hero_botao_profissional}
            </Link>
          </div>
        </section>

        {/* Vantagens */}
        <section className="px-4 py-12 md:px-5">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <div className="grid gap-3 md:grid-cols-2">
              {vantagensProfissional.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-[24px] border border-border bg-surface-tint p-5"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
                    <item.icon
                      strokeWidth={1.5}
                      className="size-5 text-primary"
                      aria-hidden
                    />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {item.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.texto}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Garantia */}
        <section className="px-4 py-10 md:px-5">
          <div className="mx-auto w-full max-w-md rounded-[24px] border border-primary/25 bg-card p-6 md:max-w-5xl">
            <h3 className="flex items-center gap-2 text-lg text-foreground">
              <ShieldCheck
                strokeWidth={1.5}
                className="size-5 text-primary"
                aria-hidden
              />
              {t.garantia_titulo}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.garantia_texto}
            </p>
            <p className="mt-4 font-display text-lg font-bold text-primary">
              {t.garantia_fechamento}
            </p>
          </div>
        </section>

        {/* Fechamento */}
        <section className="px-4 pb-12 md:px-5">
          <div className="mx-auto w-full max-w-md md:max-w-5xl">
            <p className="text-center font-display text-lg font-bold text-foreground">
              {t.rodape}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
