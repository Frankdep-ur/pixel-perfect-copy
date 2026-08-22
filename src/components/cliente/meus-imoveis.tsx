import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormEndereco } from "@/components/enderecos/form-endereco";
import { enderecosQuery, resumoEndereco, type Endereco } from "@/lib/enderecos";
import { labelTipoImovel } from "@/lib/catalogo";

export function MeusImoveis({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: enderecos, isLoading } = useQuery(enderecosQuery(userId));
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Endereco | null>(null);

  const lista = enderecos ?? [];

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["enderecos"] });
  }

  const definirPadrao = useMutation({
    mutationFn: async (id: string) => {
      const { error: erroLimpa } = await supabase
        .from("enderecos")
        .update({ padrao: false })
        .eq("user_id", userId);
      if (erroLimpa) throw erroLimpa;
      const { error } = await supabase.from("enderecos").update({ padrao: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Imóvel principal atualizado.");
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("enderecos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Imóvel removido.");
      invalidar();
    },
    onError: () =>
      toast.error("Não foi possível remover", {
        description: "Imóveis usados em contratações ficam salvos no histórico.",
      }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lista.map((e) =>
        editando?.id === e.id ? (
          <div key={e.id} className="rounded-[24px] border border-border bg-card p-4">
            <FormEndereco
              userId={userId}
              endereco={e}
              onSalvo={() => {
                invalidar();
                setEditando(null);
              }}
              onCancelar={() => setEditando(null)}
            />
          </div>
        ) : (
          <Card key={e.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-primary" />
                  {e.apelido ?? "Meu imóvel"}
                  {e.padrao && <Badge variant="secondary">Principal</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {e.tipo_imovel ? `${labelTipoImovel(e.tipo_imovel)} · ` : ""}
                  {resumoEndereco(e)}
                </p>
                {e.complemento && (
                  <p className="text-sm text-muted-foreground">{e.complemento}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!e.padrao && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => definirPadrao.mutate(e.id)}
                  >
                    <Star className="size-4" /> Tornar principal
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditando(e)}
                >
                  <Pencil className="size-4" /> Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive"
                  onClick={() => excluir.mutate(e.id)}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ),
      )}

      {novo ? (
        <div className="rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <FormEndereco
            userId={userId}
            onSalvo={() => {
              invalidar();
              setNovo(false);
            }}
            onCancelar={() => setNovo(false)}
          />
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-[28px] border border-border bg-card px-5 py-10 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Home className="size-7" strokeWidth={1.5} />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">Nenhum imóvel ainda</h3>
          <p className="mx-auto mt-1 max-w-[32ch] text-sm text-muted-foreground">
            Pode usar o app agora. O tipo e o endereço a gente pede na hora de contratar — ou
            cadastra aqui, se preferir.
          </p>
          <Button className="mt-5 min-h-12 gap-2 rounded-2xl px-6" onClick={() => setNovo(true)}>
            <Plus className="size-4" /> Cadastrar imóvel
          </Button>
        </div>
      ) : (
        <Button className="min-h-12 w-full gap-2 rounded-2xl" onClick={() => setNovo(true)}>
          <Plus className="size-4" /> Cadastrar outro imóvel
        </Button>
      )}
    </div>
  );
}
