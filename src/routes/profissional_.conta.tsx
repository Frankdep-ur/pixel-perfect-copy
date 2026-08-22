import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PerfilProfissional } from "@/components/profissional/perfil-profissional";
import { DocumentosProfissional } from "@/components/profissional/documentos-profissional";
import { BloqueiosProfissional } from "@/components/profissional/bloqueios-profissional";
import { usePapeis, useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/profissional_/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Profissional Lar77" },
      {
        name: "description",
        content:
          "Atualize seu perfil, endereço no mapa, documentos, chave PIX e dias de folga na Lar77.",
      },
      { property: "og:title", content: "Minha conta — Profissional Lar77" },
      {
        property: "og:description",
        content: "Perfil, documentos, PIX e dias de folga da profissional Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContaProfissional,
});

function ContaProfissional() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const { data: papeis } = usePapeis(user);

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/profissional/entrar", search: { next: undefined }, replace: true });
    }
  }, [carregando, user, navigate]);

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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-5 md:pb-10">
        <Link
          to="/profissional"
          className="inline-flex min-h-12 items-center gap-2 text-[13px] font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Minhas faxinas
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold leading-tight tracking-tight">Minha conta</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Perfil, endereço no mapa, documentos, chave PIX e dias de folga.
        </p>

        {(carregando || isLoading) && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && perfil && (
          <div className="mt-2">
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

            {/* Documentos e folgas também recolhidos: a tela não pode ser um formulário sem fim. */}
            <Accordion type="multiple" className="mt-3 rounded-2xl border border-border bg-card px-4">
              <AccordionItem value="documentos" className="border-b-0">
                <AccordionTrigger className="min-h-12 text-[15px] font-semibold">
                  Documentos
                </AccordionTrigger>
                <AccordionContent>
                  <DocumentosProfissional
                    profissionalId={perfil.id}
                    userId={perfil.user_id}
                    docIdentidade={perfil.doc_identidade_url ?? null}
                    docCpf={perfil.doc_cpf_url ?? null}
                    comprovante={perfil.comprovante_url ?? null}
                    telefoneRecado={perfil.telefone_recado ?? null}
                    docTipo={perfil.doc_tipo ?? null}
                  />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="folgas" className="border-b-0">
                <AccordionTrigger className="min-h-12 text-[15px] font-semibold">
                  Folgas
                </AccordionTrigger>
                <AccordionContent>
                  <BloqueiosProfissional profissionalId={perfil.id} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
