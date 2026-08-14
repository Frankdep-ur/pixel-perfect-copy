import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShieldCheck, UserRound, X } from "lucide-react";

import { useSession, usePapeis } from "@/hooks/use-auth";

const navLinksCliente = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Segurança", href: "/#seguranca" },
];

const navLinksProfissional = { label: "Seja profissional", href: "/seja-profissional" };

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { data: papeis } = usePapeis(user);
  const ehAdmin = (papeis ?? []).includes("admin");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 md:h-16">
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="font-display text-xl font-bold text-primary transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          LAR10
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary"
            >
              {link.label}
            </a>
          ))}
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
          <Link
            to={user ? "/minha-conta" : "/auth"}
            search={{ next: undefined }}
            className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
          >
            <UserRound className="size-4" />
            {user ? "Minha conta" : "Entrar"}
          </Link>
          <Link
            to="/contratar"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 ease-out hover:bg-primary-hover active:scale-[0.98]"
          >
            Contratar agora
          </Link>
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

      {/* Painel de tela cheia no mobile */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-transform duration-200 ease-out md:hidden ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <span className="font-display text-xl font-bold text-primary">LAR10</span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border text-primary transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <X strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-5 pt-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-14 items-center rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
            >
              {link.label}
            </a>
          ))}
          <Link
            to={user ? "/minha-conta" : "/auth"}
            search={{ next: undefined }}
            onClick={() => setOpen(false)}
            className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <UserRound className="size-5" />
            {user ? "Minha conta" : "Entrar"}
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
        </nav>

        <div className="px-5 pb-6">
          <Link
            to="/contratar"
            onClick={() => setOpen(false)}
            className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-all duration-200 ease-out active:scale-[0.98]"
          >
            Contratar agora
          </Link>
        </div>
      </div>
    </header>
  );
}
