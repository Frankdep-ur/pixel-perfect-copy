import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, LogOut, Menu, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession, usePapeis } from "@/hooks/use-auth";
import { linkSuporte } from "@/lib/whatsapp";
import logoLar77 from "@/assets/logo-lar77.png.asset.json";

const navLinksCliente = [{ label: "Como funciona", href: "/#como-funciona" }];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: papeis } = usePapeis(user);
  const ehAdmin = (papeis ?? []).includes("admin");
  const ehProfissional = (papeis ?? []).includes("profissional");

  async function sair() {
    setOpen(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:h-16">

        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          <img src={logoLar77.url} alt="Lar77 — diaristas de confiança" className="h-9 w-auto" />
          <span className="sr-only">Lar77</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinksCliente.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary"
          >
            <LifeBuoy className="size-4" />
            Suporte
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {ehAdmin && (
            <Link
              to="/admin"
              className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
            >
              <ShieldCheck className="size-4" />
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link
                to={ehProfissional ? "/profissional" : "/minha-conta"}
                className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
              >
                <UserRound className="size-4" />
                {ehProfissional ? "Minha área" : "Minha conta"}
              </Link>
              <button
                type="button"
                onClick={sair}
                className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
              >
                <LogOut className="size-4" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                search={{ next: undefined }}
                className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
              >
                <UserRound className="size-4" />
                Entrar
              </Link>
              <Link
                to="/profissional/entrar"
                search={{ next: undefined }}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
              >
                <Sparkles className="size-4" />
                Sou profissional
              </Link>
            </>
          )}

          {!ehProfissional && (
            <Link
              to="/contratar"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
            >
              Contratar agora
            </Link>
          )}

        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border text-primary transition-transform duration-200 ease-out active:scale-[0.98] md:hidden"
        >
          {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
        </button>
      </div>
      </header>

      {/* Painel de tela cheia no mobile — fora do header para não herdar o backdrop-blur */}
      <div

        className={`fixed inset-0 z-50 flex flex-col bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out md:hidden ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <img src={logoLar77.url} alt="Lar77" className="h-9 w-auto" />
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border text-primary transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <X strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 pt-4">
          {navLinksCliente.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              {link.label}
            </a>
          ))}
          <span className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Acessos
          </span>
          {user ? (
            <>
              <Link
                to={ehProfissional ? "/profissional" : "/minha-conta"}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <UserRound className="size-5" />
                {ehProfissional ? "Minha área" : "Minha conta"}
              </Link>
              {ehAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
                >
                  <ShieldCheck className="size-5" />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={sair}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <LogOut className="size-5" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                to="/entrar"
                search={{ next: undefined }}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <UserRound className="size-5" />
                Acesso cliente
              </Link>
              <Link
                to="/profissional/entrar"
                search={{ next: undefined }}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <Sparkles className="size-5" />
                Acesso profissional
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-base font-medium text-muted-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <ShieldCheck className="size-5" />
                Acesso administrativo
              </Link>
            </>
          )}

          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="mt-4 flex min-h-14 items-center gap-2 rounded-xl bg-surface-tint px-3 text-base font-semibold text-primary transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <LifeBuoy className="size-5" />
            Falar com o suporte
          </a>
        </nav>

        {!ehProfissional && (
          <div className="px-5 pb-6">
            <Link
              to="/contratar"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 ease-out active:scale-[0.98]"
            >
              Contratar agora
            </Link>
          </div>
        )}

      </div>
    </>

  );
}
