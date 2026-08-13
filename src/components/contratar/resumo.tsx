import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBRL, labelTipoImovel, labelTipoLimpeza } from "@/lib/catalogo";
import type { Orcamento } from "@/lib/pricing";
import type { Rascunho } from "@/lib/contratacao";

export function Resumo({
  rascunho,
  orcamento,
  extras,
}: {
  rascunho: Rascunho;
  orcamento: Orcamento;
  extras: { id: string; nome: string; preco: number }[];
}) {
  const selecionados = extras.filter((e) => rascunho.extras_ids.includes(e.id));

  return (
    <Card className="sticky top-24">
      <CardContent className="space-y-4 pt-6">
        <h3 className="font-semibold">Resumo do serviço</h3>

        <dl className="space-y-1 text-sm text-muted-foreground">
          {rascunho.endereco.cidade && (
            <div>
              <dt className="sr-only">Local</dt>
              <dd>
                {rascunho.endereco.bairro && `${rascunho.endereco.bairro}, `}
                {rascunho.endereco.cidade}
              </dd>
            </div>
          )}
          {rascunho.tipo_imovel && <dd>{labelTipoImovel(rascunho.tipo_imovel)}</dd>}
          {rascunho.duracao_horas && <dd>{rascunho.duracao_horas} horas de serviço</dd>}
          {rascunho.tipo_limpeza && <dd>Limpeza {labelTipoLimpeza(rascunho.tipo_limpeza)}</dd>}
          {rascunho.data && (
            <dd>
              {new Date(`${rascunho.data}T12:00:00`).toLocaleDateString("pt-BR")}
              {rascunho.hora ? ` às ${rascunho.hora}` : ""}
            </dd>
          )}
        </dl>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Serviço</span>
            <span>{formatBRL(orcamento.subtotalServico)}</span>
          </div>
          {selecionados.map((extra) => (
            <div key={extra.id} className="flex justify-between">
              <span className="text-muted-foreground">{extra.nome}</span>
              <span>{formatBRL(Number(extra.preco))}</span>
            </div>
          ))}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa administrativa</span>
            <span>{formatBRL(orcamento.taxaAdmin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seguro do serviço</span>
            <span>{formatBRL(orcamento.valorSeguro)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-baseline justify-between">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-semibold text-primary">
            {formatBRL(orcamento.total)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          A profissional recebe {formatBRL(orcamento.valorProfissional)} integralmente. A taxa
          administrativa é somada ao valor do serviço, nunca descontada dela.
        </p>
      </CardContent>
    </Card>
  );
}
