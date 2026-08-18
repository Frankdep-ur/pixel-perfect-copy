import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Heart, Home, MessageCircle, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSession } from "@/hooks/use-auth";
import { useNaoLidas } from "@/hooks/use-nao-lidas";

/** Rotas em que a barra nunca aparece. */
const ROTAS_SEM_BARRA = ["/admin", "/contratar", "/auth"];

type Aba = {
  label: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, string>;
  exact?: boolean;
  badge?: number;
};

export function TabBarMobile() {
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: naoLidas } = useNaoLidas(user);

  const bloqueada = ROTAS_SEM_BARRA.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const visivel = !!user && !bloqueada;

  useEffect(() => {
    const classe = "com-tab-bar";
    document.documentElement.classList.toggle(classe, visivel);
    return () => document.documentElement.classList.remove(classe);
  }, [visivel]);

  if (!visivel) return null;

  const abas: Aba[] = [
    { label: "Início", icon: Home, to: "/", exact: true },
    { label: "Minhas reservas", icon: CalendarCheck, to: "/minha-conta" },
    { label: "Mensagens", icon: MessageCircle, to: "/mensagens", badge: naoLidas ?? 0 },
    { label: "Favoritos", icon: Heart, to: "/favoritos" },
    { label: "Conta", icon: UserRound, to: "/minha-conta", search: { aba: "perfil" } },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex items-stretch justify-between px-1">
        {abas.map((aba) => {
          const Icone = aba.icon;
          const ativa = aba.exact
            ? pathname === aba.to
            : aba.search
              ? false
              : pathname === aba.to || pathname.startsWith(`${aba.to}/`);
          return (
            <li key={aba.label} className="flex-1">
              <Link
                to={aba.to}
                {...(aba.search ? { search: aba.search as never } : {})}
                aria-label={aba.label}
                className={`flex min-h-[56px] min-w-12 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-200 ease-out ${
                  ativa ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <span className="relative inline-flex">
                  <Icone size={24} strokeWidth={1.5} aria-hidden />
                  {!!aba.badge && aba.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-accent-foreground">
                      {aba.badge > 99 ? "99+" : aba.badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-none">{aba.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
