import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { TopoFunil } from "@/components/contratar/ui-funil";
import {
  PassoDataHora,
  PassoDuracao,
  PassoEndereco,
  PassoExtras,
  PassoObservacoes,
  PassoTipoLimpeza,
} from "@/components/contratar/passos";
import { Resumo } from "@/components/contratar/resumo";
import { BuscaOrquestra } from "@/components/contratar/busca-orquestra";
import { Checkout } from "@/components/contratar/checkout";
import type { ProfissionalAceite } from "@/lib/orquestra";

import { extrasQuery, pricingQuery } from "@/lib/queries";
import { calcularOrcamento } from "@/lib/pricing";
import { AIRBNB_TIPO_LIMPEZA, ehAirbnb, perfilImovel, tipoLimpezaParaDuracao } from "@/lib/catalogo";
import {
  RASCUNHO_INICIAL,
  carregarRascunho,
  salvarRascunho,
  type Rascunho,
} from "@/lib/contratacao";
import { ehDomingo, horarioValido } from "@/lib/agenda";
import { useSession, estaSaindo } from "@/hooks/use-auth";


export const Route = createFileRoute("/contratar")({
  head: () => ({
    meta: [
      { title: "Contratar limpeza — Lar77" },
      {
        name: "description",
        content:
          "Monte seu serviço de limpeza, veja o preço na hora e escolha uma profissional verificada em Santa Catarina.",
      },
      { property: "og:title", content: "Contratar limpeza — Lar77" },
      {
        property: "og:description",
        content:
          "Monte seu serviço, veja o preço na hora e escolha uma profissional verificada.",
      },
    ],
  }),
  component: Contratar,
});

/**
 * Funil: 2) imóvel cadastrado (já traz o tipo), 4) duração + limpeza + extras,
 * 7) data/hora. Tipo do imóvel não é perguntado de novo.
 */
const PASSOS_PADRAO = [2, 4, 7];
/** Airbnb é preço fixo: só endereço e data. */
const PASSOS_AIRBNB = [2, 7];

