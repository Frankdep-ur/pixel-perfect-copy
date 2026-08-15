import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MAX_SLIDES, slidesAdminQuery, type Slide } from "@/lib/home-slides";

export const Route = createFileRoute("/admin/carrossel")({
  component: AdminCarrossel,
});

const DEZ_ANOS = 60 * 60 * 24 * 365 * 10;

function AdminCarrossel() {
  const queryClient = useQueryClient();
  const { data: slides, isLoading } = useQuery(slidesAdminQuery);
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const lista = slides ?? [];

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["admin", "home_slides"] });
    queryClient.invalidateQueries({ queryKey: ["home_slides"] });
  }

  const salvar = useMutation({
    mutationFn: async ({ id, campos }: { id: string; campos: Partial<Slide> }) => {
      const { error } = await supabase.from("home_slides").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (erro: Error) => toast.error(erro.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Imagem removida do carrossel.");
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  async function enviar(arquivo: File) {
    if (lista.length >= MAX_SLIDES) {
      toast.error(`O carrossel aceita no máximo ${MAX_SLIDES} imagens.`);
      return;
    }
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha uma imagem (JPG, PNG ou WebP).");
      return;
    }
    if (arquivo.size > 8 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 8 MB.");
      return;
    }

    setEnviando(true);
    try {
      const ext = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
      const caminho = `carrossel/${Date.now()}.${ext}`;
      const { error: erroUpload } = await supabase.storage
        .from("site")
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
      if (erroUpload) throw erroUpload;

      const { data, error: erroUrl } = await supabase.storage
        .from("site")
        .createSignedUrl(caminho, DEZ_ANOS);
      if (erroUrl) throw erroUrl;

      const proximaOrdem = (lista.at(-1)?.ordem ?? 0) + 1;
      const { error } = await supabase.from("home_slides").insert({
        imagem_url: data.signedUrl,
        ordem: proximaOrdem,
        ativo: true,
      });
      if (error) throw error;

      toast.success("Imagem adicionada ao carrossel.");
      invalidar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  async function mover(indice: number, direcao: -1 | 1) {
    const atual = lista[indice];
    const vizinho = lista[indice + direcao];
    if (!atual || !vizinho) return;
    await Promise.all([
      salvar.mutateAsync({ id: atual.id, campos: { ordem: vizinho.ordem } }),
      salvar.mutateAsync({ id: vizinho.id, campos: { ordem: atual.ordem } }),
    ]);
  }

  return (
    <div>
      <TituloSecao
        titulo="Carrossel da home"
        texto={`Até ${MAX_SLIDES} imagens exibidas na área principal do site.`}
      />

      <Painel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {lista.length} de {MAX_SLIDES} imagens cadastradas
          </p>
          <Button
            type="button"
            className="gap-2"
            disabled={enviando || lista.length >= MAX_SLIDES}
            onClick={() => input.current?.click()}
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            Adicionar imagem
          </Button>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) void enviar(arquivo);
            }}
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && lista.length === 0 && (
          <p className="rounded-xl bg-surface-tint px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma imagem cadastrada. A home usa as imagens padrão até você enviar as suas.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {lista.map((slide, i) => (
            <div
              key={slide.id}
              className="grid gap-4 rounded-2xl border border-border p-4 md:grid-cols-[180px_1fr]"
            >
              <img
                src={slide.imagem_url}
                alt={slide.titulo ?? "Imagem do carrossel"}
                className="h-32 w-full rounded-xl object-cover"
              />
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`titulo-${slide.id}`}>Título</Label>
                    <Input
                      id={`titulo-${slide.id}`}
                      defaultValue={slide.titulo ?? ""}
                      onBlur={(e) =>
                        salvar.mutate({
                          id: slide.id,
                          campos: { titulo: e.target.value || null },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`legenda-${slide.id}`}>Legenda</Label>
                    <Input
                      id={`legenda-${slide.id}`}
                      defaultValue={slide.legenda ?? ""}
                      onBlur={(e) =>
                        salvar.mutate({
                          id: slide.id,
                          campos: { legenda: e.target.value || null },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={slide.ativo}
                      onCheckedChange={(ativo) =>
                        salvar.mutate({ id: slide.id, campos: { ativo } })
                      }
                    />
                    Visível na home
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={i === 0}
                    onClick={() => void mover(i, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={i === lista.length - 1}
                    onClick={() => void mover(i, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => remover.mutate(slide.id)}
                  >
                    <Trash2 className="mr-1.5 size-4" /> Remover
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Painel>
    </div>
  );
}
