import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOMES_MES, diasDoMes, paraISO } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function BloqueiosProfissional({ profissionalId }: { profissionalId: string }) {
  const queryClient = useQueryClient();
  const hoje = new Date();
  const [mes, setMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });

  const { data: bloqueios, isLoading } = useQuery({
    queryKey: ["bloqueios", profissionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissional_bloqueios")
        .select("id, data, motivo")
        .eq("profissional_id", profissionalId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const alternar = useMutation({
    mutationFn: async (dataISO: string) => {
      const existente = (bloqueios ?? []).find((b) => b.data === dataISO);
      if (existente) {
        const { error } = await supabase
          .from("profissional_bloqueios")
          .delete()
          .eq("id", existente.id);
        if (error) throw error;
        return "liberado";
      }
      const { error } = await supabase
        .from("profissional_bloqueios")
        .insert({ profissional_id: profissionalId, data: dataISO });
      if (error) throw error;
      return "bloqueado";
    },
    onSuccess: (resultado) => {
      toast.success(resultado === "bloqueado" ? "Dia bloqueado." : "Dia liberado.");
      queryClient.invalidateQueries({ queryKey: ["bloqueios", profissionalId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const { vazios, dias } = diasDoMes(mes.ano, mes.mes);
  const bloqueados = new Set((bloqueios ?? []).map((b) => b.data));
  const hojeISO = paraISO(hoje);

  function mover(passo: number) {
    setMes((atual) => {
      const d = new Date(atual.ano, atual.mes + passo, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  }

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="size-5 text-primary" /> Minha indisponibilidade
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toque nos dias em que você não pode atender. Domingos já são bloqueados pela LAR10.
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => mover(-1)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-primary active:scale-[0.98]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="text-sm font-semibold capitalize">
            {NOMES_MES[mes.mes]} de {mes.ano}
          </span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => mover(1)}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-primary active:scale-[0.98]"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {SEMANA.map((d, i) => (
              <span
                key={`${d}-${i}`}
                className="pb-1 text-center text-xs font-semibold text-muted-foreground"
              >
                {d}
              </span>
            ))}
            {Array.from({ length: vazios }).map((_, i) => (
              <span key={`vazio-${i}`} />
            ))}
            {dias.map((dia) => {
              const indisponivel = bloqueados.has(dia.iso);
              const desabilitado = dia.domingo || dia.passado;
              return (
                <button
                  key={dia.iso}
                  type="button"
                  disabled={desabilitado || alternar.isPending}
                  onClick={() => alternar.mutate(dia.iso)}
                  className={cn(
                    "flex h-11 items-center justify-center rounded-xl border text-sm font-medium transition",
                    desabilitado && "border-transparent bg-muted/50 text-muted-foreground/60",
                    !desabilitado && indisponivel && "border-destructive bg-destructive/10 text-destructive",
                    !desabilitado &&
                      !indisponivel &&
                      "border-border hover:border-primary/50 active:scale-[0.98]",
                    dia.iso === hojeISO && "ring-2 ring-primary/30",
                  )}
                >
                  {dia.dia}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded border border-destructive bg-destructive/10" /> Você
            não atende
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-muted" /> Domingo ou data passada
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
