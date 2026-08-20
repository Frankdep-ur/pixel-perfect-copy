import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Inbox,
  Loader2,
  MapPin,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { EstadoVazio } from "@/components/estado-vazio";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OportunidadesProfissional } from "@/components/profissional/oportunidades-profissional";
import { STATUS_LABEL, formatBRL, labelTipoImovel, labelTipoLimpeza } from "@/lib/catalogo";
import { formatarData } from "@/lib/agenda";
import { MENSAGENS } from "@/lib/whatsapp";
import { ChatServico } from "@/components/chat-servico";

type Props = { profissionalId: string; nomeProfissional: string; userId: string };

const PENDENTES = ["aguardando_aceite", "solicitada"];
const ABERTOS = ["aceita", "confirmada", "a_caminho", "em_andamento", "finalizada"];

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
  cliente_id: string;
  enderecos: {
    rua: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string | null;
  } | null;
  profiles: { nome: string | null; telefone: string | null } | null;
};

const PROXIMO: Record<string, { status: string; label: string; icone: LucideIcon }> = {
  aceita: { status: "confirmada", label: "Confirmar agendamento", icone: Check },
  confirmada: { status: "a_caminho", label: "Estou a caminho", icone: MapPin },
  a_caminho: { status: "em_andamento", label: "Iniciar faxina", icone: Play },
  em_andamento: { status: "finalizada", label: "Faxina finalizada", icone: Check },
};

