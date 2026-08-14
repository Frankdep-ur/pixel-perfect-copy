import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminProfissionaisQuery, type AdminProfissional } from "@/lib/admin-queries";
import {
  Painel,
  StatusBadge,
  TituloSecao,
  formatarData,
  rotuloStatusProfissional,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { labelTipoLimpeza } from "@/lib/catalogo";
import { nomeRegiao } from "@/lib/regioes";
import { FichaProfissional } from "@/components/admin/ficha-profissional";

export const Route = createFileRoute("/admin/profissionais")({
  component: AdminProfissionais,
});

const FILTROS = ["todas", "pendente", "aprovada", "reprovada", "bloqueada"] as const;

function AdminProfissionais() {
  const queryClient = useQueryClient();
  const { data: profissionais } = useQuery(adminProfissionaisQuery);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>("todas");
  const [selecionada, setSelecionada] = useState<AdminProfissional | null>(null);

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("profissionais")
        .update({ status, verificada: status === "aprovada" })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(`Status atualizado para "${rotuloStatusProfissional(status)}"`);
      queryClient.invalidateQueries({ queryKey: ["admin", "profissionais"] });
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
      setSelecionada(null);
    },
    onError: (erro) =>
      toast.error("Não foi possível atualizar", {
        description: erro instanceof Error ? erro.message : undefined,
      }),
  });

  if (!profissionais) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const lista =
    filtro === "todas" ? profissionais : profissionais.filter((p) => p.status === filtro);

  return (
    <>
      <TituloSecao
        titulo="Profissionais"
        texto="Aprove, reprove ou bloqueie. A mudança reflete na busca do cliente na hora."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={cn(
              "min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors active:scale-[0.98]",
              filtro === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {f === "todas" ? "Todas" : rotuloStatusProfissional(f)}
            {f !== "todas" && ` (${profissionais.filter((p) => p.status === f).length})`}
          </button>
        ))}
      </div>

      <Painel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Profissional</th>
                <th className="px-5 py-3 font-medium">Cidade</th>
                <th className="px-5 py-3 font-medium">Região</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Nota</th>
                <th className="px-5 py-3 font-medium">Serviços</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lista.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelecionada(p)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/60",
                    p.status === "pendente" && "bg-warning/8",
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.foto_url ?? "https://i.pravatar.cc/80"}
                        alt={`Foto de ${p.nome}`}
                        loading="lazy"
                        className="size-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium leading-snug">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">{p.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{p.cidade ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{nomeRegiao(p.regiao)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 text-accent" strokeWidth={2} aria-hidden />
                      {p.nota_media.toFixed(1).replace(".", ",")}
                    </span>
                  </td>
                  <td className="px-5 py-3">{p.total_servicos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Painel>

      <Sheet open={!!selecionada} onOpenChange={(aberto) => !aberto && setSelecionada(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selecionada && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selecionada.nome}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="flex items-center gap-4">
                  <img
                    src={selecionada.foto_url ?? "https://i.pravatar.cc/120"}
                    alt={`Foto de ${selecionada.nome}`}
                    className="size-18 rounded-full object-cover"
                  />
                  <div className="space-y-1">
                    <StatusBadge status={selecionada.status} />
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" strokeWidth={1.5} aria-hidden />
                      {selecionada.cidade} · {selecionada.raio_km} km
                    </p>
                  </div>
                </div>

                <dl className="space-y-2 rounded-xl bg-surface-tint p-4 text-sm">
                  {[
                    ["E-mail", selecionada.email ?? "—"],
                    ["Telefone", selecionada.telefone ?? "—"],
                    ["Região", nomeRegiao(selecionada.regiao) || "—"],
                    ["Cidades atendidas", selecionada.cidades_atendidas.join(", ") || "—"],
                    [
                      "Tipos de limpeza",
                      selecionada.tipos_limpeza.map(labelTipoLimpeza).join(", ") || "—",
                    ],
                    ["Experiência", `${selecionada.anos_experiencia} ano(s)`],
                    [
                      "Nota",
                      `${selecionada.nota_media.toFixed(1).replace(".", ",")} (${selecionada.total_avaliacoes} avaliações)`,
                    ],
                    ["Serviços realizados", String(selecionada.total_servicos)],
                    ["Cadastro", formatarData(selecionada.criado_em)],
                  ].map(([label, valor]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>

                {selecionada.bio && (
                  <p className="text-sm leading-relaxed text-muted-foreground">{selecionada.bio}</p>
                )}

                <FichaProfissional
                  profissionalId={selecionada.id}
                  userId={selecionada.user_id}
                  documentos={[
                    { label: "Identidade (RG/CNH)", url: selecionada.doc_identidade_url },
                    { label: "CPF", url: selecionada.doc_cpf_url },
                    { label: "Comprovante de residência", url: selecionada.comprovante_url },
                  ]}
                />


                <div className="grid gap-2">
                  <Button
                    onClick={() =>
                      mudarStatus.mutate({ id: selecionada.id, status: "aprovada" })
                    }
                    disabled={mudarStatus.isPending || selecionada.status === "aprovada"}
                  >
                    Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      mudarStatus.mutate({ id: selecionada.id, status: "reprovada" })
                    }
                    disabled={mudarStatus.isPending || selecionada.status === "reprovada"}
                  >
                    Reprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      mudarStatus.mutate({ id: selecionada.id, status: "bloqueada" })
                    }
                    disabled={mudarStatus.isPending || selecionada.status === "bloqueada"}
                  >
                    Bloquear
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
