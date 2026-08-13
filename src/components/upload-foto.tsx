import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEZ_ANOS = 60 * 60 * 24 * 365 * 10;

type Props = {
  userId: string;
  url: string | null;
  nome?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
};

function iniciais(nome?: string | null) {
  if (!nome) return "LAR";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function UploadFoto({ userId, url, nome, onChange, className }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(arquivo: File) {
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha uma imagem (JPG, PNG ou WebP).");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("A imagem precisa ter no máximo 5 MB.");
      return;
    }

    setEnviando(true);
    try {
      const ext = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
      const caminho = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatares")
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
      if (error) throw error;

      const { data, error: erroUrl } = await supabase.storage
        .from("avatares")
        .createSignedUrl(caminho, DEZ_ANOS);
      if (erroUrl) throw erroUrl;

      onChange(data.signedUrl);
      toast.success("Foto atualizada!");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col items-start gap-4 sm:flex-row sm:items-center", className)}>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative rounded-full outline-none"
        aria-label="Enviar foto de perfil"
      >
        <Avatar className="size-20 border border-border shadow-sm">
          {url && <AvatarImage src={url} alt={nome ?? "Foto de perfil"} />}
          <AvatarFallback className="bg-surface-tint text-base font-semibold text-primary">
            {iniciais(nome)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition group-hover:bg-primary-hover">
          {enviando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={enviando}
            onClick={() => input.current?.click()}
          >
            {url ? "Trocar foto" : "Enviar foto"}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={enviando}
              onClick={() => onChange(null)}
            >
              <Trash2 className="mr-1.5 size-4" /> Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP até 5 MB. Uma foto clara do rosto passa mais confiança.
        </p>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void enviar(arquivo);
        }}
      />
    </div>
  );
}
