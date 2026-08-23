import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  dataMinimaAgendamento,
  ehDomingo,
  horariosPermitidos,
  type Duracao,
} from "@/lib/agenda";

type Props = {
  bookingId: string;
  dataAtual: string | null | undefined;
  horaAtual: string | null | undefined;
  duracaoHoras: number | null | undefined;
  disabled?: boolean;
  onBloqueado?: () => void;
};

export function EditarReserva({
  bookingId,
  dataAtual,
  horaAtual,
  duracaoHoras,
  disabled,
  onBloqueado,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(dataAtual?.slice(0, 10) ?? "");
  const [hora, setHora] = useState((horaAtual ?? "").slice(0, 5));
  const queryClient = useQueryClient();
  const minData = dataMinimaAgendamento();
  const duracao = (duracaoHoras === 4 || duracaoHoras === 6 || duracaoHoras === 8
    ? duracaoHoras
    : 6) as Duracao;
  const horarios = horariosPermitidos(duracao);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!data || !hora) throw new Error("Informe data e horário.");
      if (ehDomingo(data)) throw new Error("Não atendemos aos domingos.");
      if (data < minData) throw new Error("Agende com pelo menos 24 horas de antecedência.");
      if (!horarios.includes(hora)) throw new Error("Horário não disponível para essa duração.");

      const { error } = await supabase
        .from("bookings")
        .update({ data, hora: `${hora}:00` })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva atualizada.");
      setAberto(false);
      queryClient.invalidateQueries({ queryKey: ["reserva", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["minhas-reservas"] });
      queryClient.invalidateQueries({ queryKey: ["proxima-reserva"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Não foi possível alterar a reserva.");
    },
  });

  function abrir() {
    if (disabled) {
      onBloqueado?.();
      return;
    }
    setData(dataAtual?.slice(0, 10) ?? "");
    setHora((horaAtual ?? "").slice(0, 5));
    setAberto(true);
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            abrir();
          }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-accent px-3 text-[12px] font-semibold text-accent"
        >
          <Pencil size={14} strokeWidth={1.7} aria-hidden />
          Editar
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar data e horário</DialogTitle>
          <DialogDescription>
            Só é possível alterar antes da profissional iniciar o deslocamento. Sem domingos e com
            24h de antecedência.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-data">Nova data</Label>
            <input
              id="edit-data"
              type="date"
              min={minData}
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-[14px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Novo horário</Label>
            <div className="flex flex-wrap gap-2">
              {horarios.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHora(h)}
                  className={`h-10 min-w-[4.5rem] rounded-xl border px-3 text-[13px] font-semibold transition-colors ${
                    hora === h
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-card text-foreground"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            {salvar.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Salvando…
              </>
            ) : (
              "Salvar alteração"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
