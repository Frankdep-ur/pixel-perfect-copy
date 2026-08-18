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

const MAX_RODADAS = 3;

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
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <span className="relative mx-auto flex size-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Radar className="size-7 text-primary" />
          </span>
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">
          {aceites.length > 0
            ? aceites.length === 1
              ? "Encontramos uma profissional para você!"
              : `Encontramos ${aceites.length} profissionais para você!`
            : "Estamos encontrando profissionais disponíveis para você"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatarDataLonga(rascunho.data)}
          {rascunho.hora ? ` às ${rascunho.hora}` : ""} ·{" "}
          {rascunho.endereco.cidade || "sua região"}
        </p>
        {!encerrado && (
          <p className="mt-3 text-sm text-muted-foreground">
            Rodada {rodada} de {MAX_RODADAS} · aguardando respostas por{" "}
            <span className="font-semibold text-foreground">{formatarContagem(restante)}</span>
          </p>
        )}
        {pedido.codigo && (
          <p className="mt-2 text-xs text-muted-foreground">Pedido {pedido.codigo}</p>
        )}
      </div>

      {aceites.map((p) => (
        <div key={p.convite_id} className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              {p.foto_url && <AvatarImage src={p.foto_url} alt={p.nome ?? "Profissional"} />}
              <AvatarFallback>{(p.nome ?? "LA").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{p.nome ?? "Profissional Lar77"}</span>
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
                {p.anos_experiencia ? <span>{p.anos_experiencia} anos de experiência</span> : null}
              </div>
              {p.bio && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>
              )}
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={escolhendo !== null}
            onClick={() => void escolher(p)}
          >
            {escolhendo === p.profissional_id && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Escolher profissional
          </Button>
        </div>
      ))}

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
          <p className="font-medium">Ainda não encontramos profissionais para esse horário</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Você pode trocar a data ou o horário — ou falar com a nossa equipe que continua
            procurando para você.
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
