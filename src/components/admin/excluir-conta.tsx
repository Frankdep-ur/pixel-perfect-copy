import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const MANTER = ["frank@gmail.com", "alexandre@gmail.com", "admin@lar10.app"];

export function BotaoExcluirConta({
  userId,
  nome,
  onExcluido,
}: {
  userId: string;
  nome: string;
  onExcluido?: () => void;
}) {
  const queryClient = useQueryClient();
  const [pedindo, setPedindo] = useState(false);

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_excluir_usuario", { alvo: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Conta de ${nome} removida.`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      onExcluido?.();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (!pedindo) {
    return (
      <Button type="button" variant="destructive" onClick={() => setPedindo(true)}>
        <Trash2 className="size-4" /> Excluir conta
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
      <p className="text-sm">
        Apaga <strong>{nome}</strong> de vez: login, perfil, faxinas e mensagens. Não dá para
        desfazer.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={excluir.isPending}
          onClick={() => excluir.mutate()}
        >
          {excluir.isPending ? <Loader2 className="size-4 animate-spin" /> : "Confirmar exclusão"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setPedindo(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function LimparContasTeste() {
  const queryClient = useQueryClient();
  const [frase, setFrase] = useState("");

  const limpar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_limpar_contas_exceto", {
        manter: MANTER,
      });
      if (error) throw error;
      return data as { removidos?: number; emails?: string[] };
    },
    onSuccess: (data) => {
      setFrase("");
      toast.success(`Removidas ${data?.removidos ?? 0} contas de teste.`);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <section className="mt-10 space-y-3 rounded-2xl border border-destructive/30 bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Limpar contas de teste</h2>
      <p className="text-sm text-muted-foreground">
        Remove todo mundo que não for cliente <strong>frank@gmail.com</strong>, profissional{" "}
        <strong>alexandre@gmail.com</strong> ou o admin. Demo, seed e cadastros de prova somem —
        incluindo faxinas ligadas a eles.
      </p>
      <p className="text-xs text-muted-foreground">
        Digite <code>EXCLUIR</code> para habilitar.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={frase}
          onChange={(e) => setFrase(e.target.value)}
          placeholder="EXCLUIR"
          className="min-h-11 w-40 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <Button
          type="button"
          variant="destructive"
          disabled={frase.trim().toUpperCase() !== "EXCLUIR" || limpar.isPending}
          onClick={() => limpar.mutate()}
        >
          {limpar.isPending ? <Loader2 className="size-4 animate-spin" /> : "Limpar agora"}
        </Button>
      </div>
    </section>
  );
}
