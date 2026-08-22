import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock3, Loader2, MapPin, Star, TriangleAlert, UserCog } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { PwaInstalar } from "@/components/pwa-instalar";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CadastroProfissional } from "@/components/profissional/cadastro-profissional";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EstadoVazio } from "@/components/estado-vazio";
import { ServicosProfissional } from "@/components/profissional/servicos-profissional";

import { nomeRegiao } from "@/lib/regioes";
import { usePapeis, useSession } from "@/hooks/use-auth";

type Busca = { aba?: string };

export const Route = createFileRoute("/profissional")({
  validateSearch: (busca: Record<string, unknown>): Busca =>
    typeof busca["aba"] === "string" ? { aba: busca["aba"] as string } : {},
  head: () => ({
    meta: [
      { title: "Minhas faxinas — Lar77" },
      {
        name: "description",
        content:
          "Aceite oportunidades da sua região, acompanhe sua agenda e atualize o andamento de cada faxina.",
      },
      { property: "og:title", content: "Minhas faxinas — Lar77" },
      {
        property: "og:description",
        content: "Aceite oportunidades, atualize o andamento do serviço e acompanhe sua nota.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AreaProfissional,
});

function AreaProfissional() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { aba } = Route.useSearch();
  const { user, carregando } = useSession();
  const { data: papeis } = usePapeis(user);

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/profissional/entrar", search: { next: undefined }, replace: true });
    }
  }, [carregando, user, navigate]);

  // Jornada travada: conta de cliente não acessa a área da profissional.
  useEffect(() => {
    if (!user || !papeis) return;
    if (!papeis.includes("profissional") && !papeis.includes("admin")) {
      navigate({ to: "/", replace: true });
    }
  }, [user, papeis, navigate]);

  const { data: perfil, isLoading } = useQuery({
    queryKey: ["meu-perfil-profissional", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("*, profiles!profissionais_user_id_fkey(nome, telefone, foto_url)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const semMapa = !!perfil && (perfil.latitude === null || perfil.longitude === null);

  const alternarDisponivel = useMutation({
    mutationFn: async (valor: boolean) => {
      if (valor && semMapa) {
        throw new Error("Preencha seu endereço no mapa (aba Conta) para ficar disponível.");
      }
      const { error } = await supabase
        .from("profissionais")
        .update({ disponivel: valor })
        .eq("id", perfil!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meu-perfil-profissional"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {(carregando || isLoading) && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && user && !perfil && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Cadastro da profissional</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete seus dados para começar a receber faxinas da sua região.
            </p>
            <div className="mt-6">
              <CadastroProfissional user={user} />
            </div>
          </>
        )}

        {!isLoading && perfil && (
          <>
            {/* Faixa de perfil enxuta: cabe numa tela de 390px sem empurrar as abas. */}
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <Avatar className="size-12 shrink-0 border border-border shadow-sm">
                  {perfil.profiles?.foto_url && (
                    <AvatarImage
                      src={perfil.profiles.foto_url}
                      alt={perfil.profiles?.nome ?? "Foto de perfil"}
                    />
                  )}
                  <AvatarFallback className="bg-surface-tint text-sm font-semibold text-primary">
                    {(perfil.profiles?.nome ?? "LAR")
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-foreground">
                    {tituloNome(perfil.profiles?.nome ?? "Profissional Lar77")}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {perfil.status === "aprovada" ? (
                      <Badge className="gap-1 text-[13px]">
                        <BadgeCheck className="size-3.5" /> Aprovada
                      </Badge>
                    ) : perfil.status === "recusada" ? (
                      <Badge variant="destructive" className="text-[13px]">
                        Recusada
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-2.5 py-1 text-[13px] font-semibold text-warning">
                        <Clock3 className="size-3.5" /> Em análise
                      </span>
                    )}
                    {perfil.verificada && (
                      <Badge variant="outline" className="text-[13px]">
                        Verificada
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0" />
                  {nomeRegiao(perfil.regiao)} · até {perfil.raio_km ?? "—"} km
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="size-4 shrink-0 fill-accent text-accent" />
                  {Number(perfil.nota_media).toFixed(1)} ({perfil.total_avaliacoes})
                </span>
              </div>

              <div className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-surface-tint px-3">
                <Label htmlFor="disponivel" className="text-[13px] font-semibold text-foreground">
                  Disponível para novos serviços
                </Label>
                <Switch
                  id="disponivel"
                  checked={perfil.disponivel}
                  disabled={semMapa && !perfil.disponivel}
                  onCheckedChange={(v) => alternarDisponivel.mutate(v)}
                />
              </div>
            </div>


            {semMapa && (
              <Link
                to="/profissional/conta"
                className="mt-3 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  Marque seu endereço no mapa na aba <strong>Conta</strong>. É por ele que a gente
                  calcula a distância das faxinas até você.
                </span>
              </Link>
            )}

            {perfil.status === "aprovada" ? (
              <ServicosProfissional
                profissionalId={perfil.id}
                nomeProfissional={perfil.profiles?.nome ?? "sua profissional"}
                userId={perfil.user_id}
                {...(aba ? { abaInicial: aba } : {})}
              />
            ) : (
              <EstadoVazio
                icon={Clock3}
                titulo="Cadastro em análise"
                texto="A equipe Lar77 está revisando seu perfil. Assim que for aprovado, as faxinas da sua região aparecem aqui para você aceitar."
              />
            )}

            <Link
              to="/profissional/conta"
              className="mt-6 flex min-h-14 items-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground"
            >
              <UserCog className="size-4 text-accent" />
              Meu perfil, documentos, PIX e dias de folga
            </Link>

            <PwaInstalar className="mt-6" />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
