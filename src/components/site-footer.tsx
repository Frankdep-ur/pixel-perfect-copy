import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { linkSuporte } from "@/lib/whatsapp";
import logoLar77 from "@/assets/logo-lar77.png.asset.json";

const links = [
  { label: "Termos", to: "/termos" },
  { label: "Privacidade", to: "/privacidade" },
  { label: "Ajuda", to: "/ajuda" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-primary pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <img src={logoLar77.url} alt="Lar77" className="h-10 w-auto self-start" />
        <nav className="flex flex-wrap items-center gap-2 text-sm text-primary-foreground/75">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-12 items-center rounded-xl px-3 transition-colors duration-200 ease-out hover:text-accent active:scale-[0.98]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary-foreground/25 px-3 font-semibold text-primary-foreground transition-colors duration-200 ease-out hover:text-accent active:scale-[0.98]"
          >
            <LifeBuoy className="size-4" />
            Suporte
          </a>
        </nav>
        <p className="text-sm text-primary-foreground/75">© 2026 Lar77</p>
      </div>
    </footer>
  );
}
