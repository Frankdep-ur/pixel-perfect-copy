import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FormAcesso } from "@/components/auth/form-acesso";

type Busca = { next: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    next: typeof busca["next"] === "string" ? (busca["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Lar77" },
      {
        name: "description",
        content:
          "Acesse sua conta Lar77 para acompanhar suas contratações de limpeza em Santa Catarina.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Lar77" },
      {
        property: "og:description",
        content: "Acesse sua conta Lar77 e acompanhe suas contratações de limpeza.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { next } = Route.useSearch();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <FormAcesso papel="cliente" next={next} />
      <SiteFooter />
    </div>
  );
}
