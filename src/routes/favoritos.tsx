import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useSession, estaSaindo } from "@/hooks/use-auth";
import { listarFavoritos, salvarFavoritos } from "@/lib/favoritos";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Lar77" },
      { name: "description", content: "Suas profissionais favoritas na Lar77." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FavoritosPage,
});

type ProfFavorito = {
  id: string;
  nota_media: number | string | null;
  total_servicos: number | null;
  cidade: string | null;
  verificada: boolean | null;
  profiles: { nome: string | null; foto_url: string | null } | null;
};

function FavoritosPage() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const [ids, setIds] = useState<string[]>(() => listarFavoritos(user?.id));

  useEffect(() => {
    if (!carregando && !user && !estaSaindo()) {
      navigate({ to: "/entrar", search: { next: "/favoritos" }, replace: true });
    }
  }, [carregando, user, navigate]);

  useEffect(() => {
    if (user?.id) setIds(listarFavoritos(user.id));
  }, [user?.id]);

  const { data: profissionais, isLoading } = useQuery({
    queryKey: ["favoritos-profissionais", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select(
          "id, nota_media, total_servicos, cidade, verificada, profiles!profissionais_user_id_fkey(nome, foto_url)",
        )
        .in("id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as ProfFavorito[];
    },
  });

  const lista = useMemo(() => {
    if (!profissionais) return [];
    return ids
      .map((id) => profissionais.find((p) => p.id === id))
      .filter((p): p is ProfFavorito => !!p);
  }, [ids, profissionais]);

  function remover(id: string) {
    if (!user?.id) return;
    const proximo = ids.filter((x) => x !== id);
    salvarFavoritos(user.id, proximo);
    setIds(proximo);
    toast.success("Removida dos favoritos.");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 md:max-w-2xl">
        <h1 className="font-display text-[22px] font-bold text-foreground">Favoritos</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Profissionais que você salvou para contratar de novo.
        </p>

        {isLoading && ids.length > 0 && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        )}

        {!isLoading && lista.length === 0 && (
          <div className="mt-10 flex flex-col items-center rounded-[20px] border border-border bg-card px-6 py-12 text-center">
            <Heart size={36} className="text-muted-foreground" strokeWidth={1.4} />
            <p className="mt-4 text-[15px] font-semibold text-foreground">Nenhuma favorita ainda</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Toque no coração na página da reserva para salvar uma profissional.
            </p>
            <Link
              to="/reservas"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[13px] font-semibold text-background"
            >
              Ver minhas reservas
            </Link>
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {lista.map((p) => {
            const nome = p.profiles?.nome ?? "Profissional";
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-[18px] border border-border bg-card p-3"
              >
                <Avatar className="size-14 shrink-0 ring-2 ring-accent/30">
                  {p.profiles?.foto_url && <AvatarImage src={p.profiles.foto_url} alt={nome} />}
                  <AvatarFallback>{nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-semibold text-foreground">
                    {nome}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    ★ {Number(p.nota_media ?? 0).toFixed(1).replace(".", ",")} ·{" "}
                    {p.total_servicos ?? 0} serviços
                    {p.cidade ? ` · ${p.cidade}` : ""}
                  </p>
                  {p.verificada && (
                    <span className="mt-1 inline-block rounded-full border border-success/40 px-2 py-0.5 text-[10px] font-semibold text-success">
                      Verificada
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remover(p.id)}
                  aria-label={`Remover ${nome} dos favoritos`}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
