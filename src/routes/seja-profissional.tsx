import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/seja-profissional")({
  head: () => ({
    meta: [
      { title: "Seja profissional Lar77 — cadastro" },
      {
        name: "description",
        content:
          "Cadastre-se como profissional de limpeza no Lar77, encontre clientes e organize sua agenda.",
      },
      { property: "og:title", content: "Seja profissional Lar77" },
      {
        property: "og:description",
        content: "Transforme seu trabalho em novas oportunidades com o Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SejaProfissional,
});

function SejaProfissional() {
  return (
    <PlaceholderPage
      icon={BadgeCheck}
      titulo="Cadastro de profissional · Em breve"
      texto="O cadastro público está em preparação. Você já pode começar pela área da profissional."
    >
      <Link
        to="/profissional"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-7 text-base font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
      >
        Acessar área da profissional
      </Link>
    </PlaceholderPage>
  );
}
