import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, MapPin, Plus, Sparkles } from "lucide-react";

import { EstadoVazio } from "@/components/estado-vazio";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvaliarDialog } from "@/components/avaliar-dialog";
import { STATUS_LABEL, formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — LAR10" },
      {
        name: "description",
        content: "Acompanhe suas limpezas contratadas, histórico e avaliações no LAR10.",
      },
      { property: "og:title", content: "Minha conta — LAR10" },
      {
        property: "og:description",
        content: "Acompanhe suas limpezas contratadas, histórico e avaliações.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MinhaConta,
});

const ATIVOS = ["solicitada", "aceita", "confirmada", "a_caminho", "em_andamento", "finalizada"];

function MinhaConta() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/auth", search: { next: "/minha-conta" }, replace: true });
    }
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["minhas-contratacoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          "*, enderecos(rua, numero, bairro, cidade), profissionais(id, user_id, profiles!profissionais_user_id_fkey(nome)), avaliacoes(id)",
        )
        .eq("cliente_id", user!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return bookings;
    },
  });

  const ativas = (data ?? []).filter((b) => ATIVOS.includes(b.status));
  const historico = (data ?? []).filter((b) => !ATIVOS.includes(b.status));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Minha conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe suas limpezas e avalie os serviços concluídos.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/contratar">
              <Plus className="size-4" /> Nova limpeza
            </Link>
          </Button>
        </div>

        {(isLoading || carregando) && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && data && (
          <Tabs defaultValue="ativas" className="mt-8">
            <TabsList>
              <TabsTrigger value="ativas">Em andamento ({ativas.length})</TabsTrigger>
              <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ativas" className="mt-6 space-y-3">
              {ativas.length === 0 && (
                <EstadoVazio
                  icon={CalendarDays}
                  titulo="Nenhuma limpeza agendada"
                  texto="Escolha o serviço, a data e contrate em poucos minutos."
                  acaoLabel="Contratar uma faxina"
                  acaoTo="/contratar"
                />
              )}
              {ativas.map((b) => (
                <CartaoBooking key={b.id} booking={b} userId={user!.id} />
              ))}
            </TabsContent>

            <TabsContent value="historico" className="mt-6 space-y-3">
              {historico.length === 0 && (
                <EstadoVazio
                  icon={Sparkles}
                  titulo="Sem histórico ainda"
                  texto="Quando um serviço for concluído, ele aparece aqui para você avaliar."
                  acaoLabel="Contratar uma faxina"
                  acaoTo="/contratar"
                />
              )}
              {historico.map((b) => (
                <CartaoBooking key={b.id} booking={b} userId={user!.id} />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

type BookingLista = {
  id: string;
  codigo: string | null;
  status: string;
  data: string | null;
  hora: string | null;
  tipo_limpeza: string;
  duracao_horas: number;
  valor_total: number;
  enderecos: { rua: string | null; numero: string | null; bairro: string | null; cidade: string | null } | null;
  profissionais: { id: string; user_id: string; profiles: { nome: string | null } | null } | null;
  avaliacoes: { id: string }[];
};

function CartaoBooking({ booking, userId }: { booking: BookingLista; userId: string }) {
  const concluida = booking.status === "concluida" || booking.status === "finalizada";
  const jaAvaliou = booking.avaliacoes.length > 0;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{STATUS_LABEL[booking.status] ?? booking.status}</Badge>
            <span className="text-xs text-muted-foreground">{booking.codigo}</span>
          </div>
          <p className="font-semibold">
            Limpeza {labelTipoLimpeza(booking.tipo_limpeza)} · {booking.duracao_horas}h
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {booking.data
              ? new Date(`${booking.data}T12:00:00`).toLocaleDateString("pt-BR")
              : "Data a definir"}
            {booking.hora ? ` às ${booking.hora.slice(0, 5)}` : ""}
          </p>
          {booking.enderecos && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              {booking.enderecos.bairro}, {booking.enderecos.cidade}
            </p>
          )}
          {booking.profissionais?.profiles?.nome && (
            <p className="text-sm text-muted-foreground">
              Profissional: {booking.profissionais.profiles.nome}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="text-xl font-semibold text-primary">
            {formatBRL(Number(booking.valor_total))}
          </span>
          {concluida && !jaAvaliou && booking.profissionais && (
            <AvaliarDialog
              bookingId={booking.id}
              avaliadoId={booking.profissionais.user_id}
              avaliadorId={userId}
            />
          )}
          {jaAvaliou && <span className="text-xs text-muted-foreground">Serviço avaliado</span>}
        </div>
      </CardContent>
    </Card>
  );
}
