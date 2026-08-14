import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BadgeDollarSign,
  ClipboardList,
  LayoutDashboard,
  ListPlus,
  Loader2,
  MailQuestion,
  Sparkles,
  Star,
  Users,
  UserCheck,
} from "lucide-react";

import { useSession, usePapeis } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — LAR10" },
      {
        name: "description",
        content:
          "Painel interno da LAR10: métricas, aprovação de profissionais, contratações, preços e extras.",
      },
      { property: "og:title", content: "Painel administrativo — LAR10" },
      { property: "og:description", content: "Painel interno de operação da LAR10." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const ITENS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCheck },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/contratacoes", label: "Contratações", icon: ClipboardList },
  { to: "/admin/precos", label: "Preços", icon: BadgeDollarSign },
  { to: "/admin/extras", label: "Extras", icon: ListPlus },
  { to: "/admin/lista-espera", label: "Lista de espera", icon: MailQuestion },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const { data: papeis, isLoading: carregandoPapeis } = usePapeis(user);
  const ehAdmin = (papeis ?? []).includes("admin");

  useEffect(() => {
    if (carregando) return;
    if (!user) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    if (!carregandoPapeis && !ehAdmin) navigate({ to: "/admin/login", replace: true });
  }, [carregando, carregandoPapeis, ehAdmin, navigate, user]);

  if (carregando || carregandoPapeis || !ehAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="border-b border-border bg-primary text-primary-foreground lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <Sparkles className="size-5" strokeWidth={1.5} aria-hidden />
          <span className="text-lg font-semibold tracking-tight">LAR10 Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {ITENS.map((item) => {
            const Icone = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: "exact" in item ? item.exact : false }}
                className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary-foreground/75 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                activeProps={{
                  className: "bg-primary-foreground/15 !text-primary-foreground",
                }}
              >
                <Icone className="size-4" strokeWidth={1.5} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-xs text-primary-foreground/60">
          <Link to="/" className="hover:text-primary-foreground">
            ← Voltar ao site
          </Link>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/admin/login", replace: true });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:text-primary-foreground"
          >
            <LogOut className="size-3.5" strokeWidth={1.5} aria-hidden />
            Sair
          </button>
        </div>
      </aside>


      <main className="w-full flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
