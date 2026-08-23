import { useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Estrelas({
  valor,
  onChange,
  label,
}: {
  valor: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label}: ${n} estrelas`}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                n <= valor ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AvaliarDialog({
  bookingId,
  avaliadoId,
  avaliadorId,
  trigger,
}: {
  bookingId: string;
  avaliadoId: string;
  avaliadorId: string;
  /** Botão customizado. Se omitido, usa o botão padrão. */
  trigger?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [nota, setNota] = useState(5);
  const [pontualidade, setPontualidade] = useState(5);
  const [qualidade, setQualidade] = useState(5);
  const [cordialidade, setCordialidade] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const { error } = await supabase.from("avaliacoes").insert({
      booking_id: bookingId,
      avaliador_id: avaliadorId,
      avaliado_id: avaliadoId,
      nota,
      pontualidade,
      qualidade,
      cordialidade,
      comentario: comentario || null,
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível enviar a avaliação", { description: error.message });
      return;
    }
    toast.success("Avaliação enviada. Obrigada!");
    setAberto(false);
    queryClient.invalidateQueries({ queryKey: ["minhas-contratacoes"] });
    queryClient.invalidateQueries({ queryKey: ["avaliacao-booking", bookingId] });
    queryClient.invalidateQueries({ queryKey: ["reserva", bookingId] });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Avaliar serviço</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Como foi o serviço?</DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda outras pessoas a escolherem com segurança.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Estrelas label="Nota geral" valor={nota} onChange={setNota} />
          <Estrelas label="Pontualidade" valor={pontualidade} onChange={setPontualidade} />
          <Estrelas label="Qualidade da limpeza" valor={qualidade} onChange={setQualidade} />
          <Estrelas label="Cordialidade" valor={cordialidade} onChange={setCordialidade} />
          <div className="space-y-1">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={enviar} disabled={enviando}>
            Enviar avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
