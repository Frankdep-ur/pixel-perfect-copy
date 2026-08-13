import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, CheckCircle2, Loader2, MapPin } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatBRL, labelTipoLimpeza } from "@/lib/catalogo";

export const Route = createFileRoute("/confirmacao/$id")({
  head: () => ({
    meta: [
      { title: "Contratação confirmada — LAR10" },
      {
        name: "description",
        content: "Sua limpeza foi agendada com uma profissional verificada do LAR10.",
      },
      { property: "og:title", content: "Contratação confirmada — LAR10" },
      {
        property: "og:description",
        content: "Sua limpeza foi agendada com uma profissional verificada do LAR10.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmacao,
});

function Confirmacao() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(
          "*, enderecos(rua, numero, bairro, cidade), profissionais(user_id, profiles!profissionais_user_id_fkey(nome))",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return booking;
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && !data && (
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Contratação não encontrada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Faça login com a conta usada na contratação para visualizar os detalhes.
            </p>
            <Button asChild className="mt-6">
              <Link to="/minha-conta">Ir para minha conta</Link>
            </Button>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-14 text-primary" />
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Limpeza confirmada!
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Código da contratação:{" "}
                <strong className="text-foreground">{data.codigo ?? "—"}</strong>
              </p>
            </div>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-3">
                  <CalendarCheck className="mt-0.5 size-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {data.data
                        ? new Date(`${data.data}T12:00:00`).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                          })
                        : "Data a definir"}
                      {data.hora ? ` às ${data.hora.slice(0, 5)}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Limpeza {labelTipoLimpeza(data.tipo_limpeza)} · {data.duracao_horas} horas
                    </p>
                  </div>
                </div>

                {data.enderecos && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-5 text-primary" />
                    <p className="text-sm">
                      {data.enderecos.rua}, {data.enderecos.numero} — {data.enderecos.bairro},{" "}
                      {data.enderecos.cidade}
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">Total pago</span>
                  <span className="text-2xl font-semibold text-primary">
                    {formatBRL(Number(data.valor_total))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="flex-1">
                <Link to="/minha-conta">Acompanhar na minha conta</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">Voltar ao início</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
