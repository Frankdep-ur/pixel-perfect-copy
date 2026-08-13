import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { adminListaEsperaQuery } from "@/lib/admin-queries";
import { CardMetrica, Painel, TituloSecao, formatarData } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/lista-espera")({
  component: AdminListaEspera;
});

function AdminListaEspera() {
  const { data: lista } = useQuery(adminListaEsperaQuery);

  if (!lista) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const contagem = new Map<string, number>();
  for (const item of lista) {
    const cidade = item.cidade?.trim() || "Sem cidade";
    contagem.set(cidade, (contagem.get(cidade) ?? 0) + 1);
  }
  const ranking = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  const ordenada = [...lista].sort((a, b) =>
    (a.cidade ?? "zzz").localeCompare(b.cidade ?? "zzz", "pt-BR"),
  );

  return (
    <>
      <TituloSecao
        titulo="Lista de espera"
        texto="Onde há demanda sem cobertura — é o que diz para onde expandir."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ranking.map(([cidade, total]) => (
          <CardMetrica key={cidade} label={cidade} valor={total} detalhe="interessados" />
        ))}
      </div>

      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Cidade</th>
                <th className="px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenada.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/60">
                  <td className="px-5 py-3 font-medium">{item.email}</td>
                  <td className="px-5 py-3">{item.cidade ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatarData(item.criado_em)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ordenada.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Ninguém na lista de espera ainda.
            </p>
          )}
        </div>
      </Painel>
    </>
  );
}