function Contratar() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_INICIAL);
  const [passo, setPasso] = useState(2);
  const [fase, setFase] = useState<"passos" | "busca" | "checkout">("passos");
  const [pedido, setPedido] = useState<{ id: string; codigo: string | null } | null>(null);
  const [reserva, setReserva] = useState<{
    profissional: ProfissionalAceite;
    reservaAte: string;
  } | null>(null);


  useEffect(() => {
    setRascunho(carregarRascunho());
  }, []);

  // Contratar exige conta: sem login, mandamos para entrar/criar conta.
  useEffect(() => {
    if (!carregando && !user && !estaSaindo()) {
      navigate({ to: "/auth", search: { next: "/contratar" }, replace: true });
    }
  }, [carregando, user, navigate]);

  const { data: precos } = useQuery(pricingQuery);
  const { data: extras } = useQuery(extrasQuery);


  function atualizar(parcial: Partial<Rascunho>) {
    setRascunho((atual) => {
      const proximo = { ...atual, ...parcial };
      // Trocar a duração muda os horários possíveis (4h: 07/08/13, 6h e 8h: 07/08).
      if (
        parcial.duracao_horas !== undefined &&
        parcial.duracao_horas !== atual.duracao_horas &&
        !horarioValido(parcial.duracao_horas, proximo.hora)
      ) {
        proximo.hora = null;
      }
      if (parcial.duracao_horas === 4) {
        const trava = tipoLimpezaParaDuracao(4, proximo.tipo_imovel);
        if (trava) proximo.tipo_limpeza = trava;
      }
      if (parcial.tipo_imovel && proximo.duracao_horas === 4) {
        const trava = tipoLimpezaParaDuracao(4, parcial.tipo_imovel);
        if (trava) proximo.tipo_limpeza = trava;
      }
      // Mudou data, horário ou tipo de limpeza: a disponibilidade precisa ser recalculada.
      if (
        parcial.data !== undefined ||
        parcial.hora !== undefined ||
        parcial.tipo_limpeza !== undefined
      ) {
        proximo.profissional_id = null;
      }
      salvarRascunho(proximo);
      return proximo;
    });
  }


  const listaExtras = useMemo(
    () => (extras ?? []).map((e) => ({ ...e, preco: Number(e.preco) })),
    [extras],
  );

  const orcamento = useMemo(
    () =>
      calcularOrcamento(
        {
          perfil: perfilImovel(rascunho.tipo_imovel),
          duracao_horas: rascunho.duracao_horas ?? 0,
          quartos: rascunho.quartos,
          salas: rascunho.salas,
          banheiros: rascunho.banheiros,
          cozinhas: rascunho.cozinhas,
          area_externa: rascunho.area_externa,
          copa: rascunho.copa,
          salas_reuniao: rascunho.salas_reuniao,
          recepcao: rascunho.recepcao,
          faixa_pessoas: rascunho.faixa_pessoas,
          faixa_metragem: rascunho.faixa_metragem,
          qtd_profissionais: rascunho.qtd_profissionais,
          tipo_limpeza: rascunho.tipo_limpeza ?? "padrao",
          extras: listaExtras.filter((e) => rascunho.extras_ids.includes(e.id)),
        },
        precos ?? {},
      ),
    [rascunho, listaExtras, precos],
  );

  const airbnb = ehAirbnb(rascunho.tipo_imovel);
  const duracaoAirbnb = (Number(precos?.["airbnb_duracao_horas"] ?? 4) || 4) as 4 | 6 | 8;
  const cadastrandoImovel = passo === 2 && !rascunho.endereco_id;

  // Airbnb tem escopo e duração fixos: preenchemos sem perguntar.
  useEffect(() => {
    if (!airbnb) return;
    if (rascunho.duracao_horas !== duracaoAirbnb || rascunho.tipo_limpeza !== AIRBNB_TIPO_LIMPEZA) {
      atualizar({ duracao_horas: duracaoAirbnb, tipo_limpeza: AIRBNB_TIPO_LIMPEZA });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airbnb, duracaoAirbnb, rascunho.duracao_horas, rascunho.tipo_limpeza]);

  const sequencia = airbnb ? PASSOS_AIRBNB : PASSOS_PADRAO;
  const indice = Math.max(0, sequencia.indexOf(passo));
  const total = sequencia.length;
  const ultimo = indice === total - 1;

  /** As etapas viram 4 bolinhas: local, serviço, detalhes e profissional. */
  const grupoAtual =
    fase === "passos" ? (passo <= 2 ? 1 : passo <= 6 ? 2 : 3) : 4;

  const podeAvancar = (() => {
    switch (passo) {
      case 2:
        return !!rascunho.endereco_id && !!rascunho.endereco.regiao && !!rascunho.tipo_imovel;
      case 4:
        if (!rascunho.duracao_horas || !rascunho.tipo_limpeza) return false;
        return true;
      case 7:
        return (
          !!rascunho.data &&
          !ehDomingo(rascunho.data) &&
          horarioValido(rascunho.duracao_horas, rascunho.hora, airbnb)
        );

      default:
        return true;
    }
  })();

  function avancar() {
    if (!ultimo) {
      setPasso(sequencia[indice + 1]!);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFase("busca");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Sair do wizard sem criar pedido: volta para a home do cliente. */
  function sair() {
    navigate({ to: "/" });
  }

  function voltar() {
    if (fase === "checkout") {
      setReserva(null);
      setFase("busca");
      return;
    }
    if (fase === "busca") {
      setFase("passos");
      return;
    }
    // Na primeira etapa o Voltar nunca prende o usuário: sai do fluxo.
    if (indice > 0) setPasso(sequencia[indice - 1]!);
    else sair();
  }


  if (!precos || !extras || carregando || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 lg:max-w-6xl">
        {/* Sem logo no funil: o espaço vertical fica para as opções. */}
        <TopoFunil grupoAtual={grupoAtual} onVoltar={voltar} onCancelar={sair} />

        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">

          <div>
            {fase === "passos" && (
              <>
                {passo === 2 && (
                  <PassoEndereco
                    rascunho={rascunho}
                    atualizar={atualizar}
                    userId={user!.id}
                    {...(Number(precos["airbnb_preco_fixo"])
                      ? { precoAirbnb: Number(precos["airbnb_preco_fixo"]) }
                      : {})}
                  />
                )}
                {passo === 4 && (
                  <div className="space-y-8">
                    <PassoDuracao rascunho={rascunho} atualizar={atualizar} precos={precos} />
                    <PassoTipoLimpeza rascunho={rascunho} atualizar={atualizar} />
                    <PassoExtras rascunho={rascunho} atualizar={atualizar} extras={listaExtras} />
                  </div>
                )}
                {passo === 7 && (
                  <div className="space-y-8">
                    <PassoDataHora rascunho={rascunho} atualizar={atualizar} />
                    <PassoObservacoes rascunho={rascunho} atualizar={atualizar} />
                  </div>
                )}

                {!cadastrandoImovel && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <Button
                    onClick={avancar}
                    disabled={!podeAvancar}
                    size="lg"
                    className="min-h-14 w-full rounded-[24px] text-base font-bold"
                  >
                    {ultimo ? "Buscar profissionais" : "Continuar"}
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={voltar}
                    className="gap-2 text-muted-foreground"
                  >
                    <ArrowLeft className="size-4" /> {indice === 0 ? "Sair" : "Voltar"}
                  </Button>
                </div>
                )}

              </>
            )}

            {fase === "busca" && user && (
              <>
                <BuscaOrquestra
                  rascunho={rascunho}
                  orcamento={orcamento}
                  extras={listaExtras}
                  userId={user.id}
                  pedido={pedido}
                  onPedidoCriado={setPedido}
                  onEscolhida={(dados) => {
                    setReserva(dados);
                    setFase("checkout");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onVoltar={() => setFase("passos")}
                />
                <Button variant="ghost" onClick={voltar} className="mt-6 gap-2">
                  <ArrowLeft className="size-4" /> Revisar serviço
                </Button>
              </>
            )}

            {fase === "checkout" && user && pedido && reserva && (
              <>
                <Checkout
                  bookingId={pedido.id}
                  profissional={reserva.profissional}
                  reservaAte={reserva.reservaAte}
                  orcamento={orcamento}
                  onReservaExpirada={voltar}
                />

                <Button variant="ghost" onClick={voltar} className="mt-6 gap-2">
                  <ArrowLeft className="size-4" /> Trocar profissional
                </Button>
              </>
            )}
          </div>

          <aside className="hidden lg:block">
            <Resumo rascunho={rascunho} orcamento={orcamento} extras={listaExtras} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
