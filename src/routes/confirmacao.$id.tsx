import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeCliente } from "@/components/home/home-cliente";
import { useMeuPerfil, useSession, estaSaindo } from "@/hooks/use-auth";
import { reservaQuery } from "@/lib/queries";

export const Route = createFileRoute("/confirmacao/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da reserva — Lar77" },
      {
        name: "description",
        content: "Sua reserva Lar77: profissional, valores, endereço e acompanhamento do serviço.",
      },
      { property: "og:title", content: "Detalhes da reserva — Lar77" },
      { property: "og:description", content: "Acompanhe sua faxina confirmada na Lar77." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmacao,
});

function Confirmacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const { data: perfil } = useMeuPerfil(user);
  const { data, isLoading } = useQuery(reservaQuery(id));

  useEffect(() => {
    if (!carregando && !user && !estaSaindo()) {
      navigate({ to: "/entrar", search: { next: `/confirmacao/${id}` }, replace: true });
    }
  }, [carregando, user, navigate, id]);

  const nome = (perfil?.nome ?? "").split(" ")[0] || "cliente";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {isLoading || carregando ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ) : data ? (
          <HomeCliente nome={nome} reserva={data} />
        ) : (
          <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
            <h1 className="font-display text-2xl font-bold">Reserva não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com a conta usada na contratação para ver os detalhes.
            </p>
            <Button asChild className="mt-6 min-h-14 w-full rounded-[24px]">
              <Link to="/reservas">Minhas reservas</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
