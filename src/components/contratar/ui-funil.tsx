import { ArrowLeft, ChevronRight, Clock, Headset } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { linkSuporte } from "@/lib/whatsapp";

/** Grupos do funil mostrados como 4 bolinhas, como no mockup. */
export const GRUPOS_FUNIL = [
  "Local e imóvel",
  "Serviço e duração",
  "Data e detalhes",
  "Profissional e pagamento",
] as const;

/**
 * Topo do funil: seta voltar, stepper de 4 círculos e headset.
 * Sem logo — cada etapa precisa do espaço vertical para as opções.
 */
export function TopoFunil({
  grupoAtual,
  onVoltar,
  podeVoltar = true,
}: {
  grupoAtual: number;
  onVoltar: () => void;
  podeVoltar?: boolean;
}) {
  return (
    <div className="flex h-14 items-center gap-2">
      <button
        type="button"
        onClick={onVoltar}
        disabled={!podeVoltar}
        aria-label="Voltar"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-accent transition-transform duration-200 ease-out active:scale-[0.96] disabled:opacity-40"
      >
        <ArrowLeft size={22} strokeWidth={1.75} />
      </button>

      <ol className="flex flex-1 items-center justify-center">
        {GRUPOS_FUNIL.map((grupo, i) => {
          const passado = i + 1 <= grupoAtual;
          return (
            <li key={grupo} className="flex items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn("h-0.5 w-6 md:w-10", passado ? "bg-accent" : "bg-border")}
                />
              )}
              <span
                aria-current={i + 1 === grupoAtual ? "step" : undefined}
                title={grupo}
                className={cn(
                  "flex size-[26px] items-center justify-center rounded-full text-[12px] font-semibold",
                  passado ? "bg-accent" : "bg-surface-tint text-muted-foreground",
                )}
                style={passado ? { color: "#04162F" } : undefined}
              >
                {i + 1}
              </span>
            </li>
          );
        })}
      </ol>

      <a
        href={linkSuporte()}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com o suporte"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-accent transition-transform duration-200 ease-out active:scale-[0.96]"
      >
        <Headset size={22} strokeWidth={1.5} />
      </a>
    </div>
  );
}

/** Pergunta da etapa: título grande centralizado + subtítulo em duas linhas. */
export function CabecalhoPasso({
  titulo,
  subtitulo,
}: {
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <div className="text-center">
      <h1 className="font-display text-[24px] font-bold leading-tight text-foreground">
        {titulo}
      </h1>
      {subtitulo && (
        <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-snug text-muted-foreground">
          {subtitulo}
        </p>
      )}
    </div>
  );
}

/** Card de opção em linha: ícone, rótulo, selo opcional e chevron. */
export function CardOpcao({
  icone: Icone,
  label,
  selo,
  ativo,
  onClick,
}: {
  icone?: LucideIcon;
  label: string;
  selo?: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "flex w-full items-center gap-3 rounded-[14px] px-4 text-left transition-colors duration-200 ease-out active:scale-[0.99]",
        selo ? "min-h-[72px] py-3" : "h-[72px]",
        ativo ? "border border-accent bg-surface-tint" : "border border-transparent bg-surface",
      )}
    >
      {Icone && <Icone size={34} strokeWidth={1.5} className="shrink-0 text-accent" aria-hidden />}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[17px] font-semibold leading-tight text-foreground">
          {label}
        </span>
        {selo && (
          <span className="mt-1 inline-block rounded-full border border-accent px-2 py-0.5 text-[11px] font-semibold text-accent">
            {selo}
          </span>
        )}
      </span>
      <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

/** Card de duração/serviço: círculo com relógio, nome, pílula de horas e valor. */
export function CardDuracao({
  nome,
  horas,
  descricao,
  valor,
  ativo,
  onClick,
}: {
  nome: string;
  horas: string;
  descricao: string;
  valor: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "flex min-h-[108px] w-full items-center gap-3 rounded-[14px] p-4 text-left transition-colors duration-200 ease-out active:scale-[0.99]",
        ativo ? "border border-accent bg-surface-tint" : "border border-transparent bg-surface",
      )}
    >
      <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full border border-accent text-accent">
        <Clock size={26} strokeWidth={1.5} aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[20px] font-bold leading-tight text-foreground">
          {nome}
        </span>
        <span className="mt-1 inline-block rounded-full border border-accent px-2 py-0.5 text-[12px] font-semibold text-accent">
          {horas}
        </span>
        <span className="mt-1 block text-[13px] leading-snug text-muted-foreground line-clamp-2">
          {descricao}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span className="text-[11px] text-muted-foreground">A partir de</span>
        <span className="font-display text-[22px] font-bold leading-none text-accent">{valor}</span>
        <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
      </span>
    </button>
  );
}
