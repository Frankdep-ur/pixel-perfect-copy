import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

export function CtaFixoMobile() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_oklch(0.3207_0.0487_184.57_/_0.22)] transition-all duration-200 ease-out md:hidden ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <Link
        to="/contratar"
        className="flex min-h-14 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
      >
        Contratar agora
      </Link>
    </div>
  );
}
