import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, FileText, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatarData } from "@/components/admin/ui";
import { STATUS_LABEL, formatBRL, labelTipoLimpeza } from "@/lib/catalogo";

type Documento = { label: string; url: string | null };

export function FichaProfissional({
  profissionalId,
  documentos,
}: {
  profissionalId: string;
  documentos: Documento[];
}) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");

  const { data: mensagens } = useQuery({
    queryKey: ["admin", "mensagens", profissionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens_profissional")
        .select("id, mensagem, criado_em")
        .eq("profissional_id", profissionalId)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: agenda } = useQuery({
    queryKey: ["admin", "agenda-profissional", profissionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, codigo, status, data, hora, tipo_limpeza, valor_profissional")
        .eq("profissional_id", profissionalId)
        .order("data", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const enviar = useMutation({
    mutationFn: async () => {
      const mensagem = texto.trim();
      if (!mensagem) throw new Error("Escreva uma mensagem.");
      const { error } = await supabase
        .from("mensagens_profissional")
        .insert({ profissional_id: profissionalId, mensagem });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      toast.success("Mensagem interna registrada.");
      queryClient.invalidateQueries({ queryKey: ["admin", "mensagens", profissionalId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-primary" /> Documentos
        </h3>
        <ul className="space-y-2 text-sm">
          {documentos.map((d) => (
            <li
              key={d.label}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-tint px-4 py-3"
            >
              <span className="text-muted-foreground">{d.label}</span>
              {d.url ? (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline"
                >
                  Ver arquivo
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">Não enviado</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="size-4 text-primary" /> Agenda
        </h3>
        {!agenda ? (
          <Loader2 className="size-4 animate-spin text-primary" />
        ) : agenda.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum serviço atribuído ainda.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {agenda.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {formatarData(b.data)} {b.hora ? `· ${b.hora.slice(0, 5)}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {labelTipoLimpeza(b.tipo_limpeza)} · {STATUS_LABEL[b.status] ?? b.status}
                  </p>
                </div>
                <span className="font-medium">{formatBRL(Number(b.valor_profissional))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4 text-primary" /> Mensagem interna
        </h3>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Anotação visível apenas para a equipe LAR10."
        />
        <Button
          size="sm"
          onClick={() => enviar.mutate()}
          disabled={enviar.isPending || !texto.trim()}
        >
          {enviar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Registrar anotação
        </Button>
        <ul className="space-y-2 pt-2">
          {(mensagens ?? []).map((m) => (
            <li key={m.id} className="rounded-xl bg-surface-tint px-4 py-3 text-sm">
              <p className="leading-relaxed">{m.mensagem}</p>
              <p className="pt-1 text-xs text-muted-foreground">{formatarData(m.criado_em)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
