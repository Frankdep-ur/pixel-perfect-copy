import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contratar")({
  head: () => ({
    meta: [
      { title: "Contratar uma faxina | LAR10" },
      {
        name: "description",
        content:
          "Monte sua faxina em poucos passos: endereço, tipo de imóvel, duração, extras, data e horário. Preço transparente antes de confirmar.",
      },
      { property: "og:title", content: "Contratar uma faxina | LAR10" },
      {
        property: "og:description",
        content: "Monte sua faxina em poucos passos e veja o preço em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContratarPage,
});

function ContratarPage() {
  return (
    <main className="min-h-screen py-16">
      <div className="lar-container text-center">
        <h1 className="text-2xl text-foreground">Funil de contratação</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Em construção — próxima etapa do LAR10.
        </p>
      </div>
    </main>
  );
}
