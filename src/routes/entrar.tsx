import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FormAcesso } from "@/components/auth/form-acesso";

type Busca = { next: string | undefined };

export const Route = createFileRoute("/entrar")({
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    next: typeof busca["next"] === "string" ? (busca["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acesso cliente — Lar77" },
      {
        name: "description",
        content:
          "Entre na sua conta de cliente Lar77 para contratar faxinas e acompanhar seus serviços em Santa Catarina.",
      },
      { property: "og:title", content: "Acesso cliente — Lar77" },
      {
        property: "og:description",
        content: "Entre para contratar faxinas e acompanhar seus serviços na Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntrarCliente,
});

function EntrarCliente() {
  const { next } = Route.useSearch();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <FormAcesso papel="cliente" next={next} />
      <SiteFooter />
    </div>
  );
}
