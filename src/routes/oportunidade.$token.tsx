import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
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
import { useContagem } from "@/hooks/use-contagem";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";
import { formatarDataLonga } from "@/lib/agenda";
import { convitePorToken, formatarContagem, responderConviteToken } from "@/lib/orquestra";

export const Route = createFileRoute("/oportunidade/$token")({
  head: () => ({
    meta: [
      { title: "Oportunidade de faxina — Lar77" },
      {
        name: "description",
        content:
          "Responda em poucos toques se você está disponível para esta faxina da Lar77 em Santa Catarina.",
      },
      { property: "og:title", content: "Oportunidade de faxina — Lar77" },
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["convite-token", token],
    queryFn: () => convitePorToken(token),
  });

  const responder = useMutation({
    mutationFn: (aceitar: boolean) => responderConviteToken(token, aceitar),
    onSuccess: (status) => {
      if (status === "aceito") toast.success("Oportunidade aceita!");
      else if (status === "expirado") toast.error("O prazo dessa oportunidade encerrou.");
      else toast.success("Resposta registrada.");
      void refetch();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const restante = useContagem(data?.expira_em ?? null);

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <Sparkles className="size-7 text-primary" />
        <h1 className="text-xl font-semibold">Oportunidade não encontrada</h1>
        <p className="text-sm text-muted-foreground">
          O link pode ter expirado. Entre no Lar77 para ver suas oportunidades.
        </p>
        <Button asChild>
          <a href="/profissional">Abrir o Lar77</a>
        </Button>
      </main>
    );
  }

  const aberto = data.status === "enviado" && restante > 0;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
        <span className="text-lg font-semibold tracking-tight">Lar77</span>
      </div>

      <div className="rounded-2xl border-2 border-primary/40 bg-card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <Megaphone className="size-3" /> Nova oportunidade de faxina
          </Badge>
          {aberto && (
            <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
              <Timer className="size-4" /> {formatarContagem(restante)}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {labelTipoLimpeza(data.tipo_limpeza ?? "")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Olá{data.profissional_nome ? `, ${data.profissional_nome.split(" ")[0]}` : ""}! Veja se
          você consegue atender:
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {formatarDataLonga(data.data)}
            {data.hora ? ` às ${String(data.hora).slice(0, 5)}` : ""}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="size-4 text-primary" /> {data.duracao_horas} horas
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            {[data.bairro, data.cidade].filter(Boolean).join(" — ") || "Sua região"}
          </p>
        </div>

        <p className="mt-4 text-lg font-semibold">
          Você recebe {formatBRL(Number(data.valor_profissional ?? 0))}
        </p>

        {aberto ? (
          <div className="mt-6 flex flex-col gap-2">
            <Button
              size="lg"
              className="gap-2"
              disabled={responder.isPending}
              onClick={() => responder.mutate(true)}
            >
              <Check className="size-4" /> Aceitar
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2"
              disabled={responder.isPending}
              onClick={() => responder.mutate(false)}
            >
              <X className="size-4" /> Indisponível
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
              <p>O prazo desta oportunidade encerrou.</p>
            )}
          </div>
        )}

        <Button asChild variant="ghost" className="mt-4 w-full">
          <a href="/profissional">Abrir meu painel no Lar77</a>
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        O endereço completo e o contato do cliente são liberados apenas para a profissional
        contratada.
      </p>
    </main>
  );
}
