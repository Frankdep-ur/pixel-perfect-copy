import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Palette, Type } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LimparContasTeste } from "@/components/admin/excluir-conta";
import {
  CORES_PADRAO,
  TEXTOS_PADRAO,
  type CoresSite,
  type TextosSite,
  salvarConfig,
  siteConfigQuery,
} from "@/lib/site-config";

export const Route = createFileRoute("/admin/config")({
  component: AdminConfig,
});

const DEZ_ANOS = 60 * 60 * 24 * 365 * 10;

const CAMPOS_TEXTO: { chave: keyof TextosSite; label: string; longo?: boolean }[] = [
  { chave: "slogan", label: "Slogan principal (hero)" },
  { chave: "hero_botao_cliente", label: "Botão do cliente" },
  { chave: "hero_botao_profissional", label: "Botão da profissional" },
  { chave: "como_titulo", label: "Título — Como funciona" },
  { chave: "como_subtitulo", label: "Subtítulo — Como funciona", longo: true },
  { chave: "garantia_titulo", label: "Título — Garantia" },
  { chave: "garantia_texto", label: "Texto — Garantia", longo: true },
  { chave: "garantia_fechamento", label: "Fechamento — Garantia" },
  { chave: "prof_titulo", label: "Título — Profissionais" },
  { chave: "prof_chamada", label: "Chamada — Profissionais" },
  { chave: "prof_texto", label: "Texto — Profissionais", longo: true },
  { chave: "prof_fechamento_1", label: "Fechamento profissionais 1" },
  { chave: "prof_fechamento_2", label: "Fechamento profissionais 2" },
  { chave: "prof_fechamento_3", label: "Fechamento profissionais 3" },
  { chave: "rodape", label: "Frase do rodapé", longo: true },
];

const CAMPOS_COR: { chave: keyof CoresSite; label: string }[] = [
  { chave: "primary", label: "Cor principal (azul-marinho)" },
  { chave: "accent", label: "Cor de destaque (dourado)" },
  { chave: "background", label: "Fundo do site" },
];

function AdminConfig() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(siteConfigQuery);
  const [textos, setTextos] = useState<TextosSite>(TEXTOS_PADRAO);
  const [cores, setCores] = useState<CoresSite>(CORES_PADRAO);
  const [logo, setLogo] = useState<string>("");
  const [enviando, setEnviando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setTextos(data.textos);
    setCores(data.cores);
    setLogo(data.logo_url);
  }, [data]);

  function invalidar() {
    queryClient.invalidateQueries({ queryKey: ["site_config"] });
  }

  const salvarTextos = useMutation({
    mutationFn: () => salvarConfig("textos", textos),
    onSuccess: () => {
      toast.success("Textos do site atualizados.");
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const salvarCores = useMutation({
    mutationFn: () => salvarConfig("cores", cores),
    onSuccess: () => {
      toast.success("Cores atualizadas.");
      invalidar();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  async function enviarLogo(arquivo: File) {
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Escolha uma imagem (PNG, JPG ou WebP).");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      toast.error("A logo precisa ter no máximo 5 MB.");
      return;
    }
    setEnviando(true);
    try {
      const caminho = `logo/${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, "")}`;
      const { error: erroUpload } = await supabase.storage
        .from("site")
        .upload(caminho, arquivo, { upsert: true });
      if (erroUpload) throw erroUpload;

      const { data: assinada, error: erroUrl } = await supabase.storage
        .from("site")
        .createSignedUrl(caminho, DEZ_ANOS);
      if (erroUrl || !assinada) throw erroUrl ?? new Error("Não foi possível gerar o link.");

      await salvarConfig("logo", { url: assinada.signedUrl });
      setLogo(assinada.signedUrl);
      toast.success("Logo atualizada.");
      invalidar();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao enviar a logo.");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TituloSecao
        titulo="Configurações do sistema"
        texto="Altere textos, logo e cores do site. O carrossel da home fica em Admin → Carrossel."
      />

      <Painel className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <ImagePlus className="size-4 text-primary" aria-hidden /> Logo
        </h2>
        {logo && (
          <img
            src={logo}
            alt="Logo atual da Lar77"
            className="h-20 w-auto rounded-lg bg-primary p-2"
          />
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) void enviarLogo(arquivo);
            e.target.value = "";
          }}
        />
        <Button variant="outline" disabled={enviando} onClick={() => input.current?.click()}>
          {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enviar nova logo
        </Button>
      </Painel>

      <Painel className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Type className="size-4 text-primary" aria-hidden /> Textos do site
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {CAMPOS_TEXTO.map((campo) => (
            <div key={campo.chave} className={campo.longo ? "space-y-2 md:col-span-2" : "space-y-2"}>
              <Label htmlFor={`t-${campo.chave}`}>{campo.label}</Label>
              {campo.longo ? (
                <Textarea
                  id={`t-${campo.chave}`}
                  rows={3}
                  value={textos[campo.chave]}
                  onChange={(e) => setTextos({ ...textos, [campo.chave]: e.target.value })}
                />
              ) : (
                <Input
                  id={`t-${campo.chave}`}
                  value={textos[campo.chave]}
                  onChange={(e) => setTextos({ ...textos, [campo.chave]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={salvarTextos.isPending} onClick={() => salvarTextos.mutate()}>
            {salvarTextos.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar textos
          </Button>
          <Button variant="ghost" onClick={() => setTextos(TEXTOS_PADRAO)}>
            Restaurar padrão
          </Button>
        </div>
      </Painel>

      <Painel className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <Palette className="size-4 text-primary" aria-hidden /> Cores
        </h2>
        <p className="text-sm text-muted-foreground">
          Use valores em <code>oklch(...)</code> ou hexadecimal (ex.: <code>#1B2A4A</code>).
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {CAMPOS_COR.map((campo) => (
            <div key={campo.chave} className="space-y-2">
              <Label htmlFor={`c-${campo.chave}`}>{campo.label}</Label>
              <div className="flex items-center gap-2">
                <span
                  className="size-9 shrink-0 rounded-lg border border-border"
                  style={{ background: cores[campo.chave] }}
                  aria-hidden
                />
                <Input
                  id={`c-${campo.chave}`}
                  value={cores[campo.chave]}
                  onChange={(e) => setCores({ ...cores, [campo.chave]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={salvarCores.isPending} onClick={() => salvarCores.mutate()}>
            {salvarCores.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar cores
          </Button>
          <Button variant="ghost" onClick={() => setCores(CORES_PADRAO)}>
            Restaurar padrão
          </Button>
        </div>
      </Painel>

      <LimparContasTeste />
    </div>
  );
}
