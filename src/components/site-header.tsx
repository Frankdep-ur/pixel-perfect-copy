import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Headset, LogOut, Menu, ShieldCheck, Sparkles, UserRound, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession, usePapeis } from "@/hooks/use-auth";
import { useNaoLidas } from "@/hooks/use-nao-lidas";
import { linkSuporte } from "@/lib/whatsapp";
import logoLar77 from "@/assets/logo-lar77.png.asset.json";

const navLinksCliente = [{ label: "Como funciona", href: "/#como-funciona" }];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: papeis } = usePapeis(user);
  const { data: naoLidas } = useNaoLidas(user);
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
    <header className="sticky top-0 z-40 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 md:h-16 md:justify-between md:px-5">

        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-11 items-center justify-center rounded-2xl text-accent transition-transform duration-200 ease-out active:scale-[0.96] md:hidden"
        >
          {open ? <X size={24} strokeWidth={1.75} /> : <Menu size={24} strokeWidth={1.75} />}
        </button>

        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="mx-auto flex h-11 flex-col items-center justify-center transition-transform duration-200 ease-out active:scale-[0.98] md:mx-0"
        >
          <img
            src={logoLar77.url}
            alt="Lar77 — diaristas de confiança"
            className="h-[34px] w-auto md:h-10"
          />
          <span
            className="mt-0.5 text-[9px] font-semibold uppercase leading-none text-accent"
            style={{ letterSpacing: "0.24em" }}
          >
            Diaristas de confiança
          </span>
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
            <Headset className="size-4" />
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

        {user ? (
          <Link
            to="/mensagens"
            aria-label="Notificações e mensagens"
            className="relative inline-flex size-11 items-center justify-center rounded-2xl text-accent transition-transform duration-200 ease-out active:scale-[0.96] md:hidden"
          >
            <Bell size={24} strokeWidth={1.5} />
            {!!naoLidas && naoLidas > 0 && (
              <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-destructive-foreground">
                {naoLidas > 99 ? "99+" : naoLidas}
              </span>
            )}
          </Link>
        ) : (
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            aria-label="Falar com o suporte"
            className="inline-flex size-11 items-center justify-center rounded-2xl text-accent transition-transform duration-200 ease-out active:scale-[0.96] md:hidden"
          >
            <Headset size={24} strokeWidth={1.5} />
          </a>
        )}

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
          {/* Cliente logado navega no app; visitante vê os links institucionais. */}
          {user && !ehProfissional ? (
            <>
              <Link
                to="/reservas"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <CalendarCheck className="size-5" />
                Minhas reservas
              </Link>
              <Link
                to="/contratar"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <Sparkles className="size-5" />
                Agendar minha faxina
              </Link>
              <Link
                to="/ajuda"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center gap-2 rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                <Headset className="size-5" />
                Ajuda / Suporte
              </Link>
            </>
          ) : (
            navLinksCliente.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center rounded-xl px-2 text-lg font-medium text-foreground transition-transform duration-200 ease-out active:scale-[0.98]"
              >
                {link.label}
              </a>
            ))
          )}
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
            <Headset className="size-5" />
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
