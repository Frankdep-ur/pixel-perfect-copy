import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminPrecosQuery } from "@/lib/admin-queries";
import { Painel, TituloSecao } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/precos")({
  component: AdminPrecos,
});

const LABELS: Record<string, string> = {
  preco_4h: "Preço base 4 horas (R$)",
  preco_6h: "Preço base 6 horas (R$)",
  preco_8h: "Preço base 8 horas (R$)",
  taxa_admin_percentual: "Taxa administrativa (fração, ex.: 0,15 = 15%)",
  valor_seguro: "Proteção por faxina (R$)",

  adicional_por_quarto_extra: "Adicional por quarto extra (R$)",
  adicional_por_sala_extra: "Adicional por sala extra (R$)",
  adicional_por_banheiro_extra: "Adicional por banheiro extra (R$)",
  adicional_por_cozinha: "Adicional por cozinha (R$)",
  area_externa_pequena: "Área externa pequena (R$)",
  area_externa_media: "Área externa média (R$)",
  area_externa_grande: "Área externa grande (R$)",
  mult_limpeza_padrao: "Multiplicador limpeza padrão",
  mult_limpeza_completa: "Multiplicador limpeza completa",
  mult_limpeza_pesada: "Multiplicador limpeza pesada",
  mult_pos_obra: "Multiplicador pós-obra",
  mult_pos_locacao: "Multiplicador pós-locação",
  mult_limpeza_comercial: "Multiplicador limpeza comercial (residencial antigo)",

  com_adicional_sala: "Adicional por sala (R$)",
  com_adicional_banheiro: "Adicional por banheiro (R$)",
  com_adicional_copa: "Adicional por copa (R$)",
  com_adicional_sala_reuniao: "Adicional por sala de reunião (R$)",
  com_adicional_recepcao: "Adicional por recepção (R$)",
  pessoas_ate_5: "Até 5 pessoas (R$)",
  pessoas_6_10: "6 a 10 pessoas (R$)",
  pessoas_11_20: "11 a 20 pessoas (R$)",
  pessoas_21_40: "21 a 40 pessoas (R$)",
  pessoas_mais_40: "+ de 40 pessoas (R$)",
  mult_com_essencial: "Multiplicador Limpeza Essencial",
  mult_com_completa: "Multiplicador Limpeza Completa",
  mult_com_intensiva: "Multiplicador Limpeza Intensiva",

  metragem_20_50: "20 a 50 m² (R$)",
  metragem_51_100: "51 a 100 m² (R$)",
  metragem_101_200: "101 a 200 m² (R$)",
  metragem_201_300: "201 a 300 m² (R$)",
  metragem_mais_301: "+ de 301 m² (R$)",
};

const COMERCIAL_COMODOS = [
  "com_adicional_sala",
  "com_adicional_banheiro",
  "com_adicional_copa",
  "com_adicional_sala_reuniao",
  "com_adicional_recepcao",
];

const COMERCIAL_PESSOAS = [
  "pessoas_ate_5",
  "pessoas_6_10",
  "pessoas_11_20",
  "pessoas_21_40",
  "pessoas_mais_40",
];

const COMERCIAL_MULT = ["mult_com_essencial", "mult_com_completa", "mult_com_intensiva"];

const METRAGEM = [
  "metragem_20_50",
  "metragem_51_100",
  "metragem_101_200",
  "metragem_201_300",
  "metragem_mais_301",
];

const ABAS: { id: string; titulo: string; chaves: string[] }[] = [
  {
    id: "geral",
    titulo: "Geral",
    chaves: ["preco_4h", "preco_6h", "preco_8h", "taxa_admin_percentual", "valor_seguro"],
  },
  {
    id: "residencial",
    titulo: "Casa e Apartamento",
    chaves: [
      "adicional_por_quarto_extra",
      "adicional_por_sala_extra",
      "adicional_por_banheiro_extra",
      "adicional_por_cozinha",
      "area_externa_pequena",
      "area_externa_media",
      "area_externa_grande",
      "mult_limpeza_padrao",
      "mult_limpeza_completa",
      "mult_limpeza_pesada",
      "mult_pos_obra",
      "mult_pos_locacao",
      "mult_limpeza_comercial",
    ],
  },
  {
    id: "escritorio",
    titulo: "Escritório",
    chaves: [...COMERCIAL_COMODOS, ...COMERCIAL_PESSOAS, ...COMERCIAL_MULT],
  },
  {
    id: "empresa",
    titulo: "Empresa",
    chaves: [...COMERCIAL_COMODOS, ...COMERCIAL_PESSOAS, ...METRAGEM, ...COMERCIAL_MULT],
  },
];

function AdminPrecos() {
  const queryClient = useQueryClient();
  const { data: precos } = useQuery(adminPrecosQuery);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (precos) {
      setValores(Object.fromEntries(precos.map((p) => [p.chave, String(p.valor)])));
    }
  }, [precos]);

  const salvar = useMutation({
    mutationFn: async () => {
      const linhas = Object.entries(valores).map(([chave, valor]) => ({
        chave,
        valor: Number(String(valor).replace(",", ".")),
      }));
      for (const linha of linhas) {
        if (!Number.isFinite(linha.valor)) throw new Error(`Valor inválido em ${linha.chave}`);
        const { error } = await supabase
          .from("pricing_config")
          .update({ valor: linha.valor })
          .eq("chave", linha.chave);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Preços atualizados", { description: "O funil já usa os novos valores." });
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing_config"] });
      queryClient.invalidateQueries({ queryKey: ["pricing_config"] });
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
    onError: (erro) =>
      toast.error("Não foi possível salvar", {
        description: erro instanceof Error ? erro.message : undefined,
      }),
  });

  if (!precos) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <TituloSecao
        titulo="Preços"
        texto="Alterar aqui muda o cálculo do funil imediatamente para todos os clientes."
      />
      <Painel className="max-w-2xl">
        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            salvar.mutate();
          }}
        >
          {precos.map((p) => (
            <div key={p.chave} className="space-y-1.5">
              <label htmlFor={p.chave} className="text-sm font-medium leading-snug">
                {LABELS[p.chave] ?? p.chave}
              </label>
              <Input
                id={p.chave}
                inputMode="decimal"
                value={valores[p.chave] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [p.chave]: e.target.value }))}
              />
              {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
            </div>
          ))}
          <Button type="submit" disabled={salvar.isPending} className="w-full sm:w-auto">
            {salvar.isPending ? "Salvando..." : "Salvar preços"}
          </Button>
        </form>
      </Painel>
    </>
  );
}
