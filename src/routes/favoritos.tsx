import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EstadoVazio } from "@/components/estado-vazio";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Lar77" },
      {
        name: "description",
        content: "Suas profissionais favoritas da Lar77 ficam reunidas aqui.",
      },
      { property: "og:title", content: "Favoritos — Lar77" },
      { property: "og:description", content: "Suas profissionais favoritas da Lar77." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/entrar", search: { next: "/favoritos" }, replace: true });
    }
  }, [carregando, user, navigate]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="lar-container flex-1 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profissionais que você marcar como favoritas aparecem aqui.
        </p>
        <EstadoVazio
          icon={Heart}
          titulo="Você ainda não tem favoritas"
          texto="Marcar profissionais como favoritas ainda não está disponível. Por enquanto, a Lar77 encontra a profissional mais próxima e bem avaliada para cada serviço."
          acaoLabel="Contratar faxina"
          acaoTo="/contratar"
        />
      </main>
      <SiteFooter />
    </div>
  );
}
