import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Loader2, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBRL, tipoLimpezaParaFiltro } from "@/lib/catalogo";
import { processarPagamento, type FormaPagamento } from "@/lib/pagamento";
import { limparRascunho, type Rascunho } from "@/lib/contratacao";
import type { Orcamento } from "@/lib/pricing";

const FORMAS: { id: FormaPagamento; label: string; icon: typeof QrCode; nota: string }[] = [
  { id: "pix", label: "Pix", icon: QrCode, nota: "Confirmação imediata" },
  { id: "credito", label: "Cartão de crédito", icon: CreditCard, nota: "Em até 3x" },
  { id: "debito", label: "Cartão de débito", icon: Wallet, nota: "Débito à vista" },
];

export function Checkout({
  rascunho,
  orcamento,
  extras,
  userId,
}: {
  rascunho: Rascunho;
  orcamento: Orcamento;
  extras: { id: string; preco: number }[];
  userId: string;
}) {
  const navigate = useNavigate();
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [processando, setProcessando] = useState(false);

  async function confirmar() {
    setProcessando(true);
    try {
      const endereco = rascunho.endereco;
      let enderecoId = rascunho.endereco_id;

      // Imóvel já salvo na conta: reaproveitamos, sem duplicar endereços.
      if (!enderecoId) {
        const { data: enderecoSalvo, error: erroEndereco } = await supabase
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
        if (erroEndereco) throw erroEndereco;
        enderecoId = enderecoSalvo.id;
      }


      let profissionalId = rascunho.profissional_id;
      if (rascunho.escolha_automatica || !profissionalId) {
        const { data: sorteada, error: erroSorteio } = await supabase.rpc(
          "sortear_profissional",
          {
            _regiao: endereco.regiao!,
            _data: rascunho.data!,
            ...(rascunho.tipo_limpeza
              ? { _tipo_limpeza: tipoLimpezaParaFiltro(rascunho.tipo_limpeza)! }
              : {}),
          },
        );
        if (erroSorteio) throw erroSorteio;
        if (!sorteada) {
          throw new Error(
            "Nenhuma profissional disponível nessa data. Volte e escolha outro dia ou horário.",
          );
        }
        profissionalId = sorteada;
      }

      const pagamento = await processarPagamento(forma, orcamento.total);
      if (!pagamento.sucesso) throw new Error(pagamento.mensagem);

      const { data: booking, error: erroBooking } = await supabase
        .from("bookings")
        .insert({
          cliente_id: userId,
          profissional_id: profissionalId,
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
          status: "aguardando_aceite",
          valor_profissional: orcamento.valorProfissional,
          taxa_admin: orcamento.taxaAdminBase,
          valor_seguro: orcamento.valorSeguro,
          valor_extras: orcamento.valorExtras,
          valor_total: orcamento.total,
        })
        .select("id, codigo")
        .single();
      if (erroBooking) throw erroBooking;


      const extrasEscolhidos = extras.filter((e) => rascunho.extras_ids.includes(e.id));
      if (extrasEscolhidos.length > 0) {
        const { error: erroExtras } = await supabase.from("booking_extras").insert(
          extrasEscolhidos.map((e) => ({
            booking_id: booking.id,
            extra_id: e.id,
            preco_congelado: Number(e.preco),
          })),
        );
        if (erroExtras) throw erroExtras;
      }

      limparRascunho();
      navigate({ to: "/confirmacao/$id", params: { id: booking.id } });
    } catch (erro) {
      toast.error("Não conseguimos concluir a contratação", {
        description: erro instanceof Error ? erro.message : undefined,
      });
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Pagamento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ambiente de testes: nenhuma cobrança real é feita neste momento.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {FORMAS.map((opcao) => {
          const Icone = opcao.icon;
          const ativo = forma === opcao.id;
          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setForma(opcao.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 bg-card p-4 text-left transition-all",
                ativo ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
              )}
            >
              <Icone className="size-5 text-primary" />
              <span className="font-medium">{opcao.label}</span>
              <span className="text-sm text-muted-foreground">{opcao.nota}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          A taxa administrativa cobre a operação da Lar77 e profissionais com documentos
          verificados. O valor só é liberado depois que você confirma a conclusão da faxina.
        </p>
      </div>


      <Button className="w-full" size="lg" onClick={confirmar} disabled={processando}>
        {processando && <Loader2 className="mr-2 size-4 animate-spin" />}
        {processando
          ? "Processando pagamento..."
          : `Pagar ${formatBRL(orcamento.total)} e confirmar`}
      </Button>
    </div>
  );
}
