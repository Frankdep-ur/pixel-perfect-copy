import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type MensagemChat = {
  id: string;
  booking_id: string;
  autor_id: string;
  conteudo: string;
  criado_em: string;
};

function horaCurta(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useMensagens(bookingId: string, ativo: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["mensagens", bookingId],
    enabled: ativo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("id, booking_id, autor_id, conteudo, criado_em")
        .eq("booking_id", bookingId)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data as MensagemChat[];
    },
  });

  // A escuta fica sempre ligada: é ela que acende o balãozinho de nova mensagem.
  useEffect(() => {
    const canal = supabase
      .channel(`mensagens-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["mensagens", bookingId] });
          queryClient.invalidateQueries({ queryKey: ["nao-lidas-chat", bookingId] });
          queryClient.invalidateQueries({ queryKey: ["mensagens-nao-lidas"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [bookingId, queryClient]);

  return query;
}

/** Mensagens novas recebidas neste serviço (não contam as que o próprio usuário mandou). */
export function useNaoLidasChat(bookingId: string, userId: string) {
  return useQuery({
    queryKey: ["nao-lidas-chat", bookingId, userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("mensagens")
        .select("id", { count: "exact", head: true })
        .eq("booking_id", bookingId)
        .is("lida_em", null)
        .neq("autor_id", userId);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

type Props = {
  bookingId: string;
  userId: string;
  titulo: string;
  /** Nome de quem está do outro lado, só para orientar o usuário. */
  interlocutor: string;
};

/** Chat interno do serviço: substitui o contato por WhatsApp entre cliente e profissional. */
export function ChatServico({ bookingId, userId, titulo, interlocutor }: Props) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useMensagens(bookingId, aberto);
  const { data: naoLidas = 0 } = useNaoLidasChat(bookingId, userId);

  useEffect(() => {
    if (aberto) fim.current?.scrollIntoView({ block: "end" });
  }, [aberto, data]);

  // Abrir o chat marca como lidas as mensagens recebidas: o balãozinho apaga.
  useEffect(() => {
    if (!aberto || naoLidas === 0) return;
    void supabase.rpc("marcar_mensagens_lidas", { _booking_id: bookingId }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["nao-lidas-chat", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["mensagens-nao-lidas"] });
    });
  }, [aberto, naoLidas, bookingId, queryClient]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim().slice(0, 1000);
    if (!conteudo) return;
    setEnviando(true);
    const { error } = await supabase
      .from("mensagens")
      .insert({ booking_id: bookingId, autor_id: userId, conteudo });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível enviar a mensagem.");
      return;
    }
    setTexto("");
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <MessagesSquare className="size-4" /> Chat do serviço
          {naoLidas > 0 && (
            <span
              aria-label={`${naoLidas} mensagens não lidas`}
              className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-5 text-destructive-foreground"
            >
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Converse com {interlocutor} pelo chat interno da Lar77. Todo o combinado fica registrado
            na plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[46vh] space-y-2 overflow-y-auto rounded-xl bg-surface-tint p-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Diga um oi para combinar os detalhes.
            </p>
          )}
          {(data ?? []).map((m) => {
            const meu = m.autor_id === userId;
            return (
              <div key={m.id} className={meu ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    meu ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                  <span
                    className={`mt-1 block text-[11px] ${
                      meu ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {horaCurta(m.criado_em)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={fim} />
        </div>

        <form className="flex items-center gap-2" onSubmit={enviar}>
          <Input
            value={texto}
            maxLength={1000}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua mensagem"
            aria-label="Mensagem"
          />
          <Button type="submit" size="icon" disabled={enviando || !texto.trim()}>
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
