import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Shuffle, Star, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { labelTipoLimpeza } from "@/lib/catalogo";
import { formatarDataLonga } from "@/lib/agenda";
import { disponiveisQuery, type ProfissionalPublica } from "@/lib/queries";
import { CENTRO_REGIAO, distanciaKm, type RegiaoId } from "@/lib/regioes";
import type { Rascunho } from "@/lib/contratacao";

type Props = {
  rascunho: Rascunho;
  atualizar: (parcial: Partial<Rascunho>) => void;
  onAvancar: () => void;
};

function ordenar(lista: ProfissionalPublica[], rascunho: Rascunho) {
  const regiao = rascunho.endereco.regiao as RegiaoId | null;
  const centro = regiao ? CENTRO_REGIAO[regiao] : null;
  const alvoLat = rascunho.endereco.latitude ?? centro?.lat ?? null;
  const alvoLng = rascunho.endereco.longitude ?? centro?.lng ?? null;

  return lista
    .map((p) => {
      const distancia =
        alvoLat !== null && alvoLng !== null && p.latitude !== null && p.longitude !== null
          ? distanciaKm(alvoLat, alvoLng, p.latitude, p.longitude)
          : null;
      return { ...p, distancia };
    })
    .filter((p) => (p.distancia === null ? true : p.distancia <= p.raio_km))
    .sort((a, b) => {
      if (b.nota_media !== a.nota_media) return b.nota_media - a.nota_media;
      return (a.distancia ?? 999) - (b.distancia ?? 999);
    });
}

export function EscolhaProfissional({ rascunho, atualizar, onAvancar }: Props) {
  const { data, isLoading } = useQuery(
    disponiveisQuery(rascunho.endereco.regiao, rascunho.data, rascunho.tipo_limpeza),
  );

  const lista = useMemo(() => ordenar(data ?? [], rascunho), [data, rascunho]);
  const podeAvancar = rascunho.escolha_automatica
    ? lista.length > 0
    : !!rascunho.profissional_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Escolha sua profissional</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Disponíveis em {formatarDataLonga(rascunho.data)}
          {rascunho.hora ? ` às ${rascunho.hora}` : ""} para limpeza{" "}
          {labelTipoLimpeza(rascunho.tipo_limpeza).toLowerCase()} em{" "}
          {rascunho.endereco.cidade || "sua região"}.
        </p>
      </div>

      {lista.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium">Nenhuma profissional disponível nessa data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Volte um passo e escolha outra data ou horário — mostramos apenas quem realmente
            pode atender.
          </p>
        </div>
      )}

      {lista.length > 0 && (
        <button
          type="button"
          onClick={() => atualizar({ escolha_automatica: true, profissional_id: null })}
          className={cn(
            "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all",
            rascunho.escolha_automatica
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/60",
          )}
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/12">
            <Shuffle className="size-5 text-primary" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">Deixe que a LAR10 escolha</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Sorteamos entre as {lista.length} profissionais disponíveis e verificadas para o
              seu horário.
            </span>
          </span>
        </button>
      )}

      <div className="space-y-3">
        {lista.map((p) => {
          const ativo = !rascunho.escolha_automatica && rascunho.profissional_id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => atualizar({ profissional_id: p.id, escolha_automatica: false })}
              className={cn(
                "flex w-full items-start gap-4 rounded-xl border-2 bg-card p-4 text-left transition-all",
                ativo ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
              )}
            >
              <Avatar className="size-14">
                {p.foto_url && <AvatarImage src={p.foto_url} alt={p.nome} />}
                <AvatarFallback>{p.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.nome}</span>
                  {p.verificada && (
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="size-3" /> Verificada
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Star className="size-4 fill-primary text-primary" />
                    {p.nota_media.toFixed(1)}
                  </span>
                  <span>{p.total_avaliacoes} avaliações</span>
                  <span>{p.total_servicos} serviços</span>
                  {p.distancia !== null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-4" /> {p.distancia.toFixed(0)} km
                    </span>
                  )}
                </div>
                {p.bio && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Button className="w-full" size="lg" disabled={!podeAvancar} onClick={onAvancar}>
        Continuar para o pagamento
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        A profissional confirma o pedido antes de receber seus dados de contato e endereço.
      </p>
    </div>
  );
}
