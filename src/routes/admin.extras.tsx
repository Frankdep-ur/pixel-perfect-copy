import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminExtrasQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/catalogo";

export const Route = createFileRoute("/admin/extras")({
  component: AdminExtras,
});

type Formulario = {
  id?: string;
  nome: string;
  descricao: string;
  preco: string;
  minutos_adicionais: string;
  ativo: boolean;
};

const VAZIO: Formulario = {
  nome: "",
  descricao: "",
  preco: "0",
  minutos_adicionais: "0",
  ativo: true,
};

function AdminExtras() {
  const queryClient = useQueryClient();
  const { data: extras } = useQuery(adminExtrasQuery);
  const [form, setForm] = useState<Formulario | null>(null);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "extras"] });
    queryClient.invalidateQueries({ queryKey: ["extras"] });
  };

  const salvar = useMutation({
    mutationFn: async (dados: Formulario) => {
      const payload = {
        nome: dados.nome.trim(),
        descricao: dados.descricao.trim() || null,
        preco: Number(dados.preco.replace(",", ".")),
        minutos_adicionais: Number(dados.minutos_adicionais),
        ativo: dados.ativo,
      };
      if (!payload.nome) throw new Error("Informe o nome do extra");
      const { error } = dados.id
        ? await supabase.from("extras").update(payload).eq("id", dados.id)
        : await supabase.from("extras").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Extra salvo");
      invalidar();
      setForm(null);
    },
    onError: (erro) =>
      toast.error("Não foi possível salvar", {
        description: erro instanceof Error ? erro.message : undefined,
      }),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Extra removido");
      invalidar();
    },
    onError: () =>
      toast.error("Não foi possível remover", {
        description: "O extra pode estar em uso em contratações. Desative-o em vez de excluir.",
      }),
  });

  const alternar = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("extras").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidar,
  });

  if (!extras) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <TituloSecao titulo="Extras" texto="Serviços adicionais oferecidos no funil." />
        <Button onClick={() => setForm({ ...VAZIO })}>
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Novo extra
        </Button>
      </div>

      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Minutos</th>
                <th className="px-5 py-3 font-medium">Ativo</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {extras.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/60">
                  <td className="px-5 py-3">
                    <p className="font-medium leading-snug">{e.nome}</p>
                    {e.descricao && (
                      <p className="text-xs text-muted-foreground">{e.descricao}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">{formatBRL(e.preco)}</td>
                  <td className="px-5 py-3">{e.minutos_adicionais} min</td>
                  <td className="px-5 py-3">
                    <Switch
                      checked={e.ativo}
                      aria-label={`Ativar ${e.nome}`}
                      onCheckedChange={(ativo) => alternar.mutate({ id: e.id, ativo })}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${e.nome}`}
                        onClick={() =>
                          setForm({
                            id: e.id,
                            nome: e.nome,
                            descricao: e.descricao ?? "",
                            preco: String(e.preco),
                            minutos_adicionais: String(e.minutos_adicionais),
                            ativo: e.ativo,
                          })
                        }
                      >
                        <Pencil className="size-4" strokeWidth={1.5} aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${e.nome}`}
                        onClick={() => remover.mutate(e.id)}
                      >
                        <Trash2 className="size-4 text-destructive" strokeWidth={1.5} aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>

      <Dialog open={!!form} onOpenChange={(aberto) => !aberto && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Editar extra" : "Novo extra"}</DialogTitle>
          </DialogHeader>
          {form && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                salvar.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="nome" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </label>
                <Input
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="preco" className="text-sm font-medium">
                    Preço (R$)
                  </label>
                  <Input
                    id="preco"
                    inputMode="decimal"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="minutos" className="text-sm font-medium">
                    Minutos
                  </label>
                  <Input
                    id="minutos"
                    inputMode="numeric"
                    value={form.minutos_adicionais}
                    onChange={(e) => setForm({ ...form, minutos_adicionais: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(ativo) => setForm({ ...form, ativo })}
                />
                <label htmlFor="ativo" className="text-sm font-medium">
                  Ativo no funil
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={salvar.isPending}>
                  {salvar.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
