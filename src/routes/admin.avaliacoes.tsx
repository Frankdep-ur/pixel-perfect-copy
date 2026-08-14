import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminAvaliacoesQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao, formatarData } from "@/components/admin/ui";
import { EstadoVazio } from "@/components/estado-vazio";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
  const queryClient = useQueryClient();
  const { data: avaliacoes } = useQuery(adminAvaliacoesQuery);
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  function recarregar() {
    queryClient.invalidateQueries({ queryKey: ["admin", "avaliacoes"] });
    queryClient.invalidateQueries({ queryKey: ["profissionais"] });
  }

  const alternarBloqueio = useMutation({
    mutationFn: async ({ id, bloqueada }: { id: string; bloqueada: boolean }) => {
      const { error } = await supabase.from("avaliacoes").update({ bloqueada }).eq("id", id);
      if (error) throw error;
      return bloqueada;
    },
    onSuccess: (bloqueada) => {
      toast.success(bloqueada ? "Avaliação bloqueada." : "Avaliação liberada.");
      recarregar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const salvarComentario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("avaliacoes")
        .update({ comentario: texto.trim() || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentário atualizado.");
      setEditando(null);
      recarregar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação excluída.");
      recarregar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (!avaliacoes) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TituloSecao
        titulo="Avaliações"
        texto="Modere o que aparece no perfil das profissionais: bloqueie, edite ou exclua."
      />

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
              <li key={a.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Estrelas nota={a.nota} />
                    <span className="text-sm font-medium">{a.profissional}</span>
                    {a.bloqueada && <Badge variant="destructive">Bloqueada</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.cliente} · {formatarData(a.criado_em)}
                  </span>
                </div>

                {editando === a.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                      maxLength={1000}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={salvarComentario.isPending}
                        onClick={() => salvarComentario.mutate(a.id)}
                      >
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  a.comentario && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      “{a.comentario}”
                    </p>
                  )
                )}

                <p className="text-xs text-muted-foreground">
                  Pontualidade {a.pontualidade ?? "—"} · Qualidade {a.qualidade ?? "—"} ·
                  Cordialidade {a.cordialidade ?? "—"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditando(a.id);
                      setTexto(a.comentario ?? "");
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={alternarBloqueio.isPending}
                    onClick={() =>
                      alternarBloqueio.mutate({ id: a.id, bloqueada: !a.bloqueada })
                    }
                  >
                    {a.bloqueada ? (
                      <>
                        <Eye className="mr-2 size-4" /> Liberar
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-2 size-4" /> Bloquear
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={excluir.isPending}
                    onClick={() => {
                      if (confirm("Excluir esta avaliação definitivamente?")) {
                        excluir.mutate(a.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 size-4" /> Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Painel>
      )}
    </>
  );
}
