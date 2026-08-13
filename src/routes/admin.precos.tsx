import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminPrecosQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/precos")({
  component: AdminPrecos,
});

const LABELS: Record<string, string> = {
  valor_hora_profissional: "Valor da hora da profissional (R$)",
  taxa_admin_percentual: "Taxa LAR10 (fração, ex.: 0,15)",
  valor_seguro: "Proteção por faxina (R$)",
  adicional_quarto: "Adicional por quarto (R$)",
  adicional_banheiro: "Adicional por banheiro (R$)",
  adicional_sala: "Adicional por sala (R$)",
  adicional_area_externa: "Adicional por área externa (R$)",
  multiplicador_pesada: "Multiplicador limpeza pesada",
  multiplicador_pos_obra: "Multiplicador pós-obra",
  multiplicador_pos_locacao: "Multiplicador pós-locação",
};

function AdminPrecos() {
  const queryClient = useQueryClient();
  const { data: precos } = useQuery(adminPrecosQuery);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (precos) {
      setValores(Object.fromEntries(precos.map((p) => [p.chave, String(p.valor)])));
    }
  }, [precos]);

  const salvar = useMutation({
    mutationFn: async () => {
      const linhas = Object.entries(valores).map(([chave, valor]) => ({
        chave,
        valor: Number(String(valor).replace(",", ".")),
      }));
      for (const linha of linhas) {
        if (!Number.isFinite(linha.valor)) throw new Error(`Valor inválido em ${linha.chave}`);
        const { error } = await supabase
          .from("pricing_config")
          .update({ valor: linha.valor })
          .eq("chave", linha.chave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Preços atualizados", { description: "O funil já usa os novos valores." });
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing_config"] });
      queryClient.invalidateQueries({ queryKey: ["pricing_config"] });
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
    onError: (erro) =>
      toast.error("Não foi possível salvar", {
        description: erro instanceof Error ? erro.message : undefined,
      }),
  });

  if (!precos) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TituloSecao
        titulo="Preços"
        texto="Alterar aqui muda o cálculo do funil imediatamente para todos os clientes."
      />
      <Painel className="max-w-2xl">
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
        >
          {precos.map((p) => (
            <div key={p.chave} className="space-y-1.5">
              <label htmlFor={p.chave} className="text-sm font-medium leading-snug">
                {LABELS[p.chave] ?? p.chave}
              </label>
              <Input
                id={p.chave}
                inputMode="decimal"
                value={valores[p.chave] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [p.chave]: e.target.value }))}
              />
              {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
            </div>
          ))}
          <Button type="submit" disabled={salvar.isPending} className="w-full sm:w-auto">
            {salvar.isPending ? "Salvando..." : "Salvar preços"}
          </Button>
        </form>
      </Painel>
    </>
  );
}
