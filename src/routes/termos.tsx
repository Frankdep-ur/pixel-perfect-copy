import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — LAR10" },
      {
        name: "description",
        content: "Termos de uso da plataforma LAR10 para clientes e profissionais de limpeza.",
      },
      { property: "og:title", content: "Termos de uso — LAR10" },
      {
        property: "og:description",
        content: "Regras de uso da plataforma LAR10. Documento em preparação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <PlaceholderPage
      icon={FileText}
      titulo="Termos de uso · Em breve"
      texto="Estamos finalizando a redação dos termos de uso do LAR10."
    />
  ),
});
