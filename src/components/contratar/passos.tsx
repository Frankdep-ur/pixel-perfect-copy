import { useState } from "react";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  AREAS_EXTERNAS,
  DURACOES,
  TIPOS_IMOVEL,
  TIPOS_LIMPEZA,
  formatBRL,
} from "@/lib/catalogo";
import { dataMinimaAgendamento, ehDomingo, horariosPermitidos } from "@/lib/agenda";
import { buscarCep, mascaraCep, type Rascunho } from "@/lib/contratacao";
import { REGIOES, regiaoPorCidade } from "@/lib/regioes";


type Props = {
  rascunho: Rascunho;
  atualizar: (parcial: Partial<Rascunho>) => void;
};

function Cartao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start gap-1 rounded-xl border-2 bg-card p-4 text-left transition-all hover:border-primary/60",
        ativo ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      {children}
    </button>
  );
}

export function PassoEndereco({
  rascunho,
  atualizar,
  userId,
}: Props & { userId: string }) {
  const queryClient = useQueryClient();
  const { data: enderecos, isLoading } = useQuery(enderecosQuery(userId));
  const [novo, setNovo] = useState(false);

  function escolher(e: Endereco) {
    atualizar({
      endereco_id: e.id,
      endereco: {
        cep: e.cep ?? "",
        rua: e.rua ?? "",
        numero: e.numero ?? "",
        complemento: e.complemento ?? "",
        bairro: e.bairro ?? "",
        cidade: e.cidade ?? "",
        estado: e.estado ?? "",
        regiao: (e.regiao as RegiaoId | null) ?? null,
        latitude: null,
        longitude: null,
      },
    });
  }

  const lista = enderecos ?? [];
  const semImoveis = !isLoading && lista.length === 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Onde será a limpeza?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha um dos seus imóveis. Atendemos {REGIOES.grande_floripa.nome} e{" "}
          {REGIOES.balneario.nome}.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {lista.length > 0 && (
        <div className="grid gap-3">
          {lista.map((e) => (
            <Cartao
              key={e.id}
              ativo={rascunho.endereco_id === e.id}
              onClick={() => escolher(e)}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-primary" />
                {e.apelido ?? "Meu imóvel"}
              </span>
              <span className="text-sm text-muted-foreground">{resumoEndereco(e)}</span>
            </Cartao>
          ))}
        </div>
      )}

      {(novo || semImoveis) && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-4 text-sm font-semibold">
            {semImoveis ? "Cadastre seu primeiro imóvel" : "Novo imóvel"}
          </p>
          <FormEndereco
            userId={userId}
            onSalvo={(salvo) => {
              queryClient.invalidateQueries({ queryKey: ["enderecos"] });
              escolher(salvo);
              setNovo(false);
            }}
            {...(semImoveis ? {} : { onCancelar: () => setNovo(false) })}
          />
        </div>
      )}

      {!novo && !semImoveis && (
        <Button type="button" variant="outline" onClick={() => setNovo(true)} className="gap-2">
          <Plus className="size-4" /> Cadastrar outro imóvel
        </Button>
      )}
    </div>
  );
}


export function PassoImovel({ rascunho, atualizar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Qual é o tipo do imóvel?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Isso ajuda a preparar a profissional para o serviço.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIPOS_IMOVEL.map((tipo) => {
          const Icone = tipo.icon;
          return (
            <Cartao
              key={tipo.id}
              ativo={rascunho.tipo_imovel === tipo.id}
              onClick={() => atualizar({ tipo_imovel: tipo.id })}
            >
              <Icone className="size-5 text-primary" />
              <span className="text-sm font-medium">{tipo.label}</span>
            </Cartao>
          );
        })}
      </div>
    </div>
  );
}

