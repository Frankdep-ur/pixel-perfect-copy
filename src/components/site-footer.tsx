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
    <footer className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <img src={logoLar77.url} alt="Lar77" className="h-10 w-auto self-start" />
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-12 items-center rounded-2xl px-3 transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-border px-4 font-semibold text-primary transition-colors duration-200 ease-out hover:border-primary active:scale-[0.98]"
          >
            <LifeBuoy className="size-4" />
            Suporte
          </a>
        </nav>
        <p className="text-sm text-muted-foreground">© 2026 Lar77</p>
      </div>
    </footer>
  );
}
