import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PassoDataHora,
  PassoDuracao,
  PassoEndereco,
  PassoExtras,
  PassoImovel,
  PassoObservacoes,
  PassoTamanho,
  PassoTipoLimpeza,
} from "@/components/contratar/passos";
import { Resumo } from "@/components/contratar/resumo";
import { EscolhaProfissional } from "@/components/contratar/escolha-profissional";
import { Checkout } from "@/components/contratar/checkout";
import { extrasQuery, pricingQuery } from "@/lib/queries";
import { calcularOrcamento } from "@/lib/pricing";
import {
  RASCUNHO_INICIAL,
  carregarRascunho,
  salvarRascunho,
  type Rascunho,
} from "@/lib/contratacao";
import { ehDomingo, horarioValido } from "@/lib/agenda";
import { useSession } from "@/hooks/use-auth";


export const Route = createFileRoute("/contratar")({
  head: () => ({
    meta: [
      { title: "Contratar limpeza — Lar77" },
      {
        name: "description",
        content:
          "Monte seu serviço de limpeza em 8 passos, veja o preço na hora e escolha uma profissional verificada em Santa Catarina.",
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

const TOTAL_PASSOS = 8;

function Contratar() {
  const navigate = useNavigate();
  const { user, carregando } = useSession();
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_INICIAL);
  const [passo, setPasso] = useState(1);
  const [fase, setFase] = useState<"passos" | "profissional" | "checkout">("passos");

  useEffect(() => {
    setRascunho(carregarRascunho());
  }, []);

  // Contratar exige conta: sem login, mandamos para entrar/criar conta.
  useEffect(() => {
    if (!carregando && !user) {
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

  const podeAvancar = (() => {
    switch (passo) {
      case 1:
        return !!rascunho.endereco_id && !!rascunho.endereco.regiao;
      case 2:
        return !!rascunho.tipo_imovel;
      case 3:
        return true;
      case 4:
        return !!rascunho.duracao_horas;
      case 5:
        return !!rascunho.tipo_limpeza;
      case 6:
        return true;
      case 7:
        return (
          !!rascunho.data &&
          !ehDomingo(rascunho.data) &&
          horarioValido(rascunho.duracao_horas, rascunho.hora)
        );

      default:
        return true;
    }
  })();

  function avancar() {
    if (passo < TOTAL_PASSOS) {
      setPasso(passo + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFase("profissional");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltar() {
    if (fase === "checkout") {
      setFase("profissional");
      return;
    }
    if (fase === "profissional") {
      setFase("passos");
      return;
    }
    if (passo > 1) setPasso(passo - 1);
  }

  function irParaCheckout() {
    if (!user) {
      navigate({ to: "/auth", search: { next: "/contratar" } });
      return;
    }
    setFase("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {fase === "passos" && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Passo {passo} de {TOTAL_PASSOS}
              </span>
              <span>{Math.round((passo / TOTAL_PASSOS) * 100)}%</span>
            </div>
            <Progress value={(passo / TOTAL_PASSOS) * 100} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            {fase === "passos" && (
              <>
                {passo === 1 && (
                  <PassoEndereco rascunho={rascunho} atualizar={atualizar} userId={user!.id} />
                )}

                {passo === 2 && <PassoImovel rascunho={rascunho} atualizar={atualizar} />}
                {passo === 3 && <PassoTamanho rascunho={rascunho} atualizar={atualizar} />}
                {passo === 4 && (
                  <PassoDuracao rascunho={rascunho} atualizar={atualizar} precos={precos} />
                )}
                {passo === 5 && <PassoTipoLimpeza rascunho={rascunho} atualizar={atualizar} />}
                {passo === 6 && (
                  <PassoExtras rascunho={rascunho} atualizar={atualizar} extras={listaExtras} />
                )}
                {passo === 7 && <PassoDataHora rascunho={rascunho} atualizar={atualizar} />}
                {passo === 8 && <PassoObservacoes rascunho={rascunho} atualizar={atualizar} />}

                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button
                    variant="ghost"
                    onClick={voltar}
                    disabled={passo === 1}
                    className="gap-2"
                  >
                    <ArrowLeft className="size-4" /> Voltar
                  </Button>
                  <Button onClick={avancar} disabled={!podeAvancar} size="lg" className="gap-2">
                    {passo === TOTAL_PASSOS ? "Ver profissionais" : "Continuar"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            )}

            {fase === "profissional" && (
              <>
                <EscolhaProfissional
                  rascunho={rascunho}
                  atualizar={atualizar}
                  onAvancar={irParaCheckout}
                />
                <Button variant="ghost" onClick={voltar} className="mt-6 gap-2">
                  <ArrowLeft className="size-4" /> Revisar serviço
                </Button>
              </>
            )}

            {fase === "checkout" && user && (
              <>
                <Checkout
                  rascunho={rascunho}
                  orcamento={orcamento}
                  extras={listaExtras}
                  userId={user.id}
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
