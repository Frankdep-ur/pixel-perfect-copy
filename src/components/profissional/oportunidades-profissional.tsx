import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Clock, MapPin, Megaphone, Timer, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useContagem } from "@/hooks/use-contagem";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { formatarData } from "@/lib/agenda";
import {
  formatarContagem,
  listarConvitesProfissional,
  responderConvite,
  type ConviteProfissional,
} from "@/lib/orquestra";

const LABEL_STATUS: Record<string, string> = {
  enviado: "Aguardando sua resposta",
  aceito: "Aceito — aguardando a escolha do cliente",
  indisponivel: "Você marcou indisponível",
  expirado: "Prazo encerrado",
  encerrado: "Cliente escolheu outra profissional",
};

export function OportunidadesProfissional({ profissionalId }: { profissionalId: string }) {
  const queryClient = useQueryClient();
  const chave = ["convites-profissional", profissionalId];

  const { data: convites = [] } = useQuery({
    queryKey: chave,
    refetchInterval: 5000,
    queryFn: () => listarConvitesProfissional(profissionalId),
  });

  useEffect(() => {
    const canal = supabase
      .channel(`convites-prof-${profissionalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "booking_convites",
          filter: `profissional_id=eq.${profissionalId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: chave }),
      )
      .subscribe();
    return () => void supabase.removeChannel(canal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalId, queryClient]);

  const responder = useMutation({
    mutationFn: ({ id, aceitar }: { id: string; aceitar: boolean }) => responderConvite(id, aceitar),
    onSuccess: (status) => {
      if (status === "aceito") {
        toast.success("Oportunidade aceita!", {
          description: "Agora o cliente vê seu perfil e pode te escolher.",
        });
      } else if (status === "expirado") {
        toast.error("O prazo dessa oportunidade encerrou.");
      } else {
        toast.success("Ok, essa você não vai atender.");
      }
      void queryClient.invalidateQueries({ queryKey: chave });
      void queryClient.invalidateQueries({ queryKey: ["servicos-profissional", profissionalId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const abertos = convites.filter((c) => c.status === "enviado");
  const historico = convites.filter((c) => c.status !== "enviado").slice(0, 10);

  return (
    <div className="space-y-4">
      {abertos.length === 0 && (
        <EstadoVazio
          icon={Megaphone}
          titulo="Nenhuma oportunidade agora"
          texto="Quando surgir uma faxina na sua região, avisamos por WhatsApp e ela aparece aqui para você aceitar."
        />
      )}

      {abertos.map((c) => (
        <CartaoConvite
          key={c.id}
          convite={c}
          pendente={responder.isPending}
          onResponder={(aceitar) => responder.mutate({ id: c.id, aceitar })}
        />
      ))}

      {historico.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-muted-foreground">Últimas oportunidades</p>
          {historico.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">
                {labelTipoLimpeza(c.bookings?.tipo_limpeza ?? "")} ·{" "}
                {formatarData(c.bookings?.data ?? null)}
              </span>
              <Badge variant="secondary" className="ml-auto">
                {LABEL_STATUS[c.status] ?? c.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CartaoConvite({
  convite,
  onResponder,
  pendente,
}: {
  convite: ConviteProfissional;
  onResponder: (aceitar: boolean) => void;
  pendente: boolean;
}) {
  const restante = useContagem(convite.expira_em);
  const b = convite.bookings;
  const end = b?.enderecos;
  const expirado = restante <= 0;

  return (
    <Card className="border-2 border-primary/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <Megaphone className="size-3" /> Nova oportunidade
          </Badge>
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
            <Timer className="size-4" />
            {expirado ? "Prazo encerrado" : formatarContagem(restante)}
          </span>
        </div>

        <div className="space-y-2">
          <p className="font-medium">{labelTipoLimpeza(b?.tipo_limpeza ?? "")}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatarData(b?.data ?? null)}
              {b?.hora ? ` · ${b.hora.slice(0, 5)}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {b?.duracao_horas ?? 0}h
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {[end?.bairro, end?.cidade].filter(Boolean).join(", ") || "Sua região"}
            </span>
          </div>
          <p className="text-lg font-semibold">
            Você recebe {formatBRL(Number(b?.valor_profissional ?? 0))}
          </p>
          <p className="text-xs text-muted-foreground">
            Endereço completo e contato do cliente liberados se o cliente te escolher.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1 gap-2"
            size="lg"
            disabled={pendente || expirado}
            onClick={() => onResponder(true)}
          >
            <Check className="size-4" /> Aceitar
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
            disabled={pendente || expirado}
            onClick={() => onResponder(false)}
          >
            <X className="size-4" /> Indisponível
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
