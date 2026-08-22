import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/catalogo";

export function TituloSecao({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      {texto && <p className="mt-1 text-sm text-muted-foreground">{texto}</p>}
    </header>
  );
}

export function CardMetrica({
  label,
  valor,
  detalhe,
  destaque,
}: {
  label: string;
  valor: string | number;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]",
        destaque && "border-warning/40 bg-warning/10",
      )}
    >
      <p className="text-sm leading-snug text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold leading-tight tracking-tight">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}

export function Painel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

const VARIANTE_STATUS: Record<string, string> = {
  buscando: "bg-warning/12 text-warning-foreground border-warning/30",
  aguardando_aceite: "bg-warning/12 text-warning-foreground border-warning/30",
  sem_profissional: "bg-warning/12 text-warning-foreground border-warning/30",
  solicitada: "bg-warning/12 text-warning-foreground border-warning/30",
  aceita: "bg-accent/12 text-accent-foreground border-accent/30",
  confirmada: "bg-accent/12 text-accent-foreground border-accent/30",
  a_caminho: "bg-accent/12 text-accent-foreground border-accent/30",
  em_andamento: "bg-primary/12 text-primary border-primary/30",
  finalizada: "bg-primary/12 text-primary border-primary/30",
  concluida: "bg-primary/12 text-primary border-primary/30",
  cancelada: "bg-destructive/10 text-destructive border-destructive/30",
  pendente: "bg-warning/12 text-warning-foreground border-warning/30",
  aprovada: "bg-primary/12 text-primary border-primary/30",
  reprovada: "bg-destructive/10 text-destructive border-destructive/30",
  recusada: "bg-destructive/10 text-destructive border-destructive/30",
  bloqueada: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", VARIANTE_STATUS[status] ?? "bg-muted text-muted-foreground")}
    >
      {STATUS_LABEL[status] ?? rotuloStatusProfissional(status)}
    </Badge>
  );
}

export function rotuloStatusProfissional(status: string) {
  const mapa: Record<string, string> = {
    pendente: "Em análise",
    aprovada: "Aprovada",
    recusada: "Reprovada",
    reprovada: "Reprovada",
    bloqueada: "Bloqueada",
  };
  return mapa[status] ?? status;
}

export function formatarData(valor: string | null) {
  if (!valor) return "—";
  const d = new Date(valor.length <= 10 ? `${valor}T12:00:00` : valor);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
