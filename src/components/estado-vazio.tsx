import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function EstadoVazio({
  icon: Icon,
  titulo,
  texto,
  acaoLabel,
  acaoTo,
  acao,
}: {
  icon: LucideIcon;
  titulo: string;
  texto: string;
  acaoLabel?: string;
  acaoTo?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]">
        <Icon strokeWidth={1.5} className="h-8 w-8 text-accent" aria-hidden />
      </span>
      <p className="mt-5 text-[18px] font-semibold text-foreground">{titulo}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{texto}</p>
      {acao ??
        (acaoLabel && acaoTo ? (
          <Link
            to={acaoTo}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
          >
            {acaoLabel}
          </Link>
        ) : null)}
    </div>
  );
}
