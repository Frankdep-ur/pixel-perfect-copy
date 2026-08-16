import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FormAcesso } from "@/components/auth/form-acesso";

type Busca = { next: string | undefined };

export const Route = createFileRoute("/profissional_/entrar")({
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    next: typeof busca["next"] === "string" ? (busca["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acesso profissional — Lar77" },
      {
        name: "description",
        content:
          "Entre na área da profissional Lar77 para receber pedidos de faxina da sua região e organizar sua agenda.",
      },
      { property: "og:title", content: "Acesso profissional — Lar77" },
      {
        property: "og:description",
        content: "Receba pedidos da sua região e organize sua agenda com a Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarProfissional,
});

function EntrarProfissional() {
  const { next } = Route.useSearch();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <FormAcesso papel="profissional" next={next} />
      <SiteFooter />
    </div>
  );
}
