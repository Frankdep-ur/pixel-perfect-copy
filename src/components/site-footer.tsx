export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-lg font-bold text-primary">LAR10</span>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <a href="#termos" className="hover:text-primary">
            Termos
          </a>
          <a href="#privacidade" className="hover:text-primary">
            Privacidade
          </a>
          <a href="#ajuda" className="hover:text-primary">
            Ajuda
          </a>
        </nav>
        <p className="text-sm text-muted-foreground">© 2026 LAR10</p>
      </div>
    </footer>
  );
}
