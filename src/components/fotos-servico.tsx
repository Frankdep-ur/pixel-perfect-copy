import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  enviarFotoServico,
  fotosServicoQueryKey,
  listarFotosServico,
  removerFotoServico,
  type FotoServico,
} from "@/lib/fotos-servico";

export function useFotosServico(bookingId: string, ativo = true) {
  return useQuery({
    queryKey: fotosServicoQueryKey(bookingId),
    enabled: ativo,
    queryFn: () => listarFotosServico(bookingId),
  });
}

function Galeria({ fotos, onRemover }: { fotos: FotoServico[]; onRemover?: (f: FotoServico) => void }) {
  const [aberta, setAberta] = useState<FotoServico | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {fotos.map((f) => (
          <div key={f.id} className="relative">
            <button
              type="button"
              onClick={() => setAberta(f)}
              className="block w-full overflow-hidden rounded-xl border border-border"
            >
              <img
                src={f.url}
                alt="Foto do imóvel após a limpeza"
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
            {onRemover && (
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() => onRemover(f)}
                className="absolute right-1 top-1 rounded-full bg-background/85 p-1.5 text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!aberta} onOpenChange={(v) => !v && setAberta(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Foto da limpeza</DialogTitle>
            <DialogDescription>
              Registro enviado pela profissional após finalizar o serviço.
            </DialogDescription>
          </DialogHeader>
          {aberta && (
            <img
              src={aberta.url}
              alt="Foto do imóvel após a limpeza"
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Envio das fotos pela profissional (obrigatório no Airbnb). */
export function FotosServicoProfissional({
  bookingId,
  userId,
  minimo,
}: {
  bookingId: string;
  userId: string;
  minimo: number;
}) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const { data: fotos = [], isLoading } = useFotosServico(bookingId);

  const enviar = useMutation({
    mutationFn: async (arquivos: File[]) => {
      for (const arquivo of arquivos) {
        await enviarFotoServico(bookingId, userId, arquivo);
      }
    },
    onSuccess: () => {
      toast.success("Fotos enviadas!");
      queryClient.invalidateQueries({ queryKey: fotosServicoQueryKey(bookingId) });
    },
    onError: (e: Error) => toast.error("Não conseguimos enviar as fotos", { description: e.message }),
  });

  const remover = useMutation({
    mutationFn: (foto: FotoServico) => removerFotoServico(foto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fotosServicoQueryKey(bookingId) }),
    onError: (e: Error) => toast.error(e.message),
  });

  const faltam = Math.max(0, minimo - fotos.length);

  return (
    <div className="space-y-3 rounded-2xl border border-accent/40 bg-surface-tint p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Camera className="size-4 text-accent" /> Fotos do imóvel após a limpeza
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {faltam > 0
            ? `Envie pelo menos ${minimo} fotos (faltam ${faltam}). O cliente do Airbnb precisa da comprovação visual.`
            : "Fotos suficientes enviadas. Você já pode finalizar a faxina."}
        </p>
      </div>

      {isLoading && <Loader2 className="size-4 animate-spin text-accent" />}
      {fotos.length > 0 && <Galeria fotos={fotos} onRemover={(f) => remover.mutate(f)} />}

      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? []);
          if (arquivos.length > 0) enviar.mutate(arquivos);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={enviar.isPending}
        onClick={() => input.current?.click()}
      >
        {enviar.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Camera className="size-4" />
        )}
        Tirar / escolher fotos
      </Button>
    </div>
  );
}

/** Galeria que o cliente vê depois do serviço. */
export function FotosServicoCliente({ bookingId }: { bookingId: string }) {
  const { data: fotos = [], isLoading } = useFotosServico(bookingId);

  if (isLoading) {
    return <Loader2 className="size-4 animate-spin text-accent" />;
  }

  return (
    <div className="space-y-3 rounded-2xl bg-surface-tint p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ImageIcon className="size-4 text-accent" /> Fotos da limpeza
      </p>
      {fotos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          A profissional envia as fotos do imóvel ao finalizar o serviço. Elas aparecem aqui.
        </p>
      ) : (
        <Galeria fotos={fotos} />
      )}
    </div>
  );
}
