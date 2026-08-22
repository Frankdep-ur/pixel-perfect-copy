import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EstadoVazio } from "@/components/estado-vazio";
import { useSession } from "@/hooks/use-auth";
import { labelTipoLimpeza } from "@/lib/catalogo";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens — Lar77" },
      {
        name: "description",
        content: "Converse com a profissional escalada para o seu serviço direto no app Lar77.",
      },
      { property: "og:title", content: "Mensagens — Lar77" },
      {
        property: "og:description",
        content: "Converse com a profissional escalada para o seu serviço.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Mensagens,
});

function Mensagens() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();

  useEffect(() => {
    if (!carregando && !user) {
      navigate({ to: "/entrar", search: { next: "/mensagens" }, replace: true });
    }
  }, [carregando, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["conversas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: mensagens, error } = await supabase
        .from("mensagens")
        .select("id, booking_id, conteudo, criado_em, lida_em, autor_id")
        .order("criado_em", { ascending: false });
      if (error) throw error;

      const ids = [...new Set((mensagens ?? []).map((m) => m.booking_id))];
      if (ids.length === 0) return [];

      const { data: bookings, error: erroBookings } = await supabase
        .from("bookings")
        .select("id, codigo, tipo_limpeza, data, status")
        .in("id", ids);
      if (erroBookings) throw erroBookings;

      return ids.map((id) => {
        const doBooking = (mensagens ?? []).filter((m) => m.booking_id === id);
        return {
          booking: bookings?.find((b) => b.id === id) ?? null,
          ultima: doBooking[0]!,
          naoLidas: doBooking.filter((m) => !m.lida_em && m.autor_id !== user!.id).length,
        };
      });
    },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="lar-container flex-1 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Mensagens</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas conversas sobre os serviços contratados.
        </p>

        {(isLoading || carregando) && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        )}

        {!isLoading && (data ?? []).length === 0 && (
          <EstadoVazio
            icon={MessageCircle}
            titulo="Nenhuma conversa ainda"
            texto={
              ehProfissional
                ? "O chat abre quando um cliente te escolhe para a faxina. Assim que isso acontecer, a conversa aparece aqui."
                : "O chat abre quando uma profissional aceita o seu serviço. Assim que isso acontecer, a conversa aparece aqui."
            }
            acaoLabel={ehProfissional ? "Ver oportunidades" : "Contratar faxina"}
            acaoTo={ehProfissional ? "/profissional" : "/contratar"}
          />
        )}

        {!isLoading && (data ?? []).length > 0 && (
          <ul className="mt-6 space-y-3">
            {(data ?? []).map((conversa) => (
              <li key={conversa.ultima.booking_id}>
                <Link
                  to="/minha-conta"
                  className="lar-card flex items-center gap-3 p-4 transition-colors duration-200 ease-out hover:border-accent"
                >
                  <span className="lar-icon-box size-11 shrink-0">
                    <MessageCircle size={20} strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {conversa.booking
                          ? `${labelTipoLimpeza(conversa.booking.tipo_limpeza)} · ${conversa.booking.codigo ?? ""}`
                          : "Serviço"}
                      </span>
                      {conversa.naoLidas > 0 && (
                        <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-[18px] text-accent-foreground">
                          {conversa.naoLidas}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {conversa.ultima.conteudo}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
