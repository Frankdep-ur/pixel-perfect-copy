import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";

import { adminAvaliacoesQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao, formatarData } from "@/components/admin/ui";
import { EstadoVazio } from "@/components/estado-vazio";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: AdminAvaliacoes,
});

function Estrelas({ nota }: { nota: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= nota ? "size-4 fill-accent text-accent" : "size-4 text-border"}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}

function AdminAvaliacoes() {
  const { data: avaliacoes } = useQuery(adminAvaliacoesQuery);

  if (!avaliacoes) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TituloSecao titulo="Avaliações" texto="O que os clientes falam depois da faxina." />

      {avaliacoes.length === 0 ? (
        <EstadoVazio
          icon={Star}
          titulo="Nenhuma avaliação ainda"
          texto="As avaliações aparecem aqui quando os clientes avaliam um serviço concluído."
        />
      ) : (
        <Painel>
          <ul className="divide-y divide-border">
            {avaliacoes.map((a) => (
              <li key={a.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Estrelas nota={a.nota} />
                    <span className="text-sm font-medium">{a.profissional}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.cliente} · {formatarData(a.criado_em)}
                  </span>
                </div>
                {a.comentario && (
                  <p className="text-sm leading-relaxed text-muted-foreground">“{a.comentario}”</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Pontualidade {a.pontualidade ?? "—"} · Qualidade {a.qualidade ?? "—"} ·
                  Cordialidade {a.cordialidade ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        </Painel>
      )}
    </>
  );
}
