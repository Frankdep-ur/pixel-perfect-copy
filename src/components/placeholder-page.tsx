import type { LucideIcon } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function PlaceholderPage({
  icon: Icon,
  titulo,
  texto,
  children,
}: {
  icon: LucideIcon;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-14 md:py-20">
        <div className="flex w-full max-w-md flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Icon strokeWidth={1.5} className="h-6 w-6 text-muted-foreground" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl text-foreground md:text-3xl">{titulo}</h1>
          <p className="mt-3 text-base text-muted-foreground">{texto}</p>
          {children ? <div className="mt-8 w-full">{children}</div> : null}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
