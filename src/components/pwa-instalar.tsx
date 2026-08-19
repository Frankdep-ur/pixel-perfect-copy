import { useEffect, useState } from "react";
import { Share, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

type PromptEvento = Event & { prompt: () => Promise<void> };

/** Convite discreto para adicionar o Lar77 à tela de início do celular. */
export function PwaInstalar({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<PromptEvento | null>(null);
  const [ios, setIos] = useState(false);
  const [mostrarPassos, setMostrarPassos] = useState(false);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalado(true);
      return;
    }
    const ua = window.navigator.userAgent;
    setIos(/iPad|iPhone|iPod/.test(ua));

    const capturar = (evento: Event) => {
      evento.preventDefault();
      setPrompt(evento as PromptEvento);
    };
    window.addEventListener("beforeinstallprompt", capturar);
    return () => window.removeEventListener("beforeinstallprompt", capturar);
  }, []);

  if (instalado) return null;
  if (!prompt && !ios) return null;

  return (
    <div className={`rounded-xl border border-border bg-card/60 p-3 text-sm ${className}`}>
      <div className="flex items-center gap-2">
        <Smartphone className="size-4 text-primary" strokeWidth={1.5} />
        <p className="font-medium">Adicionar Lar77 à tela de início</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Assim as oportunidades abrem direto no app, sem passar pelo navegador.
      </p>
      {prompt ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => {
            void prompt.prompt();
            setPrompt(null);
          }}
        >
          Instalar agora
        </Button>
      ) : mostrarPassos ? (
        <ol className="mt-3 space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Share className="size-3.5 text-primary" strokeWidth={1.5} /> 1. Toque em
            Compartilhar, na barra do Safari
          </li>
          <li>2. Escolha “Adicionar à Tela de Início”</li>
          <li>3. Confirme em “Adicionar”</li>
        </ol>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => setMostrarPassos(true)}
        >
          Como instalar no iPhone
        </Button>
      )}
    </div>
  );
}
