import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarDays, Clock, Inbox, Loader2, MapPin, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EstadoVazio } from "@/components/estado-vazio";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_LABEL, formatBRL, labelTipoImovel, labelTipoLimpeza } from "@/lib/catalogo";

type Props = { profissionalId: string; regiao: string | null };

const ABERTOS = ["solicitada", "aceita", "confirmada", "a_caminho", "em_andamento"];

type BookingProf = {
  id: string;
  codigo: string | null;
  status: string;
  data: string | null;
  hora: string | null;
  tipo_imovel: string | null;
  tipo_limpeza: string;
  duracao_horas: number;
  observacoes: string | null;
  valor_profissional: number;
  profissional_id: string | null;
  enderecos: {
    rua: string | null;
    numero: string | null;
    bairro: string | null;
    cidade: string | null;
  } | null;
};

const PROXIMO: Record<string, { status: string; label: string; campo?: string }> = {
  solicitada: { status: "aceita", label: "Aceitar serviço" },
  aceita: { status: "confirmada", label: "Confirmar agendamento" },
  confirmada: { status: "a_caminho", label: "Estou a caminho" },
  a_caminho: { status: "em_andamento", label: "Iniciar limpeza", campo: "iniciado_em" },
  em_andamento: { status: "finalizada", label: "Finalizar limpeza", campo: "finalizado_em" },
};

export function ServicosProfissional({ profissionalId, regiao }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["servicos-profissional", profissionalId],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          "id, codigo, status, data, hora, tipo_imovel, tipo_limpeza, duracao_horas, observacoes, valor_profissional, profissional_id, enderecos(rua, numero, bairro, cidade)",
        )
        .order("data", { ascending: true });
      if (error) throw error;
      return bookings as BookingProf[];
    },
  });

  const avancar = useMutation({
    mutationFn: async (booking: BookingProf) => {
      const passo = PROXIMO[booking.status];
      if (!passo) return;
      const agora = new Date().toISOString();
      const payload = {
        status: passo.status,
        profissional_id: profissionalId,
        ...(passo.campo === "iniciado_em" ? { iniciado_em: agora } : {}),
        ...(passo.campo === "finalizado_em" ? { finalizado_em: agora } : {}),
        ...(passo.status === "a_caminho" ? { checkin_em: agora } : {}),
      };
      const { error } = await supabase.from("bookings").update(payload).eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      queryClient.invalidateQueries({ queryKey: ["servicos-profissional", profissionalId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const lista = data ?? [];
  const oportunidades = lista.filter((b) => b.status === "solicitada" && !b.profissional_id);
  const meus = lista.filter(
    (b) => b.profissional_id === profissionalId && ABERTOS.includes(b.status),
  );
  const concluidos = lista.filter(
    (b) => b.profissional_id === profissionalId && !ABERTOS.includes(b.status),
  );

  return (
    <Tabs defaultValue="oportunidades" className="mt-8">
      <TabsList>
        <TabsTrigger value="oportunidades">Oportunidades ({oportunidades.length})</TabsTrigger>
        <TabsTrigger value="agenda">Minha agenda ({meus.length})</TabsTrigger>
        <TabsTrigger value="historico">Histórico ({concluidos.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="oportunidades" className="mt-6 space-y-4">
        {oportunidades.length === 0 && (
          <Vazio
            icon={Inbox}
            titulo="Nenhuma oportunidade agora"
            texto="Assim que surgir uma solicitação na sua região, ela aparece aqui."
          />
        )}
        {oportunidades.map((b) => (
          <Cartao key={b.id} booking={b} onAvancar={() => avancar.mutate(b)} pendente={avancar.isPending} />
        ))}
      </TabsContent>

      <TabsContent value="agenda" className="mt-6 space-y-4">
        {meus.length === 0 && <Vazio
            icon={CalendarCheck}
            titulo="Agenda livre"
            texto="Aceite uma solicitação em Oportunidades para começar."
          />}
        {meus.map((b) => (
          <Cartao key={b.id} booking={b} onAvancar={() => avancar.mutate(b)} pendente={avancar.isPending} />
        ))}
      </TabsContent>

      <TabsContent value="historico" className="mt-6 space-y-4">
        {concluidos.length === 0 && <Vazio
            icon={Sparkles}
            titulo="Sem histórico ainda"
            texto="Os serviços que você finalizar ficam registrados aqui."
          />}
        {concluidos.map((b) => (
          <Cartao key={b.id} booking={b} />
        ))}
      </TabsContent>
    </Tabs>
  );
}

function Vazio({ titulo, texto, icon }: { titulo: string; texto: string; icon: LucideIcon }) {
  return <EstadoVazio icon={icon} titulo={titulo} texto={texto} />;
}

function Cartao({
  booking,
  onAvancar,
  pendente,
}: {
  booking: BookingProf;
  onAvancar?: () => void;
  pendente?: boolean;
}) {
  const passo = PROXIMO[booking.status];
  const end = booking.enderecos;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{STATUS_LABEL[booking.status] ?? booking.status}</Badge>
            {booking.codigo && (
              <span className="text-xs text-muted-foreground">{booking.codigo}</span>
            )}
          </div>
          <p className="font-medium">
            {labelTipoLimpeza(booking.tipo_limpeza)} · {labelTipoImovel(booking.tipo_imovel)}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {booking.data
                ? new Date(`${booking.data}T00:00:00`).toLocaleDateString("pt-BR")
                : "A combinar"}
              {booking.hora ? ` · ${booking.hora.slice(0, 5)}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {booking.duracao_horas}h
            </span>
            {end && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {[end.bairro, end.cidade].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          {booking.observacoes && (
            <p className="text-sm text-muted-foreground">Obs.: {booking.observacoes}</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span className="text-lg font-semibold">{formatBRL(booking.valor_profissional)}</span>
          <span className="text-xs text-muted-foreground">seu valor líquido</span>
          {passo && onAvancar && (
            <Button size="sm" disabled={pendente} onClick={onAvancar}>
              {pendente && <Loader2 className="mr-2 size-4 animate-spin" />}
              {passo.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
