import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, UserRound, X } from "lucide-react";

import { useSession } from "@/hooks/use-auth";

const navLinks = [
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Segurança", href: "/#seguranca" },
  { label: "Seja profissional", href: "/#profissionais" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-display text-xl font-bold text-primary">
          LAR10
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={user ? "/minha-conta" : "/auth"}
            search={{ next: undefined }}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <UserRound className="size-4" />
            {user ? "Minha conta" : "Entrar"}
          </Link>
          <Link
            to="/contratar"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Contratar agora
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-primary md:hidden"
        >
          {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-card px-5 pb-5 pt-2 md:hidden">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            to="/contratar"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            Contratar agora
          </Link>
        </div>
      ) : null}
    </header>
  );
}
