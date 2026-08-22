import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  Home as HomeIcon,
  Search,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";

import { BannerProtecao } from "@/components/home/banner-protecao";

const PASSOS = [
  { icon: Search, titulo: "Escolha o serviço" },
  { icon: CalendarClock, titulo: "Data e horário" },
  { icon: UserRound, titulo: "Profissional" },
  { icon: ShieldCheck, titulo: "Faxina segura" },
];

/** Home do cliente logado sem nenhuma reserva ativa. */
export function HomeClienteVazia({ nome }: { nome: string }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-5 md:max-w-2xl">
      <div>
        <h1 className="font-display text-[22px] font-bold leading-tight text-foreground">
          Olá, {nome}! 👋
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Pronto para deixar sua casa brilhando?
        </p>
      </div>

      <Link
        to="/contratar"
        className="flex min-h-[92px] items-center gap-4 rounded-[20px] bg-accent px-4 py-4 transition-transform duration-200 ease-out active:scale-[0.98]"
        style={{ color: "#04162F" }}
      >
        <Sprout size={30} strokeWidth={1.6} className="shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[19px] font-bold leading-tight">
            AGENDAR MINHA FAXINA
          </span>
          <span className="mt-0.5 block text-[13px] opacity-80">Preço na hora, sem surpresa</span>
        </span>
        <ChevronRight size={22} className="shrink-0" aria-hidden />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/reservas"
          className="rounded-[20px] border border-accent/20 bg-card p-4 transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          <CalendarCheck size={24} strokeWidth={1.6} className="text-accent" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-semibold text-foreground">
            Minhas reservas
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            Histórico de serviços
          </p>
        </Link>
        <Link
          to="/minha-conta"
          search={{ aba: "imoveis" }}
          className="rounded-[20px] border border-accent/20 bg-card p-4 transition-transform duration-200 ease-out active:scale-[0.98]"
        >
          <HomeIcon size={24} strokeWidth={1.6} className="text-accent" aria-hidden />
          <p className="mt-2 font-display text-[14px] font-semibold text-foreground">
            Imóveis cadastrados
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            Escolha onde será a faxina
          </p>
        </Link>
      </div>

      <section className="rounded-[20px] border border-accent/20 bg-card p-4">
        <h2 className="font-display text-[15px] font-semibold text-accent">Como funciona</h2>
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo} className="min-w-0">
              <div className="relative inline-flex">
                <span className="flex size-11 items-center justify-center rounded-xl bg-surface-tint">
                  <passo.icon size={22} strokeWidth={1.5} className="text-accent" aria-hidden />
                </span>
                <span className="absolute -left-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full border border-accent bg-background text-[10px] font-semibold text-accent">
                  {i + 1}
                </span>
              </div>
              <p className="mt-2 text-[12px] font-semibold leading-snug text-foreground">
                {passo.titulo}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <BannerProtecao curto />
    </div>
  );
}
