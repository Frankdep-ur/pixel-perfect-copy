import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormEndereco } from "@/components/enderecos/form-endereco";
import { enderecosQuery, resumoEndereco, type Endereco } from "@/lib/enderecos";

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

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {lista.map((e) =>
        editando?.id === e.id ? (
          <Card key={e.id}>
            <CardContent className="pt-6">
              <FormEndereco
                userId={userId}
                endereco={e}
                onSalvo={() => {
                  invalidar();
                  setEditando(null);
                }}
                onCancelar={() => setEditando(null)}
              />
            </CardContent>
          </Card>
        ) : (
          <Card key={e.id}>
            <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-primary" />
                  {e.apelido ?? "Meu imóvel"}
                  {e.padrao && <Badge variant="secondary">Principal</Badge>}
                </p>
                <p className="text-sm text-muted-foreground">{resumoEndereco(e)}</p>
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
        <Card>
          <CardContent className="pt-6">
            <FormEndereco
              userId={userId}
              onSalvo={() => {
                invalidar();
                setNovo(false);
              }}
              onCancelar={() => setNovo(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Button className="gap-2" onClick={() => setNovo(true)}>
          <Plus className="size-4" /> Cadastrar imóvel
        </Button>
      )}
    </div>
  );
}
