import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — Lar77" },
      {
        name: "description",
        content: "Como o Lar77 trata os dados de clientes e profissionais de limpeza.",
      },
      { property: "og:title", content: "Privacidade — Lar77" },
      {
        property: "og:description",
        content: "Política de privacidade do Lar77. Documento em preparação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PlaceholderPage
      icon={ShieldCheck}
      titulo="Privacidade · Em breve"
      texto="Nossa política de privacidade está sendo preparada com cuidado."
    />
  ),
});
