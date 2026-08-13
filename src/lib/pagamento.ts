export type FormaPagamento = "pix" | "credito" | "debito";

export type ResultadoPagamento =
  | { sucesso: true; referencia: string }
  | { sucesso: false; mensagem: string };

/**
 * MVP: pagamento simulado. Toda a lógica de gateway fica isolada aqui —
 * será trocada por integração real (Asaas/Pagar.me) sem tocar nas telas.
 */
export async function processarPagamento(
  forma: FormaPagamento,
  valorTotal: number,
): Promise<ResultadoPagamento> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (valorTotal <= 0) {
    return { sucesso: false, mensagem: "Valor inválido para pagamento." };
  }

  return {
    sucesso: true,
    referencia: `SIM-${forma.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
  };
}
