import { Link } from "@tanstack/react-router";

const links = [
  { label: "Termos", to: "/termos" },
  { label: "Privacidade", to: "/privacidade" },
  { label: "Ajuda", to: "/ajuda" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-primary pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-lg font-bold text-primary-foreground">LAR10</span>
        <nav className="flex flex-wrap gap-2 text-sm text-primary-foreground/75">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="inline-flex min-h-12 items-center rounded-xl px-3 transition-colors duration-200 ease-out hover:text-accent active:scale-[0.98]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-primary-foreground/75">© 2026 LAR10</p>
      </div>
    </footer>
  );
}
