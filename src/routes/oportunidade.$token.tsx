import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MapPin,
  Megaphone,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PwaInstalar } from "@/components/pwa-instalar";
import { useContagem } from "@/hooks/use-contagem";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { formatarDataLonga } from "@/lib/agenda";
import {
  convitePorToken,
  formatarContagem,
  responderConvite,
  responderConviteToken,
} from "@/lib/orquestra";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/oportunidade/$token")({
  head: () => ({
    meta: [
      { title: "Nova oportunidade de faxina — Lar77" },
      {
        name: "description",
        content:
          "Responda em poucos toques se você está disponível para esta faxina da Lar77 em Santa Catarina.",
      },
      { property: "og:title", content: "Nova oportunidade de faxina — Lar77" },
      {
        property: "og:description",
        content: "Aceite ou recuse a oportunidade de faxina enviada pela Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Oportunidade,
});

function Oportunidade() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["convite-token", token],
    queryFn: () => convitePorToken(token),
  });

  const responder = useMutation({
    mutationFn: async (aceitar: boolean) => {
      const conviteId = (data as { convite_id?: string } | null)?.convite_id;
      const { data: sessao } = await supabase.auth.getSession();
      // Profissional já logada no celular: resposta pelo app (canal "app").
      if (sessao.session && conviteId) {
        try {
          const status = await responderConvite(conviteId, aceitar);
          return { status, logada: true };
        } catch {
          // Sessão de outra pessoa: segue pelo token do link.
        }
      }
      const status = await responderConviteToken(token, aceitar);
      return { status, logada: Boolean(sessao.session) };
    },
    onSuccess: ({ status, logada }) => {
      if (status === "aceito") {
        toast.success("Oportunidade aceita! Agora aguarde a escolha do cliente.");
        if (logada) {
          void navigate({ to: "/profissional" });
          return;
        }
      } else if (status === "expirado") {
        toast.error("O prazo dessa oportunidade encerrou.");
      } else {
        toast.success("Resposta registrada.");
      }
      void refetch();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const restante = useContagem(data?.expira_em ?? null);

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-4 pb-10">
      <header className="flex h-14 items-center justify-center gap-2 border-b border-border/60">
        <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
        <span className="text-lg font-semibold tracking-tight">Lar77</span>
      </header>

      {!data ? (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Megaphone className="size-7 text-primary" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold tracking-tight">Oportunidade não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            Este link pode ter expirado. Entre no Lar77 para ver as próximas oportunidades da sua
            região.
          </p>
          <Button asChild className="mt-2 h-[52px] w-full gap-2">
            <a href="/profissional">
              Abrir meu painel <ArrowRight className="size-4" strokeWidth={1.5} />
            </a>
          </Button>
          <PwaInstalar className="mt-4 w-full text-left" />
        </section>
      ) : (
        <OportunidadeCard
          data={data}
          restante={restante}
          respondendo={responder.isPending}
          onResponder={(aceitar) => responder.mutate(aceitar)}
          token={token}
        />
      )}
    </main>
  );
}

type Convite = {
  convite_id?: string;
  status: string;
  expira_em: string;
  profissional_nome: string | null;
  tipo_limpeza: string | null;
  duracao_horas: number | null;
  data: string | null;
  hora: string | null;
  bairro: string | null;
  cidade: string | null;
  valor_profissional: number | null;
  escolhida: boolean | null;
};

function OportunidadeCard({
  data,
  restante,
  respondendo,
  onResponder,
  token,
}: {
  data: Convite;
  restante: number;
  respondendo: boolean;
  onResponder: (aceitar: boolean) => void;
  token: string;
}) {
  const aberto = data.status === "enviado" && restante > 0;
  const primeiroNome = data.profissional_nome?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col pt-6">
      <div className="rounded-2xl border-2 border-primary/40 bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <Megaphone className="size-3" strokeWidth={1.5} /> Nova oportunidade
          </Badge>
          {aberto && (
            <span className="ml-auto flex items-center gap-1 text-sm font-semibold tabular-nums">
              <Timer className="size-4" strokeWidth={1.5} /> {formatarContagem(restante)}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {labelTipoLimpeza(data.tipo_limpeza ?? "")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Olá{primeiroNome ? `, ${primeiroNome}` : ""}! Veja se você consegue atender:
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" strokeWidth={1.5} />
            {formatarDataLonga(data.data)}
            {data.hora ? ` às ${String(data.hora).slice(0, 5)}` : ""}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 text-primary" strokeWidth={1.5} /> {data.duracao_horas} horas
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" strokeWidth={1.5} />
            {[data.bairro, data.cidade].filter(Boolean).join(" — ") || "Sua região"}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Você recebe</p>
          <p className="text-2xl font-semibold">
            {formatBRL(Number(data.valor_profissional ?? 0))}
          </p>
        </div>

        {aberto ? (
          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="h-[52px] gap-2 text-base"
              disabled={respondendo}
              onClick={() => onResponder(true)}
            >
              {respondendo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" strokeWidth={1.5} />
              )}
              ACEITAR
            </Button>
            <Button
              variant="outline"
              className="h-[52px] gap-2"
              disabled={respondendo}
              onClick={() => onResponder(false)}
            >
              <X className="size-4" strokeWidth={1.5} /> ESTOU INDISPONÍVEL
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            {data.escolhida ? (
              <p className="font-medium text-foreground">
                Faxina confirmada com você! Entre no Lar77 para acompanhar.
              </p>
            ) : data.status === "aceito" ? (
              <p>Você aceitou. Agora é só aguardar a escolha do cliente.</p>
            ) : data.status === "indisponivel" ? (
              <p>Você marcou indisponível para esta faxina.</p>
            ) : data.status === "encerrado" ? (
              <p>O cliente escolheu outra profissional nesta contratação.</p>
            ) : (
              <p>O prazo desta oportunidade encerrou. Fique de olho nas próximas.</p>
            )}
          </div>
        )}

        <Button asChild variant="ghost" className="mt-4 h-11 w-full gap-2">
          <a href={`/profissional_/entrar?next=${encodeURIComponent(`/oportunidade/${token}`)}`}>
            Entrar no app para acompanhar <ArrowRight className="size-4" strokeWidth={1.5} />
          </a>
        </Button>
      </div>

      <PwaInstalar className="mt-4" />

      <p className="mt-4 text-center text-xs text-muted-foreground">
        O endereço completo e o contato do cliente são liberados apenas para a profissional
        contratada.
      </p>
    </div>
  );
}
