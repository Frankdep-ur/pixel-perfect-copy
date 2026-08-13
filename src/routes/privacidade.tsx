import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — LAR10" },
      {
        name: "description",
        content: "Como o LAR10 trata os dados de clientes e profissionais de limpeza.",
      },
      { property: "og:title", content: "Privacidade — LAR10" },
      {
        property: "og:description",
        content: "Política de privacidade do LAR10. Documento em preparação.",
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
