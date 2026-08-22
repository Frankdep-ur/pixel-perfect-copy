import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeCliente } from "@/components/home/home-cliente";
import { useMeuPerfil, useSession } from "@/hooks/use-auth";
import { reservaQuery } from "@/lib/queries";

export const Route = createFileRoute("/reservas_/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da reserva — Lar77" },
      {
        name: "description",
        content: "Detalhes da sua faxina Lar77: profissional, valores, endereço e andamento.",
      },
      { property: "og:title", content: "Detalhes da reserva — Lar77" },
      { property: "og:description", content: "Acompanhe sua faxina Lar77." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DetalheReserva,
});

function DetalheReserva() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const { data: perfil } = useMeuPerfil(user);
  const { data: reserva, isLoading } = useQuery(reservaQuery(id));

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/entrar", search: { next: "/reservas" }, replace: true });
    }
  }, [carregando, user, navigate]);

  const nome = (perfil?.nome ?? "").split(" ")[0] || "cliente";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-md px-4 pt-4 md:max-w-2xl">
          <Link
            to="/reservas"
            className="inline-flex h-11 items-center gap-2 text-[13px] font-semibold text-accent"
          >
            <ArrowLeft size={18} strokeWidth={1.7} aria-hidden />
            Minhas reservas
          </Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : reserva ? (
          <HomeCliente nome={nome} reserva={reserva} />
        ) : (
          <p className="mx-auto w-full max-w-md px-4 py-10 text-center text-sm text-muted-foreground md:max-w-2xl">
            Reserva não encontrada.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