function Contador({
  label,
  valor,
  min,
  onChange,
}: {
  label: string;
  valor: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.max(min, valor - 1))}
          disabled={valor <= min}
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-6 text-center tabular-nums">{valor}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onChange(Math.min(20, valor + 1))}
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function PassoTamanho({ rascunho, atualizar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Como é o imóvel?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quartos e banheiros adicionais influenciam o valor final.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Contador
          label="Quartos"
          valor={rascunho.quartos}
          min={0}
          onChange={(v) => atualizar({ quartos: v })}
        />
        <Contador
          label="Salas"
          valor={rascunho.salas}
          min={0}
          onChange={(v) => atualizar({ salas: v })}
        />
        <Contador
          label="Banheiros"
          valor={rascunho.banheiros}
          min={0}
          onChange={(v) => atualizar({ banheiros: v })}
        />
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <Label htmlFor="cozinha" className="text-sm font-medium">
            Tem cozinha
          </Label>
          <Switch
            id="cozinha"
            checked={rascunho.cozinha}
            onCheckedChange={(v) => atualizar({ cozinha: v })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Área externa</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AREAS_EXTERNAS.map((area) => (
            <Cartao
              key={area.id}
              ativo={rascunho.area_externa === area.id}
              onClick={() => atualizar({ area_externa: area.id })}
            >
              <span className="text-sm font-medium">{area.label}</span>
            </Cartao>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="outros">Outros ambientes (opcional)</Label>
        <Input
          id="outros"
          placeholder="Lavanderia, escritório, sacada..."
          value={rascunho.outros_ambientes}
          onChange={(e) => atualizar({ outros_ambientes: e.target.value })}
        />
      </div>
    </div>
  );
}

export function PassoDuracao({
  rascunho,
  atualizar,
  precos,
}: Props & { precos: Record<string, number> }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Quantas horas de serviço você precisa?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Na dúvida, 6 horas atende a maioria dos imóveis residenciais.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DURACOES.map((duracao) => (
          <Cartao
            key={duracao.horas}
            ativo={rascunho.duracao_horas === duracao.horas}
            onClick={() => atualizar({ duracao_horas: duracao.horas })}
          >
            <span className="inline-flex items-center gap-2">
              <span className="text-lg font-semibold">{duracao.label}</span>
              <span className="rounded-full bg-accent/12 px-2 py-0.5 text-xs font-semibold text-primary">
                {duracao.nivel}
              </span>
            </span>
            <span className="text-sm text-muted-foreground">{duracao.descricao}</span>
            <span className="mt-1 text-sm font-medium text-primary">
              a partir de {formatBRL(precos[`preco_${duracao.horas}h`] ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground">
              Início: {horariosPermitidos(duracao.horas).join(" · ")}
            </span>
          </Cartao>
        ))}
      </div>

    </div>
  );
}

export function PassoTipoLimpeza({ rascunho, atualizar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Qual tipo de limpeza?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada tipo exige um esforço diferente e ajusta o valor do serviço.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {TIPOS_LIMPEZA.map((tipo) => (
          <Cartao
            key={tipo.id}
            ativo={rascunho.tipo_limpeza === tipo.id}
            onClick={() => atualizar({ tipo_limpeza: tipo.id })}
          >
            <span className="font-semibold">{tipo.label}</span>
            <span className="text-sm text-muted-foreground">{tipo.descricao}</span>
          </Cartao>
        ))}
      </div>
    </div>
  );
}

export function PassoExtras({
  rascunho,
  atualizar,
  extras,
}: Props & { extras: { id: string; nome: string; descricao: string | null; preco: number }[] }) {
  function alternar(id: string) {
    const selecionados = rascunho.extras_ids.includes(id)
      ? rascunho.extras_ids.filter((e) => e !== id)
      : [...rascunho.extras_ids, id];
    atualizar({ extras_ids: selecionados });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Quer incluir algum extra?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Opcional — você pode seguir sem escolher nenhum.
        </p>
      </div>
      <div className="space-y-3">
        {extras.map((extra) => {
          const ativo = rascunho.extras_ids.includes(extra.id);
          return (
            <label
              key={extra.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border-2 bg-card p-4 transition-all",
                ativo ? "border-primary bg-primary/5" : "border-border hover:border-primary/60",
              )}
            >
              <Checkbox checked={ativo} onCheckedChange={() => alternar(extra.id)} />
              <span className="flex-1">
                <span className="block font-medium">{extra.nome}</span>
                {extra.descricao && (
                  <span className="block text-sm text-muted-foreground">{extra.descricao}</span>
                )}
              </span>
              <span className="font-semibold text-primary">
                + {formatBRL(Number(extra.preco))}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PassoDataHora({ rascunho, atualizar }: Props) {
  const minimo = dataMinimaAgendamento();
  const horarios = horariosPermitidos(rascunho.duracao_horas);
  const domingo = ehDomingo(rascunho.data);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Quando você precisa?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agende com pelo menos 24 horas de antecedência. Não atendemos domingos.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          type="date"
          min={minimo}
          value={rascunho.data ?? ""}
          onChange={(e) => {
            const valor = e.target.value;
            if (ehDomingo(valor)) {
              toast.error("Não atendemos aos domingos", {
                description: "Escolha um dia de segunda a sábado.",
              });
              atualizar({ data: null });
              return;
            }
            atualizar({ data: valor });
          }}
        />
        {domingo && (
          <p className="text-sm text-destructive">Escolha um dia de segunda a sábado.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Horário de início</Label>
        <p className="text-sm text-muted-foreground">
          Para {rascunho.duracao_horas ?? 4} horas de serviço, os horários possíveis são{" "}
          {horarios.join(" e ")}.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {horarios.map((hora) => (
            <Cartao key={hora} ativo={rascunho.hora === hora} onClick={() => atualizar({ hora })}>
              <span className="mx-auto text-sm font-medium">{hora}</span>
            </Cartao>
          ))}
        </div>
      </div>
    </div>
  );
}


export function PassoObservacoes({ rascunho, atualizar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Algo que a profissional precisa saber?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Animais, acesso ao prédio, produtos disponíveis, prioridades da limpeza.
        </p>
      </div>
      <Textarea
        rows={6}
        placeholder="Ex.: tenho dois gatos, a chave fica com o porteiro, priorizar a cozinha."
        value={rascunho.observacoes}
        onChange={(e) => atualizar({ observacoes: e.target.value })}
      />
    </div>
  );
}
