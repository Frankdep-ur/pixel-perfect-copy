import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Radar, RefreshCw, Send, Wifi } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatarData } from "@/lib/agenda";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/whatsapp";
import {
  dispararFilaWhatsapp,
  enviarTesteWhatsapp,
  reenviarNotificacao,
  statusWhatsapp,
} from "@/lib/notificacoes.functions";
import { useState } from "react";


export const Route = createFileRoute("/admin/orquestra")({
  head: () => ({
    meta: [
      { title: "Orquestra de contratação — Lar77 Admin" },
      {
        name: "description",
        content:
          "Acompanhe pedidos em busca, convites enviados às profissionais e a fila de mensagens de WhatsApp da Lar77.",
      },
      { property: "og:title", content: "Orquestra de contratação — Lar77 Admin" },
      {
        property: "og:description",
        content: "Convites, aceites e reservas temporárias em tempo real.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminOrquestra,
});

const LABEL_CONVITE: Record<string, string> = {
  enviado: "Enviado",
  aceito: "Aceito",
  indisponivel: "Indisponível",
  expirado: "Expirado",
  encerrado: "Encerrado",
};

type PedidoBusca = {
  id: string;
  codigo: string | null;
  data: string | null;
  hora: string | null;
  tipo_limpeza: string;
  regiao: string | null;
  valor_total: number;
  reserva_expira_em: string | null;
  reservado_profissional_id: string | null;
  criado_em: string;
  booking_convites: {
    id: string;
    status: string;
    rodada: number;
    expira_em: string;
    profissionais: { profiles: { nome: string | null } | null } | null;
  }[];
};

function AdminOrquestra() {
  const queryClient = useQueryClient();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ["admin-orquestra"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, codigo, data, hora, tipo_limpeza, regiao, valor_total, reserva_expira_em, reservado_profissional_id, criado_em, booking_convites(id, status, rodada, expira_em, profissionais(profiles(nome)))",
        )
        .eq("status", "buscando")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as unknown as PedidoBusca[];
    },
  });

  const { data: fila } = useQuery({
    queryKey: ["admin-notificacoes"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes_whatsapp")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data;
    },
  });

  const [telefoneTeste, setTelefoneTeste] = useState("");

  const status = useQuery({
    queryKey: ["zapi-status"],
    staleTime: 60_000,
    queryFn: () => statusWhatsapp(),
  });

  function atualizarFila() {
    void queryClient.invalidateQueries({ queryKey: ["admin-notificacoes"] });
  }

  const disparar = useMutation({
    mutationFn: () => dispararFilaWhatsapp(),
    onSuccess: (r) => {
      toast.success(`${r.enviadas} enviada(s), ${r.falhas} falha(s).`);
      atualizarFila();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reenviar = useMutation({
    mutationFn: (id: string) => reenviarNotificacao({ data: { id } }),
    onSuccess: (r) => {
      toast[r.enviadas ? "success" : "error"](
        r.enviadas ? "Mensagem enviada pela Z-API." : "Não foi possível enviar. Veja o motivo na fila.",
      );
      atualizarFila();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const teste = useMutation({
    mutationFn: () =>
      enviarTesteWhatsapp({
        data: {
          telefone: telefoneTeste,
          mensagem: "Teste de notificação da Lar77 pela Z-API. Se você recebeu, está funcionando.",
        },
      }),
    onSuccess: (r) =>
      r.ok ? toast.success("Teste enviado.") : toast.error(`Falhou: ${r.erro}`),
    onError: (e: Error) => toast.error(e.message),
  });

  async function marcarEnviada(id: string) {
    await supabase
      .from("notificacoes_whatsapp")
      .update({ status: "enviada", enviado_em: new Date().toISOString() })
      .eq("id", id);
    atualizarFila();
  }


  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const lista = pedidos ?? [];

  return (
    <div>
      <TituloSecao
        titulo="Orquestra de contratação"
        texto="Pedidos em busca, convites enviados às profissionais e a fila de mensagens de WhatsApp."
      />

      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos">Pedidos em busca ({lista.length})</TabsTrigger>
          <TabsTrigger value="fila">Fila de WhatsApp ({(fila ?? []).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="mt-6 space-y-4">
          {lista.length === 0 && (
            <Painel className="p-8 text-center text-sm text-muted-foreground">
              <Radar className="mx-auto mb-2 size-6 text-primary" />
              Nenhum pedido em busca neste momento.
            </Painel>
          )}

          {lista.map((p) => {
            const convites = p.booking_convites ?? [];
            const aceitos = convites.filter((c) => c.status === "aceito").length;
            return (
              <Painel key={p.id} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{p.codigo ?? p.id.slice(0, 8)}</span>
                  <Badge variant="secondary">{labelTipoLimpeza(p.tipo_limpeza)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatarData(p.data)}
                    {p.hora ? ` · ${p.hora.slice(0, 5)}` : ""} · {p.regiao ?? "-"}
                  </span>
                  <span className="ml-auto font-semibold">
                    {formatBRL(Number(p.valor_total))}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>
                    Rodada atual: {Math.max(1, ...convites.map((c) => c.rodada), 1)} ·{" "}
                    {convites.length} convites · {aceitos} aceites
                  </span>
                  {p.reserva_expira_em && new Date(p.reserva_expira_em) > new Date() && (
                    <Badge>Reserva ativa até {new Date(p.reserva_expira_em).toLocaleTimeString("pt-BR")}</Badge>
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {convites.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span className="truncate">
                        {c.profissionais?.profiles?.nome ?? "Profissional"}
                      </span>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        R{c.rodada} · {LABEL_CONVITE[c.status] ?? c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Painel>
            );
          })}
        </TabsContent>

        <TabsContent value="fila" className="mt-6 space-y-3">
          <Painel className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Wifi
                className={`size-5 ${status.data?.conectada ? "text-primary" : "text-destructive"}`}
              />
              <div className="text-sm">
                <p className="font-semibold">
                  {status.isLoading
                    ? "Consultando instância…"
                    : status.data?.conectada
                      ? "WhatsApp conectado"
                      : "WhatsApp desconectado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {status.data?.detalhe ?? "Integração Z-API"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="gap-2"
                onClick={() => void status.refetch()}
              >
                <RefreshCw className="size-4" /> Verificar
              </Button>
              <Button
                size="sm"
                className="ml-auto gap-2"
                disabled={disparar.isPending}
                onClick={() => disparar.mutate()}
              >
                <Send className="size-4" /> Disparar pendentes
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Input
                value={telefoneTeste}
                onChange={(e) => setTelefoneTeste(e.target.value)}
                placeholder="Número para teste (com DDI/DDD)"
                className="max-w-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={teste.isPending || telefoneTeste.replace(/\D/g, "").length < 8}
                onClick={() => teste.mutate()}
              >
                Enviar teste
              </Button>
            </div>
          </Painel>

          <p className="text-sm text-muted-foreground">
            As mensagens saem automaticamente pela Z-API. Se alguma falhar, o motivo aparece abaixo e
            você pode reenviar.
          </p>

          {(fila ?? []).map((item) => {
            const n = item as typeof item & {
              erro: string | null;
              tentativas: number | null;
            };
            return (
              <Painel key={n.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{n.tipo}</Badge>
                  <span className="text-sm font-medium">{n.destinatario_nome ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {n.telefone ?? "sem telefone"}
                  </span>
                  <Badge
                    className="ml-auto"
                    variant={
                      n.status === "enviada"
                        ? "default"
                        : n.status === "falhou"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {n.status}
                    {n.tentativas ? ` · ${n.tentativas}x` : ""}
                  </Badge>
                </div>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {n.mensagem}
                </pre>
                {n.erro && (
                  <p className="mt-2 rounded-xl border border-destructive/40 px-3 py-2 text-xs text-destructive">
                    {n.erro}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {n.status !== "enviada" && (
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={reenviar.isPending}
                      onClick={() => reenviar.mutate(n.id)}
                    >
                      <Send className="size-4" /> Reenviar pela Z-API
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" className="gap-2">
                    <a href={linkWhatsApp(n.telefone, n.mensagem)} target="_blank" rel="noreferrer">
                      Abrir no WhatsApp
                    </a>
                  </Button>
                  {n.status !== "enviada" && (
                    <Button size="sm" variant="ghost" onClick={() => void marcarEnviada(n.id)}>
                      Marcar como enviada
                    </Button>
                  )}
                </div>
              </Painel>
            );
          })}
          {(fila ?? []).length === 0 && (
            <Painel className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem na fila ainda.
            </Painel>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