export function ServicosProfissional({ profissionalId, nomeProfissional, userId }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["servicos-profissional", profissionalId],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          "id, codigo, status, data, hora, tipo_imovel, tipo_limpeza, duracao_horas, observacoes, valor_profissional, profissional_id, cliente_id, enderecos(rua, numero, complemento, bairro, cidade), profiles!bookings_cliente_id_fkey(nome, telefone)",
        )
        .order("data", { ascending: true });
      if (error) throw error;
      return bookings as unknown as BookingProf[];
    },
  });

  useEffect(() => {
    const canal = supabase
      .channel(`bookings-prof-${profissionalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `profissional_id=eq.${profissionalId}`,
        },
        () => void queryClient.invalidateQueries({ queryKey: ["servicos-profissional", profissionalId] }),
      )
      .subscribe();
    return () => void supabase.removeChannel(canal);
  }, [profissionalId, queryClient]);

  function atualizarLista() {
    queryClient.invalidateQueries({ queryKey: ["servicos-profissional", profissionalId] });
  }

  const aceitar = useMutation({
    mutationFn: async (booking: BookingProf) => {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "aceita",
          profissional_id: profissionalId,
          aceito_em: new Date().toISOString(),
        })
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço aceito!", {
        description: "Agora você já pode falar com o cliente pelo WhatsApp.",
      });
      atualizarLista();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const recusar = useMutation({
    mutationFn: async (booking: BookingProf) => {
      const { data: novo, error } = await supabase.rpc("recusar_booking", {
        _booking_id: booking.id,
      });
      if (error) throw error;
      return novo;
    },
    onSuccess: (novo) => {
      toast.success("Serviço recusado.", {
        description: novo
          ? "Já repassamos automaticamente para outra profissional."
          : "A equipe Lar77 vai procurar outra profissional.",
      });
      atualizarLista();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const avancar = useMutation({
    mutationFn: async (booking: BookingProf) => {
      const passo = PROXIMO[booking.status];
      if (!passo) return;
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({
          status: passo.status,
          ...(passo.status === "a_caminho" ? { checkin_em: agora } : {}),
          ...(passo.status === "em_andamento" ? { iniciado_em: agora } : {}),
          ...(passo.status === "finalizada" ? { finalizado_em: agora } : {}),
        })
        .eq("id", booking.id);
      if (error) throw error;
      return passo.status;
    },
    onSuccess: (status, booking) => {
      if (status === "finalizada") {
        toast.success("Faxina finalizada!", {
          description: "Avisamos o cliente pelo chat para liberar o pagamento.",
        });
        void supabase.from("mensagens").insert({
          booking_id: booking.id,
          autor_id: userId,
          conteudo: MENSAGENS.finalizada(booking.codigo ?? "Lar77"),
        });
      } else {
        toast.success("Status atualizado.");
      }
      atualizarLista();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const lista = data ?? [];
  const pendentes = lista.filter((b) => PENDENTES.includes(b.status));
  const meus = lista.filter(
    (b) => b.profissional_id === profissionalId && ABERTOS.includes(b.status),
  );
  const concluidos = lista.filter(
    (b) =>
      b.profissional_id === profissionalId &&
      !ABERTOS.includes(b.status) &&
      !PENDENTES.includes(b.status),
  );

  const [aba, setAba] = useState<string | null>(null);
  useEffect(() => {
    if (isLoading || aba) return;
    setAba(meus.length > 0 ? "agenda" : pendentes.length > 0 ? "pedidos" : "oportunidades");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, meus.length, pendentes.length]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const proxima = meus[0];

  return (
    <Tabs value={aba ?? "oportunidades"} onValueChange={setAba} className="mt-8">
      {proxima && (
        <button
          type="button"
          onClick={() => setAba("agenda")}
          className="mb-4 flex w-full flex-wrap items-center gap-3 rounded-2xl border-2 border-primary/40 bg-surface-tint p-4 text-left"
        >
          <CalendarCheck className="size-5 shrink-0 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Você tem {meus.length === 1 ? "1 faxina confirmada" : `${meus.length} faxinas confirmadas`}
            {" — "}
            {formatarData(proxima.data)}
            {proxima.hora ? ` às ${proxima.hora.slice(0, 5)}` : ""}
            {[proxima.enderecos?.bairro, proxima.enderecos?.cidade].filter(Boolean).length
              ? `, ${[proxima.enderecos?.bairro, proxima.enderecos?.cidade].filter(Boolean).join(", ")}`
              : ""}
          </span>
          <span className="ml-auto text-xs font-semibold text-primary">Ver na agenda</span>
        </button>
      )}
      <TabsList className="w-full">
        <TabsTrigger value="oportunidades" className="flex-1">
          Oportunidades
        </TabsTrigger>
        <TabsTrigger value="pedidos" className="flex-1">
          Pedidos ({pendentes.length})
        </TabsTrigger>
        <TabsTrigger value="agenda" className="flex-1">
          Agenda ({meus.length})
        </TabsTrigger>
        <TabsTrigger value="historico" className="flex-1">
          Histórico ({concluidos.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="oportunidades" className="mt-6">
        <OportunidadesProfissional profissionalId={profissionalId} />
      </TabsContent>

      <TabsContent value="pedidos" className="mt-6 space-y-4">

        {pendentes.length === 0 && (
          <Vazio
            icon={Inbox}
            titulo="Nenhum pedido aguardando você"
            texto="Quando um cliente escolher você, o pedido aparece aqui para aceitar ou recusar."
          />
        )}
        {pendentes.map((b) => (
          <Cartao
            key={b.id}
            booking={b}
            nomeProfissional={nomeProfissional}
            userId={userId}
            onAceitar={() => aceitar.mutate(b)}
            onRecusar={() => recusar.mutate(b)}
            pendente={aceitar.isPending || recusar.isPending}
          />
        ))}
      </TabsContent>

      <TabsContent value="agenda" className="mt-6 space-y-4">
        {meus.length === 0 && (
          <Vazio
            icon={CalendarCheck}
            titulo="Agenda livre"
            texto="Aceite um pedido para ele aparecer na sua agenda."
          />
        )}
        {meus.map((b) => (
          <Cartao
            key={b.id}
            booking={b}
            nomeProfissional={nomeProfissional}
            userId={userId}
            onAvancar={() => avancar.mutate(b)}
            pendente={avancar.isPending}
          />
        ))}
      </TabsContent>

      <TabsContent value="historico" className="mt-6 space-y-4">
        {concluidos.length === 0 && (
          <Vazio
            icon={Sparkles}
            titulo="Sem histórico ainda"
            texto="Os serviços que você finalizar ficam registrados aqui."
          />
        )}
        {concluidos.map((b) => (
          <Cartao key={b.id} booking={b} nomeProfissional={nomeProfissional} userId={userId} />
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
  nomeProfissional,
  userId,
  onAvancar,
  onAceitar,
  onRecusar,
  pendente,
}: {
  booking: BookingProf;
  nomeProfissional: string;
  userId: string;
  onAvancar?: () => void;
  onAceitar?: () => void;
  onRecusar?: () => void;
  pendente?: boolean;
}) {
  const passo = PROXIMO[booking.status];
  const end = booking.enderecos;
  const aceito = !PENDENTES.includes(booking.status);
  const Icone = passo?.icone ?? Check;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{STATUS_LABEL[booking.status] ?? booking.status}</Badge>
          {booking.codigo && (
            <span className="text-xs text-muted-foreground">{booking.codigo}</span>
          )}
          <span className="ml-auto text-lg font-semibold">
            {formatBRL(booking.valor_profissional)}
          </span>
        </div>

        <div className="space-y-2">
          <p className="font-medium">
            {labelTipoLimpeza(booking.tipo_limpeza)} · {labelTipoImovel(booking.tipo_imovel)}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatarData(booking.data)}
              {booking.hora ? ` · ${booking.hora.slice(0, 5)}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" />
              {booking.duracao_horas}h
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {aceito && end?.rua
                ? `${end.rua}, ${end.numero ?? "s/n"}${end.complemento ? ` - ${end.complemento}` : ""} · ${end.bairro ?? ""} ${end.cidade ?? ""}`
                : [end?.bairro, end?.cidade].filter(Boolean).join(", ") || "Sua região"}
            </span>
          </div>
          {booking.observacoes && (
            <p className="text-sm text-muted-foreground">Obs.: {booking.observacoes}</p>
          )}
          {!aceito && (
            <p className="text-xs text-muted-foreground">
              Endereço completo e contato do cliente liberados após o aceite.
            </p>
          )}
        </div>

        {aceito && (
          <ChatServico
            bookingId={booking.id}
            userId={userId}
            titulo={`Chat · ${booking.codigo ?? "serviço"}`}
            interlocutor={booking.profiles?.nome?.split(" ")[0] ?? "o cliente"}
          />
        )}

        {onAceitar && onRecusar && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" disabled={pendente} onClick={onAceitar}>
              {pendente ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Aceitar serviço
            </Button>
            <Button size="lg" variant="outline" disabled={pendente} onClick={onRecusar}>
              <X className="mr-2 size-4" />
              Recusar
            </Button>
          </div>
        )}

        {passo && onAvancar && (
          <Button size="lg" className="w-full" disabled={pendente} onClick={onAvancar}>
            {pendente ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Icone className="mr-2 size-4" />
            )}
            {passo.label}
          </Button>
        )}

        {booking.status === "finalizada" && (
          <p className="text-sm text-muted-foreground">
            Aguardando o cliente confirmar a conclusão para liberar o pagamento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
