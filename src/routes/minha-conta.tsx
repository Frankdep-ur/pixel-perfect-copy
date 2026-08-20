import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { EstadoVazio } from "@/components/estado-vazio";
import { MeusImoveis } from "@/components/cliente/meus-imoveis";
import { MeuPerfil } from "@/components/cliente/meu-perfil";
import { ChatServico } from "@/components/chat-servico";
import { CancelarServico } from "@/components/cancelar-servico";


import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvaliarDialog } from "@/components/avaliar-dialog";
import { STATUS_LABEL, ehServicoAirbnb, formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { FotosServicoCliente } from "@/components/fotos-servico";
import { useSession } from "@/hooks/use-auth";

type Busca = { aba?: string };

export const Route = createFileRoute("/minha-conta")({
  validateSearch: (busca: Record<string, unknown>): Busca =>
    typeof busca["aba"] === "string" ? { aba: busca["aba"] as string } : {},
  head: () => ({
    meta: [
      { title: "Minha conta — Lar77" },
      {
        name: "description",
        content: "Acompanhe suas limpezas contratadas, histórico e avaliações no Lar77.",
      },
      { property: "og:title", content: "Minha conta — Lar77" },
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

/** Serviços que o cliente ainda pode cancelar. */
const CANCELAVEIS = ["aguardando_aceite", "sem_profissional", "solicitada", "aceita", "confirmada"];

/** Só depois do aceite o cliente vê os dados da profissional. */
const APOS_ACEITE = ["aceita", "confirmada", "a_caminho", "em_andamento", "finalizada", "concluida"];

const ABAS_VALIDAS = ["ativas", "historico", "imoveis", "perfil"];

function MinhaConta() {
  const navigate = useNavigate();
  const { aba } = Route.useSearch();
  const abaInicial = aba && ABAS_VALIDAS.includes(aba) ? aba : "ativas";
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
          "*, enderecos(rua, numero, bairro, cidade), profissionais!bookings_profissional_id_fkey(id, user_id, cidade, profiles!profissionais_user_id_fkey(nome, telefone, foto_url)), avaliacoes(id)",
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
          <Tabs key={abaInicial} defaultValue={abaInicial} className="mt-8">
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
              {historico.length > 0 && <RelatorioHistorico bookings={historico} />}
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

            <TabsContent value="imoveis" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Cadastre quantos imóveis quiser. Na contratação, é só escolher onde será a limpeza.
              </p>
              <MeusImoveis userId={user!.id} />
            </TabsContent>

            <TabsContent value="perfil" className="mt-6">
              <MeuPerfil userId={user!.id} />
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
            {CANCELAVEIS.includes(booking.status) && (
              <CancelarServico
                bookingId={booking.id}
                userId={userId}
                papel="cliente"
                valorTotal={Number(booking.valor_total)}
                invalidar={["minhas-contratacoes"]}
              />
            )}
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
                <p className="font-semibold">{prof.profiles?.nome ?? "Profissional Lar77"}</p>
                <p className="text-muted-foreground">{prof.profiles?.telefone ?? "—"}</p>
                <p className="text-muted-foreground">{prof.cidade ?? ""}</p>
              </div>
            </div>
            <ChatServico
              bookingId={booking.id}
              userId={userId}
              titulo={`Chat · ${booking.codigo ?? "serviço"}`}
              interlocutor={prof.profiles?.nome?.split(" ")[0] ?? "a profissional"}
            />
          </div>
        )}

        {ehServicoAirbnb(null, booking.tipo_limpeza) &&
          ["em_andamento", "finalizada", "concluida"].includes(booking.status) && (
            <FotosServicoCliente bookingId={booking.id} />
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

function RelatorioHistorico({ bookings }: { bookings: BookingLista[] }) {
  const total = bookings.reduce((soma, b) => soma + Number(b.valor_total), 0);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Relatório de serviços</h2>
            <p className="text-sm text-muted-foreground">
              {bookings.length} serviço(s) registrados na sua conta.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Total investido:{" "}
            <span className="text-lg font-semibold text-primary">{formatBRL(total)}</span>
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Data</th>
                <th className="pb-2 pr-3">Horário</th>
                <th className="pb-2 pr-3">Imóvel</th>
                <th className="pb-2 pr-3">Profissional</th>
                <th className="pb-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="py-2 pr-3">
                    {b.data ? new Date(`${b.data}T12:00:00`).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="py-2 pr-3">{b.hora ? b.hora.slice(0, 5) : "—"}</td>
                  <td className="py-2 pr-3">
                    {b.enderecos
                      ? [b.enderecos.rua, b.enderecos.numero].filter(Boolean).join(", ") ||
                        [b.enderecos.bairro, b.enderecos.cidade].filter(Boolean).join(", ")
                      : "—"}
                  </td>
                  <td className="py-2 pr-3">{b.profissionais?.profiles?.nome ?? "—"}</td>
                  <td className="py-2 text-right font-medium">
                    {formatBRL(Number(b.valor_total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
