import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda — Lar77" },
      {
        name: "description",
        content: "Central de ajuda do Lar77: dúvidas sobre contratação, pagamento e serviços.",
      },
      { property: "og:title", content: "Ajuda — Lar77" },
      {
        property: "og:description",
        content: "Central de ajuda do Lar77. Conteúdo em preparação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PlaceholderPage
      icon={LifeBuoy}
      titulo="Central de ajuda · Em breve"
      texto="Estamos reunindo as dúvidas mais comuns para te ajudar por aqui."
    />
  ),
});
