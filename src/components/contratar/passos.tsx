import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Info, Loader2, MapPin, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  AIRBNB_INCLUSOS,
  AIRBNB_TIPO_LIMPEZA,
  AREAS_EXTERNAS,
  DURACOES,
  FAIXAS_METRAGEM,
  FAIXAS_PESSOAS,
  QTD_PROFISSIONAIS,
  TIPOS_IMOVEL,
  TIPOS_LIMPEZA,
  TIPOS_LIMPEZA_COMERCIAL,
  ehAirbnb,
  ehComercial,
  permiteMultiplasProfissionais,
  formatBRL,
} from "@/lib/catalogo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CabecalhoPasso, CardDuracao, CardOpcao } from "@/components/contratar/ui-funil";
import { dataMinimaAgendamento, ehDomingo, horariosPermitidos } from "@/lib/agenda";
import { type Rascunho } from "@/lib/contratacao";
import { FormEndereco } from "@/components/enderecos/form-endereco";
import { enderecosQuery, resumoEndereco, type Endereco } from "@/lib/enderecos";
import { REGIOES } from "@/lib/regioes";
import type { RegiaoId } from "@/lib/regioes";



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

/** Ícone ⓘ: a descrição só aparece quando o cliente toca/clica no símbolo. */
function InfoDescricao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={`Sobre ${titulo}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary"
        >
          <Info className="size-4" />
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 text-sm leading-relaxed"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 font-semibold">{titulo}</p>
        <p className="text-muted-foreground">{descricao}</p>
      </PopoverContent>
    </Popover>
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


export function PassoImovel({
  rascunho,
  atualizar,
  precoAirbnb,
}: Props & { precoAirbnb?: number }) {
  const airbnb = ehAirbnb(rascunho.tipo_imovel);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Qual o tipo do imóvel?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Essa informação nos ajuda a entender melhor suas necessidades.
        </p>
      </div>
      <div className="grid gap-3">
        {TIPOS_IMOVEL.map((tipo) => {
          const Icone = tipo.icon;
          return (
            <Cartao
              key={tipo.id}
              ativo={rascunho.tipo_imovel === tipo.id}
              onClick={() => {
                if (rascunho.tipo_imovel === tipo.id) return;
                const virouComercial = ehComercial(tipo.id);
                const virouAirbnb = ehAirbnb(tipo.id);
                atualizar({
                  tipo_imovel: tipo.id,
                  // Perfis diferentes têm perguntas e níveis de limpeza próprios.
                  ...(ehComercial(rascunho.tipo_imovel) !== virouComercial ||
                  ehAirbnb(rascunho.tipo_imovel) !== virouAirbnb
                    ? { tipo_limpeza: virouAirbnb ? AIRBNB_TIPO_LIMPEZA : null }
                    : {}),
                  // Airbnb é preço fixo: nada de extras, metragem ou múltiplas profissionais.
                  ...(virouAirbnb ? { extras_ids: [], duracao_horas: null } : {}),
                  ...(tipo.id === "empresa" ? {} : { faixa_metragem: null, qtd_profissionais: 1 }),
                });
              }}
            >
              <span className="flex w-full items-center gap-3">
                <Icone className="size-6 shrink-0 text-primary" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{tipo.label}</span>
                  {tipo.selo && (
                    <span className="mt-1 inline-block rounded-md border border-primary/50 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {tipo.selo}
                    </span>
                  )}
                </span>
                <ChevronRight className="size-4 shrink-0 text-primary" />
              </span>
            </Cartao>
          );
        })}
      </div>

      {airbnb && (
        <div className="space-y-3 rounded-2xl border border-primary/30 bg-surface-tint p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary">
              <Star className="size-5" strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">Limpeza para receber melhor.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ideal para anfitriões que querem avaliações 5 estrelas e hóspedes sempre
                satisfeitos.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {AIRBNB_INCLUSOS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-foreground">
            Valor fixo do serviço: {formatBRL(precoAirbnb ?? 150)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              (+ taxa administrativa)
            </span>
          </p>
        </div>
      )}
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

function TamanhoResidencial({ rascunho, atualizar }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Como é o imóvel?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quartos, banheiros e cozinhas influenciam o valor final.
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
        <Contador
          label="Cozinhas"
          valor={rascunho.cozinhas}
          min={0}
          onChange={(v) => atualizar({ cozinhas: v, cozinha: v > 0 })}
        />
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

function TamanhoComercial({ rascunho, atualizar }: Props) {
  const empresa = rascunho.tipo_imovel === "empresa";
  const multiplas = permiteMultiplasProfissionais(rascunho.tipo_imovel, rascunho.faixa_metragem);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Como é o {empresa ? "espaço da empresa" : "escritório"}?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada ambiente e o volume de pessoas ajustam o valor do serviço.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
        <Contador
          label="Copa"
          valor={rascunho.copa}
          min={0}
          onChange={(v) => atualizar({ copa: v })}
        />
        <Contador
          label="Sala de reunião"
          valor={rascunho.salas_reuniao}
          min={0}
          onChange={(v) => atualizar({ salas_reuniao: v })}
        />
        <Contador
          label="Recepção"
          valor={rascunho.recepcao}
          min={0}
          onChange={(v) => atualizar({ recepcao: v })}
        />
      </div>

      <div className="space-y-2">
        <Label>Quantidade de pessoas que trabalham no local</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {FAIXAS_PESSOAS.map((faixa) => (
            <Cartao
              key={faixa.id}
              ativo={rascunho.faixa_pessoas === faixa.id}
              onClick={() => atualizar({ faixa_pessoas: faixa.id })}
            >
              <span className="text-sm font-medium">{faixa.label}</span>
            </Cartao>
          ))}
        </div>
      </div>

      {empresa && (
        <div className="space-y-2">
          <Label>Metragem do local</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {FAIXAS_METRAGEM.map((faixa) => (
              <Cartao
                key={faixa.id}
                ativo={rascunho.faixa_metragem === faixa.id}
                onClick={() =>
                  atualizar({
                    faixa_metragem: faixa.id,
                    ...(faixa.grande ? {} : { qtd_profissionais: 1 }),
                  })
                }
              >
                <span className="text-sm font-medium">{faixa.label}</span>
              </Cartao>
            ))}
          </div>
        </div>
      )}

      {multiplas && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Quantas profissionais deseja contratar?
            <InfoDescricao
              titulo="Mais de uma profissional"
              descricao="Disponível para empresas acima de 200 m². O valor do serviço é multiplicado pela quantidade de profissionais escolhida."
            />
          </Label>
          <div className="grid grid-cols-5 gap-3">
            {QTD_PROFISSIONAIS.map((qtd) => (
              <Cartao
                key={qtd}
                ativo={rascunho.qtd_profissionais === qtd}
                onClick={() => atualizar({ qtd_profissionais: qtd })}
              >
                <span className="mx-auto text-sm font-medium">{qtd}</span>
              </Cartao>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="outros">Outros ambientes (opcional)</Label>
        <Input
          id="outros"
          placeholder="Depósito, garagem, área de café..."
          value={rascunho.outros_ambientes}
          onChange={(e) => atualizar({ outros_ambientes: e.target.value })}
        />
      </div>
    </div>
  );
}

export function PassoTamanho({ rascunho, atualizar }: Props) {
  return ehComercial(rascunho.tipo_imovel) ? (
    <TamanhoComercial rascunho={rascunho} atualizar={atualizar} />
  ) : (
    <TamanhoResidencial rascunho={rascunho} atualizar={atualizar} />
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
          Na dúvida, 6 horas atende a maioria dos imóveis.
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
              <InfoDescricao titulo={duracao.label} descricao={duracao.descricao} />
            </span>
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
  const comercial = ehComercial(rascunho.tipo_imovel);
  const opcoes = comercial ? TIPOS_LIMPEZA_COMERCIAL : TIPOS_LIMPEZA;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {comercial ? "Qual nível de serviço?" : "Qual tipo de limpeza?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toque no ⓘ para ver o que está incluído em cada opção.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {opcoes.map((tipo) => (
          <Cartao
            key={tipo.id}
            ativo={rascunho.tipo_limpeza === tipo.id}
            onClick={() => atualizar({ tipo_limpeza: tipo.id })}
          >
            <span className="flex items-center gap-2 font-semibold">
              {tipo.label}
              <InfoDescricao titulo={tipo.label} descricao={tipo.descricao} />
            </span>
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
