import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  bookingId: string;
  userId: string;
  papel: "cliente" | "profissional";
  valorTotal: number;
  /** Chaves de query a invalidar depois do cancelamento. */
  invalidar: string[];
};

/** Cancelamento com motivo obrigatório — fica registrado para o admin. */
export function CancelarServico({ bookingId, userId, papel, valorTotal, invalidar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const queryClient = useQueryClient();

  const cancelar = useMutation({
    mutationFn: async () => {
      const texto = motivo.trim();
      if (texto.length < 5) throw new Error("Descreva o motivo do cancelamento.");

      const { error: erroRegistro } = await supabase.from("cancelamentos").insert({
        booking_id: bookingId,
        autor_id: userId,
        papel,
        motivo: texto.slice(0, 500),
        valor_total: valorTotal,
      });
      if (erroRegistro) throw erroRegistro;

      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelada" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço cancelado.", {
        description: "O cancelamento foi registrado para a equipe Lar77.",
      });
      setAberto(false);
      setMotivo("");
      invalidar.forEach((chave) => queryClient.invalidateQueries({ queryKey: [chave] }));
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-destructive">
          <XCircle className="size-4" /> Cancelar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar este serviço</DialogTitle>
          <DialogDescription>
            Conte o motivo do cancelamento. O registro fica disponível para a equipe Lar77.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-cancelamento">Motivo</Label>
          <Textarea
            id="motivo-cancelamento"
            rows={4}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: imprevisto na data, mudança de planos..."
          />
        </div>
        <Button
          variant="destructive"
          disabled={cancelar.isPending}
          onClick={() => cancelar.mutate()}
        >
          {cancelar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Confirmar cancelamento
        </Button>
      </DialogContent>
    </Dialog>
  );
}
