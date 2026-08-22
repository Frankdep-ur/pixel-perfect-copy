import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Clock3, Loader2, MapPin, Star } from "lucide-react";
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
import { PerfilProfissional } from "@/components/profissional/perfil-profissional";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EstadoVazio } from "@/components/estado-vazio";
import { ServicosProfissional } from "@/components/profissional/servicos-profissional";
import { DocumentosProfissional } from "@/components/profissional/documentos-profissional";
import { BloqueiosProfissional } from "@/components/profissional/bloqueios-profissional";

import { nomeRegiao } from "@/lib/regioes";
import { usePapeis, useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/profissional")({
  head: () => ({
    meta: [
      { title: "Área da profissional — Lar77" },
      {
        name: "description",
        content:
          "Gerencie seus serviços de limpeza, aceite solicitações e acompanhe seus ganhos no Lar77.",
      },
      { property: "og:title", content: "Área da profissional — Lar77" },
      {
        property: "og:description",
        content: "Aceite solicitações, atualize o andamento do serviço e acompanhe sua nota.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AreaProfissional,
});

function AreaProfissional() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const alternarDisponivel = useMutation({
    mutationFn: async (valor: boolean) => {
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Área da profissional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Receba solicitações da sua região e atualize o andamento de cada limpeza.
        </p>

        {(carregando || isLoading) && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && user && !perfil && (
          <div className="mt-8">
            <CadastroProfissional user={user} />
          </div>
        )}

        {!isLoading && perfil && (
          <>
            <PwaInstalar className="mt-8" />
            <Card className="mt-8 overflow-hidden">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <Avatar className="size-20 shrink-0 border border-border shadow-sm">
                  {perfil.profiles?.foto_url && (
                    <AvatarImage
                      src={perfil.profiles.foto_url}
                      alt={perfil.profiles?.nome ?? "Foto de perfil"}
                    />
                  )}
                  <AvatarFallback className="bg-surface-tint text-base font-semibold text-primary">
                    {(perfil.profiles?.nome ?? "LAR")
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {perfil.profiles?.nome ?? "Profissional Lar77"}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {perfil.status === "aprovada" ? (
                      <Badge className="gap-1">
                        <BadgeCheck className="size-3.5" /> Perfil aprovado
                      </Badge>
                    ) : perfil.status === "recusada" ? (
                      <Badge variant="destructive">Cadastro recusado</Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-3 py-1 text-xs font-semibold text-warning">
                        <Clock3 className="size-3.5" /> Em análise
                      </span>
                    )}
                    {perfil.verificada && <Badge variant="outline">Verificada</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      {nomeRegiao(perfil.regiao)} · até {perfil.raio_km ?? "—"} km
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="size-4 fill-accent text-accent" />
                      {Number(perfil.nota_media).toFixed(1)} ({perfil.total_avaliacoes} avaliações)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-surface-tint p-5">
              <Label htmlFor="disponivel" className="text-sm font-semibold text-foreground">
                Disponível para novos serviços
              </Label>
              <Switch
                id="disponivel"
                checked={perfil.disponivel}
                onCheckedChange={(v) => alternarDisponivel.mutate(v)}
              />
            </div>

            {perfil.status === "aprovada" ? (
              <ServicosProfissional
                profissionalId={perfil.id}
                nomeProfissional={perfil.profiles?.nome ?? "sua profissional"}
                userId={perfil.user_id}
              />
            ) : (
              <EstadoVazio
                icon={Clock3}
                titulo="Cadastro em análise"
                texto="A equipe Lar77 revisa seu perfil no painel administrativo (Admin → Profissionais). Assim que for aprovado, as solicitações da sua região aparecem aqui."
              />
            )}

            <PerfilProfissional
              perfil={{
                id: perfil.id,
                user_id: perfil.user_id,
                bio: perfil.bio,
                anos_experiencia: perfil.anos_experiencia,
                raio_km: perfil.raio_km,
                regiao: perfil.regiao,
                cidade: perfil.cidade,
                cidades_atendidas: perfil.cidades_atendidas ?? [],
                tipos_limpeza: perfil.tipos_limpeza ?? [],
                nome: perfil.profiles?.nome ?? null,
                telefone: perfil.profiles?.telefone ?? null,
                foto_url: perfil.profiles?.foto_url ?? null,
                pix_tipo: perfil.pix_tipo ?? null,
                pix_chave: perfil.pix_chave ?? null,
                pix_titular: perfil.pix_titular ?? null,
              }}
            />

            <DocumentosProfissional
              profissionalId={perfil.id}
              userId={perfil.user_id}
              docIdentidade={perfil.doc_identidade_url ?? null}
              docCpf={perfil.doc_cpf_url ?? null}
              comprovante={perfil.comprovante_url ?? null}
              telefoneRecado={perfil.telefone_recado ?? null}
              docTipo={perfil.doc_tipo ?? null}
            />

            <BloqueiosProfissional profissionalId={perfil.id} />


          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
