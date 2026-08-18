import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Clock, CreditCard, Loader2, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/catalogo";
import { processarPagamento, type FormaPagamento } from "@/lib/pagamento";
import { limparRascunho } from "@/lib/contratacao";
import { confirmarPagamento, formatarContagem, type ProfissionalAceite } from "@/lib/orquestra";
import { useContagem } from "@/hooks/use-contagem";
import type { Orcamento } from "@/lib/pricing";

const FORMAS: { id: FormaPagamento; label: string; icon: typeof QrCode; nota: string }[] = [
  { id: "pix", label: "Pix", icon: QrCode, nota: "Confirmação imediata" },
  { id: "credito", label: "Cartão de crédito", icon: CreditCard, nota: "Em até 3x" },
  { id: "debito", label: "Cartão de débito", icon: Wallet, nota: "Débito à vista" },
];

export function Checkout({
  bookingId,
  profissional,
  reservaAte,
  orcamento,
  onReservaExpirada,
}: {
  bookingId: string;
  profissional: ProfissionalAceite;
  reservaAte: string;
  orcamento: Orcamento;
  onReservaExpirada: () => void;
}) {
  const navigate = useNavigate();
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [processando, setProcessando] = useState(false);
  const restante = useContagem(reservaAte);
  const expirada = restante <= 0;

  async function confirmar() {
    setProcessando(true);
    try {
      const pagamento = await processarPagamento(forma, orcamento.total);
      if (!pagamento.sucesso) throw new Error(pagamento.mensagem);

      await confirmarPagamento(bookingId);

      limparRascunho();
      navigate({ to: "/confirmacao/$id", params: { id: bookingId } });
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

      <div className="flex items-center gap-4 rounded-[24px] border border-primary/50 bg-primary/10 p-5">
        <Avatar className="size-14 ring-2 ring-primary/40">
          {profissional.foto_url && (
            <AvatarImage src={profissional.foto_url} alt={profissional.nome ?? "Profissional"} />
          )}
          <AvatarFallback>
            {(profissional.nome ?? "LA").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{profissional.nome ?? "Profissional Lar77"}</p>
          <p className="text-sm text-muted-foreground">
            Reservada para você · nota {profissional.nota_media.toFixed(1)}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-3 rounded-[24px] p-5 text-sm",
          expirada ? "bg-destructive/15 text-destructive" : "bg-card text-muted-foreground",
        )}
      >
        <Clock className="size-5 shrink-0 text-primary" />
        {expirada ? (
          <div className="flex-1">
            <p className="font-medium">A reserva expirou</p>
            <p>Volte e escolha uma profissional novamente.</p>
          </div>
        ) : (
          <p className="flex-1">
            Reserva garantida por{" "}
            <span className="font-semibold text-primary">{formatarContagem(restante)}</span>.
            Conclua o pagamento para confirmar a contratação.
          </p>
        )}
        {expirada && (
          <Button size="sm" variant="outline" onClick={onReservaExpirada}>
            Escolher outra
          </Button>
        )}
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
                "flex flex-col items-start gap-1 rounded-[24px] border bg-card p-5 text-left transition-all",
                ativo ? "border-primary bg-primary/10" : "border-border hover:border-primary/60",
              )}
            >
              <Icone className="size-5 text-primary" />
              <span className="font-medium">{opcao.label}</span>
              <span className="text-sm text-muted-foreground">{opcao.nota}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-[24px] bg-card p-5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          A taxa administrativa cobre a operação da Lar77 e profissionais com documentos
          verificados. O valor só é liberado depois que você confirma a conclusão da faxina.
        </p>
      </div>

      <Button
        className="min-h-14 w-full rounded-[24px] text-base font-bold"
        size="lg"
        onClick={confirmar}
        disabled={processando || expirada}
      >
        {processando && <Loader2 className="mr-2 size-4 animate-spin" />}
        {processando
          ? "Processando pagamento..."
          : `Pagar ${formatBRL(orcamento.total)} e confirmar`}
      </Button>
    </div>
  );
}

