import { useRef, useState } from "react";
import { Check, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const DEZ_ANOS = 60 * 60 * 24 * 365 * 10;

type Props = {
  userId: string;
  pasta: string;
  titulo: string;
  descricao: string;
  url: string | null;
  onChange: (url: string) => void;
};

export function UploadDocumento({ userId, pasta, titulo, descricao, url, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(arquivo: File) {
    const permitido =
      arquivo.type.startsWith("image/") || arquivo.type === "application/pdf";
    if (!permitido) {
      toast.error("Envie uma foto (JPG/PNG) ou um PDF.");
      return;
    }
    if (arquivo.size > 8 * 1024 * 1024) {
      toast.error("O arquivo precisa ter no máximo 8 MB.");
      return;
    }

    setEnviando(true);
    try {
      const ext = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
      const caminho = `${userId}/documentos/${pasta}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatares")
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
      if (error) throw error;

      const { data, error: erroUrl } = await supabase.storage
        .from("avatares")
        .createSignedUrl(caminho, DEZ_ANOS);
      if (erroUrl) throw erroUrl;

      onChange(data.signedUrl);
      toast.success(`${titulo} enviado!`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar o arquivo.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-medium">
          {titulo}
          {url && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-primary">
              <Check className="size-3" /> Enviado
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {url && (
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              Ver
            </a>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={enviando}
          onClick={() => input.current?.click()}
        >
          {enviando ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <FileUp className="mr-1.5 size-4" />
          )}
          {url ? "Substituir" : "Enviar"}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void enviar(arquivo);
        }}
      />
    </div>
  );
}
