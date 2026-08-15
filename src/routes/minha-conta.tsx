import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MENSAGENS, linkWhatsApp } from "@/lib/whatsapp";

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

const ATIVOS = [
  "aguardando_aceite",
  "sem_profissional",
  "solicitada",
  "aceita",
  "confirmada",
  "a_caminho",
  "em_andamento",
  "finalizada",
];

/** Só depois do aceite o cliente vê os dados da profissional. */
const APOS_ACEITE = ["aceita", "confirmada", "a_caminho", "em_andamento", "finalizada", "concluida"];

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
          "*, enderecos(rua, numero, bairro, cidade), profissionais(id, user_id, cidade, profiles!profissionais_user_id_fkey(nome, telefone, foto_url)), avaliacoes(id)",
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
            <TabsList className="flex-wrap">
              <TabsTrigger value="ativas">Em andamento ({ativas.length})</TabsTrigger>
              <TabsTrigger value="historico">Histórico ({historico.length})</TabsTrigger>
              <TabsTrigger value="imoveis">Meus imóveis</TabsTrigger>
              <TabsTrigger value="perfil">Meus dados</TabsTrigger>
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
  profissionais: {
    id: string;
    user_id: string;
    cidade: string | null;
    profiles: { nome: string | null; telefone: string | null; foto_url: string | null } | null;
  } | null;
  avaliacoes: { id: string }[];
};

function CartaoBooking({ booking, userId }: { booking: BookingLista; userId: string }) {
  const queryClient = useQueryClient();
  const concluida = booking.status === "concluida";
  const aguardandoConfirmacao = booking.status === "finalizada";
  const jaAvaliou = booking.avaliacoes.length > 0;
  const mostraProfissional = APOS_ACEITE.includes(booking.status) && !!booking.profissionais;
  const prof = booking.profissionais;

  const confirmar = useMutation({
    mutationFn: async () => {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "concluida",
          cliente_confirmado_em: agora,
          pagamento_liberado_em: agora,
        })
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Faxina confirmada!", {
        description: "O pagamento da profissional foi liberado. Agora você pode avaliar o serviço.",
      });
      queryClient.invalidateQueries({ queryKey: ["minhas-contratacoes"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="text-xl font-semibold text-primary">
              {formatBRL(Number(booking.valor_total))}
            </span>
            {concluida && !jaAvaliou && prof && (
              <AvaliarDialog
                bookingId={booking.id}
                avaliadoId={prof.user_id}
                avaliadorId={userId}
              />
            )}
            {jaAvaliou && <span className="text-xs text-muted-foreground">Serviço avaliado</span>}
          </div>
        </div>

        {booking.status === "aguardando_aceite" && (
          <p className="rounded-xl bg-surface-tint px-4 py-3 text-sm text-muted-foreground">
            Sua data já está reservada. Assim que a profissional aceitar, os dados de contato dela
            aparecem aqui.
          </p>
        )}

        {booking.status === "sem_profissional" && (
          <p className="rounded-xl bg-surface-tint px-4 py-3 text-sm text-muted-foreground">
            Estamos procurando outra profissional disponível para esta data. Você será avisado assim
            que confirmarmos.
          </p>
        )}

        {mostraProfissional && prof && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-tint px-4 py-3">
            <div className="flex items-center gap-3">
              {prof.profiles?.foto_url ? (
                <img
                  src={prof.profiles.foto_url}
                  alt={`Foto de ${prof.profiles?.nome ?? "profissional"}`}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </span>
              )}
              <div className="text-sm">
                <p className="font-semibold">{prof.profiles?.nome ?? "Profissional LAR10"}</p>
                <p className="text-muted-foreground">{prof.profiles?.telefone ?? "—"}</p>
                <p className="text-muted-foreground">{prof.cidade ?? ""}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a
                href={linkWhatsApp(
                  prof.profiles?.telefone,
                  MENSAGENS.clienteParaProfissional(booking.codigo ?? "LAR10"),
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          </div>
        )}

        {aguardandoConfirmacao && (
          <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-sm">
              A profissional marcou a faxina como finalizada. Confirme para liberar o pagamento e
              encerrar o serviço.
            </p>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => confirmar.mutate()}
              disabled={confirmar.isPending}
            >
              {confirmar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Faxina finalizada
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
