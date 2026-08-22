import { Link } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

import { linkSuporte } from "@/lib/whatsapp";
import logoLar77 from "@/assets/logo-lar77.png.asset.json";
import { useSession } from "@/hooks/use-auth";

const links = [
  { label: "Termos", to: "/termos" },
  { label: "Privacidade", to: "/privacidade" },
  { label: "Ajuda", to: "/ajuda" },
] as const;

export function SiteFooter() {
  const { user } = useSession();

  return (
    <footer
      className={`border-t border-border bg-card ${
        user ? "hidden md:block" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between md:gap-6 md:py-8">
        <img src={logoLar77.url} alt="Lar77" className="h-8 w-auto self-start md:h-10" />
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-11 items-center rounded-2xl px-3 transition-colors duration-200 ease-out hover:text-primary active:scale-[0.98]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-border px-3 font-semibold text-primary transition-colors duration-200 ease-out hover:border-primary active:scale-[0.98]"
          >
            <LifeBuoy className="size-4" />
            Suporte
          </a>
        </nav>
        <p className="text-xs text-muted-foreground md:text-sm">© 2026 Lar77</p>
      </div>
    </footer>
  );
}
