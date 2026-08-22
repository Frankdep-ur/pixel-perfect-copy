import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Loader2, MapPin, Radar, Star } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContagem } from "@/hooks/use-contagem";
import { formatBRL } from "@/lib/catalogo";
import { formatarDataLonga } from "@/lib/agenda";
import { linkSuporte } from "@/lib/whatsapp";
import {
  abrirRodada,
  contarConvitesAbertos,
  formatarContagem,
  listarAceites,
  reservarProfissional,
  type ProfissionalAceite,
} from "@/lib/orquestra";
import type { Rascunho } from "@/lib/contratacao";
import type { Orcamento } from "@/lib/pricing";

const MAX_RODADAS = 1;

type Props = {
  rascunho: Rascunho;
  orcamento: Orcamento;
  extras: { id: string; preco: number }[];
  userId: string;
  pedido: { id: string; codigo: string | null } | null;
  onPedidoCriado: (pedido: { id: string; codigo: string | null }) => void;
  onEscolhida: (dados: { profissional: ProfissionalAceite; reservaAte: string }) => void;
  onVoltar: () => void;
};

export function BuscaOrquestra({
  rascunho,
  orcamento,
  extras,
  userId,
  pedido,
  onPedidoCriado,
  onEscolhida,
  onVoltar,
}: Props) {
  const criando = useRef(false);
  const [erro, setErro] = useState<string | null>(null);
  const [rodada, setRodada] = useState(1);
  const [rodadaAte, setRodadaAte] = useState<string | null>(null);
  const [encerrado, setEncerrado] = useState(false);
  const [escolhendo, setEscolhendo] = useState<string | null>(null);
  const restante = useContagem(rodadaAte);

  // 1. Cria o pedido em busca e dispara a primeira rodada de convites.
  useEffect(() => {
    if (pedido || criando.current) return;
    criando.current = true;

    (async () => {
      try {
        const endereco = rascunho.endereco;
        let enderecoId = rascunho.endereco_id;

        if (!enderecoId) {
          const { data: salvo, error } = await supabase
            .from("enderecos")
            .insert({
              user_id: userId,
              cep: endereco.cep,
              rua: endereco.rua,
              numero: endereco.numero,
              complemento: endereco.complemento,
              bairro: endereco.bairro,
              cidade: endereco.cidade,
              estado: endereco.estado,
              regiao: endereco.regiao,
            })
            .select("id")
            .single();
          if (error) throw error;
          enderecoId = salvo.id;
        }

        const { data: novo, error: erroBooking } = await supabase
          .from("bookings")
          .insert({
            cliente_id: userId,
            endereco_id: enderecoId,
            regiao: endereco.regiao,
            tipo_imovel: rascunho.tipo_imovel,
            quartos: rascunho.quartos,
            salas: rascunho.salas,
            banheiros: rascunho.banheiros,
            cozinha: rascunho.cozinhas > 0,
            cozinhas: rascunho.cozinhas,
            copa: rascunho.copa,
            salas_reuniao: rascunho.salas_reuniao,
            recepcao: rascunho.recepcao,
            faixa_pessoas: rascunho.faixa_pessoas,
            faixa_metragem: rascunho.faixa_metragem,
            qtd_profissionais: orcamento.qtdProfissionais,
            area_externa: rascunho.area_externa,
            outros_ambientes: rascunho.outros_ambientes,
            duracao_horas: rascunho.duracao_horas!,
            tipo_limpeza: rascunho.tipo_limpeza!,
            data: rascunho.data,
            hora: rascunho.hora,
            observacoes: rascunho.observacoes,
            status: "buscando",
            valor_profissional: orcamento.valorProfissional,
            taxa_admin: orcamento.taxaAdminBase,
            valor_seguro: orcamento.valorSeguro,
            valor_extras: orcamento.valorExtras,
            valor_total: orcamento.total,
          })
          .select("id, codigo")
          .single();
        if (erroBooking) throw erroBooking;

        const escolhidos = extras.filter((e) => rascunho.extras_ids.includes(e.id));
        if (escolhidos.length > 0) {
          const { error: erroExtras } = await supabase.from("booking_extras").insert(
            escolhidos.map((e) => ({
              booking_id: novo.id,
              extra_id: e.id,
              preco_congelado: Number(e.preco),
            })),
          );
          if (erroExtras) throw erroExtras;
        }

        const convidadas = await abrirRodada(novo.id);
        setRodadaAte(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        if (convidadas === 0) setEncerrado(true);
        onPedidoCriado(novo);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não conseguimos iniciar a busca.");
      }
    })();
  }, [pedido, rascunho, orcamento, extras, userId, onPedidoCriado]);

  // 2. As profissionais aparecem conforme aceitam: tempo real + reconsulta curta.
  const { data: aceites = [], refetch } = useQuery({
    queryKey: ["orquestra-aceites", pedido?.id],
    enabled: !!pedido,
    refetchInterval: 4000,
    queryFn: () => listarAceites(pedido!.id),
  });

  useEffect(() => {
    if (!pedido) return;
    const canal = supabase
      .channel(`convites-${pedido.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_convites", filter: `booking_id=eq.${pedido.id}` },
        () => void refetch(),
      )
      .subscribe();
    return () => void supabase.removeChannel(canal);
  }, [pedido, refetch]);

  // 3. Prazo da rodada acabou sem aceites: abrimos automaticamente outra rodada.
  useEffect(() => {
    if (!pedido || encerrado || restante > 0 || !rodadaAte) return;
    let cancelado = false;

    (async () => {
      try {
        const abertos = await contarConvitesAbertos(pedido.id);
        if (cancelado || abertos > 0) return;
        if (rodada >= MAX_RODADAS) {
          setEncerrado(true);
          return;
        }
        const convidadas = await abrirRodada(pedido.id);
        if (cancelado) return;
        if (convidadas === 0) {
          setEncerrado(true);
          return;
        }
        setRodada((r) => r + 1);
        setRodadaAte(new Date(Date.now() + 5 * 60 * 1000).toISOString());
        void refetch();
      } catch {
        setEncerrado(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [pedido, restante, rodada, rodadaAte, encerrado, refetch]);

  async function escolher(p: ProfissionalAceite) {
    if (!pedido) return;
    setEscolhendo(p.profissional_id);
    try {
      const ate = await reservarProfissional(pedido.id, p.profissional_id);
      onEscolhida({ profissional: p, reservaAte: ate });
    } catch (e) {
      toast.error("Não conseguimos reservar essa profissional", {
        description: e instanceof Error ? e.message : undefined,
      });
      void refetch();
    } finally {
      setEscolhendo(null);
    }
  }

  if (erro) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-medium">Não conseguimos iniciar a busca</p>
        <p className="mt-1 text-sm text-muted-foreground">{erro}</p>
        <Button className="mt-4" variant="outline" onClick={onVoltar}>
          Revisar o pedido
        </Button>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="font-medium">Aguarde enquanto procuramos as melhores profissionais</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-border bg-card p-7 text-center">
        <span className="relative mx-auto flex size-28 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border border-primary/40" />
          <span className="absolute inset-3 rounded-full border border-primary/25" />
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/15">
            <MapPin className="size-7 text-primary" />
          </span>
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          {aceites.length > 0
            ? aceites.length === 1
              ? "Encontramos uma profissional para você!"
              : `Encontramos ${aceites.length} profissionais para você!`
            : "Buscando a profissional ideal..."}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatarDataLonga(rascunho.data)}
          {rascunho.hora ? ` às ${rascunho.hora}` : ""} ·{" "}
          {rascunho.endereco.cidade || "sua região"}
        </p>
        {!encerrado && (
          <p className="mt-3 text-sm text-muted-foreground">
            Rodada {rodada} de {MAX_RODADAS} · aguardando respostas por{" "}
            <span className="font-semibold text-primary">{formatarContagem(restante)}</span>
          </p>
        )}
        {pedido.codigo && (
          <p className="mt-2 text-xs text-muted-foreground">Pedido {pedido.codigo}</p>
        )}
      </div>

      {aceites.length > 0 && (
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h3 className="font-display text-[17px] font-semibold text-accent">
              Profissionais disponíveis
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Encontramos {aceites.length}{" "}
              {aceites.length === 1 ? "profissional próxima" : "profissionais próximas"} a você
            </p>
          </div>
        </div>
      )}

      {aceites.map((p) => {
        // Em telas de 361px nada cabe numa linha só: duas faixas dentro do card.
        const tags = [
          p.verificada ? "Verificada" : null,
          p.anos_experiencia ? `${p.anos_experiencia} anos` : null,
        ]
          .filter((t): t is string => !!t)
          .slice(0, 2);

        return (
          <div key={p.convite_id} className="rounded-[14px] bg-surface p-[14px]">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                {p.foto_url && <AvatarImage src={p.foto_url} alt={p.nome ?? "Profissional"} />}
                <AvatarFallback>{(p.nome ?? "LA").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[17px] font-semibold text-foreground">
                  {p.nome ?? "Profissional Lar77"}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-foreground">
                  <Star className="size-3.5 fill-accent text-accent" />
                  {p.nota_media.toFixed(1).replace(".", ",")}
                  <span className="text-muted-foreground">· {p.total_servicos} serviços</span>
                </p>
                {p.distancia_km != null && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {p.distancia_km.toFixed(1).replace(".", ",")} km de você
                  </p>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-end justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-accent px-2 py-0.5 text-[11px] font-semibold text-accent"
                  >
                    {tag === "Verificada" && <BadgeCheck className="size-3" />}
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">A partir de</p>
                  <p className="font-display text-[17px] font-bold text-accent">
                    {formatBRL(orcamento.total)}
                  </p>
                </div>
                <Button
                  className="h-9 rounded-lg px-4 font-semibold"
                  disabled={escolhendo !== null}
                  onClick={() => void escolher(p)}
                >
                  {escolhendo === p.profissional_id && (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  )}
                  Ver perfil
                </Button>
              </div>
            </div>
          </div>
        );
      })}


      {aceites.length === 0 && !encerrado && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-dashed border-border p-4"
            >
              <div className="size-16 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
          <p className="text-center text-sm text-muted-foreground">
            Avisamos as profissionais disponíveis da sua região. Assim que uma aceitar, ela
            aparece aqui.
          </p>
        </div>
      )}

      {encerrado && aceites.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium">Nenhuma profissional livre nessa data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As profissionais da sua região já estão com a agenda cheia em{" "}
            {formatarDataLonga(rascunho.data)}. Escolha outra data ou horário — ou fale com a nossa
            equipe, que continua procurando para você.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={onVoltar}>
              Trocar data ou horário
            </Button>
            <Button asChild variant="ghost">
              <a href={linkSuporte()} target="_blank" rel="noreferrer">
                Falar com o suporte
              </a>
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        O pagamento de {formatBRL(orcamento.total)} só acontece depois que você escolher a
        profissional. Seu endereço completo e contato ficam visíveis apenas para a profissional
        contratada.
      </p>
      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <MapPin className="size-3" /> Buscamos apenas profissionais que atendem a sua região.
      </p>
    </div>
  );
}
