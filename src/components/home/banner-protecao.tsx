import { Link } from "@tanstack/react-router";
import { ChevronRight, ShieldCheck } from "lucide-react";

/** Faixa de confiança usada nos dois estados da home do cliente. */
export function BannerProtecao({ curto = false }: { curto?: boolean }) {
  return (
    <Link
      to="/ajuda"
      className="flex items-center gap-3 rounded-[20px] border border-accent/25 bg-surface p-4 transition-transform duration-200 ease-out active:scale-[0.99]"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent/40">
        <ShieldCheck size={22} strokeWidth={1.6} className="text-accent" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold text-accent">
          Você e sua casa protegidos!
        </span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
          {curto
            ? "Profissionais verificadas e pagamento protegido."
            : "Profissionais verificadas pela Lar77 e pagamento protegido pela plataforma."}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
