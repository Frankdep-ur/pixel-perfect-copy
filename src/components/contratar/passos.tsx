import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Info, Loader2, MapPin, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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
  tipoLimpezaParaDuracao,
  formatBRL,
} from "@/lib/catalogo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CabecalhoPasso, CardDuracao, CardOpcao } from "@/components/contratar/ui-funil";
import { dataMinimaAgendamento, ehDomingo, horariosPermitidos } from "@/lib/agenda";
import { type Rascunho } from "@/lib/contratacao";
import { FormEndereco } from "@/components/enderecos/form-endereco";
import { SeletorTipoImovel } from "@/components/enderecos/seletor-tipo-imovel";
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
        "flex w-full flex-col items-start gap-1 rounded-[14px] border bg-surface p-4 text-left transition-colors duration-200 ease-out active:scale-[0.99]",
        ativo ? "border-accent bg-surface-tint" : "border-transparent",
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
  precoAirbnb,
}: Props & { userId: string; precoAirbnb?: number }) {
  const queryClient = useQueryClient();
  const { data: enderecos, isLoading } = useQuery(enderecosQuery(userId));
  const [novo, setNovo] = useState(false);

  function escolher(e: Endereco) {
    atualizar({
      endereco_id: e.id,
      tipo_imovel: e.tipo_imovel ?? rascunho.tipo_imovel,
      endereco: {
        cep: e.cep ?? "",
        rua: e.rua ?? "",
        numero: e.numero ?? "",
        complemento: e.complemento ?? "",
        bairro: e.bairro ?? "",
        cidade: e.cidade ?? "",
        estado: e.estado ?? "",
        regiao: (e.regiao as RegiaoId | null) ?? null,
        latitude: e.latitude,
        longitude: e.longitude,
      },
    });
  }

  const lista = enderecos ?? [];
  const semImoveis = !isLoading && lista.length === 0;
  const cadastrando = novo || semImoveis;

  return (
    <div className="space-y-5">
      {!cadastrando && (
        <CabecalhoPasso
          titulo="Onde será a limpeza?"
          subtitulo={`Escolha um dos seus imóveis. Atendemos ${REGIOES.grande_floripa.nome} e ${REGIOES.balneario.nome}.`}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {!cadastrando && lista.length > 0 && (
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
              <span className="text-sm text-muted-foreground">
                {e.tipo_imovel
                  ? `${TIPOS_IMOVEL.find((t) => t.id === e.tipo_imovel)?.label ?? e.tipo_imovel} · `
                  : ""}
                {resumoEndereco(e)}
              </span>
            </Cartao>
          ))}
        </div>
      )}

      {cadastrando && (
        <FormEndereco
          userId={userId}
          onSalvo={(salvo) => {
            queryClient.invalidateQueries({ queryKey: ["enderecos"] });
            escolher(salvo);
            setNovo(false);
          }}
          {...(semImoveis ? {} : { onCancelar: () => setNovo(false) })}
        />
      )}

      {!cadastrando && (
        <Button type="button" variant="outline" onClick={() => setNovo(true)} className="min-h-12 w-full gap-2 rounded-2xl">
          <Plus className="size-4" /> Cadastrar outro imóvel
        </Button>
      )}

      {rascunho.endereco_id && !rascunho.tipo_imovel && !cadastrando && (
        <SeletorTipoImovel
          valor={null}
          onChange={(id) => {
            atualizar({ tipo_imovel: id });
            void supabase.from("enderecos").update({ tipo_imovel: id }).eq("id", rascunho.endereco_id!);
          }}
          titulo="Qual o tipo deste imóvel?"
          subtitulo="Esse endereço ainda não tem o tipo. Escolha uma vez — fica salvo."
        />
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
      <CabecalhoPasso
        titulo="Qual o tipo do imóvel?"
        subtitulo="Essa informação nos ajuda a entender melhor suas necessidades."
      />
      <div className="grid gap-2.5">
        {TIPOS_IMOVEL.map((tipo) => {
          const Icone = tipo.icon;
          return (
            <CardOpcao
              key={tipo.id}
              icone={Icone}
              label={tipo.label}
              selo={tipo.selo}
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
            />
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
      <CabecalhoPasso
        titulo="Como é o imóvel?"
        subtitulo="Quartos, banheiros e cozinhas influenciam o valor final."
      />
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
      <CabecalhoPasso
        titulo={`Como é o ${empresa ? "espaço da empresa" : "escritório"}?`}
        subtitulo="Cada ambiente e o volume de pessoas ajustam o valor do serviço."
      />

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
      <CabecalhoPasso
        titulo="Qual tipo de serviço?"
        subtitulo="Na dúvida, 6 horas atende a maioria dos imóveis."
      />
      <div className="grid gap-2.5">
        {DURACOES.map((duracao) => (
          <CardDuracao
            key={duracao.horas}
            nome={duracao.nivel}
            horas={duracao.label}
            descricao={duracao.descricao}
            valor={formatBRL(precos[`preco_${duracao.horas}h`] ?? 0)}
            ativo={rascunho.duracao_horas === duracao.horas}
            onClick={() => {
              const trava = tipoLimpezaParaDuracao(duracao.horas, rascunho.tipo_imovel);
              atualizar({
                duracao_horas: duracao.horas,
                ...(trava
                  ? { tipo_limpeza: trava }
                  : rascunho.duracao_horas === 4
                    ? { tipo_limpeza: null }
                    : {}),
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function PassoTipoLimpeza({ rascunho, atualizar }: Props) {
  if (rascunho.duracao_horas === 4) {
    const trava = tipoLimpezaParaDuracao(4, rascunho.tipo_imovel);
    const label = [...TIPOS_LIMPEZA, ...TIPOS_LIMPEZA_COMERCIAL].find((t) => t.id === trava)?.label;
    return (
      <div className="space-y-2 rounded-2xl border border-border bg-surface-tint p-4">
        <p className="text-sm font-semibold">Tipo de limpeza: {label ?? "Padrão"}</p>
        <p className="text-sm text-muted-foreground">
          No pacote de 4 horas a limpeza é obrigatoriamente padrão.
        </p>
      </div>
    );
  }

  const comercial = ehComercial(rascunho.tipo_imovel);
  const opcoes = comercial ? TIPOS_LIMPEZA_COMERCIAL : TIPOS_LIMPEZA;

  return (
    <div className="space-y-5">
      <CabecalhoPasso
        titulo={comercial ? "Qual nível de serviço?" : "Qual tipo de limpeza?"}
        subtitulo="Toque no ⓘ para ver o que está incluído em cada opção."
      />
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
      <CabecalhoPasso
        titulo="Quer incluir algum extra?"
        subtitulo="Opcional — você pode seguir sem escolher nenhum."
      />
      <div className="space-y-3">
        {extras
          .filter((extra) =>
            /churrasqueira|forno e geladeira/i.test(extra.nome),
          )
          .map((extra) => {
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
  const airbnbHorarios = ehAirbnb(rascunho.tipo_imovel);
  const horarios = horariosPermitidos(rascunho.duracao_horas, airbnbHorarios);
  const domingo = ehDomingo(rascunho.data);

  return (
    <div className="space-y-5">
      <CabecalhoPasso
        titulo="Quando você precisa?"
        subtitulo="Agende com pelo menos 24 horas de antecedência. Não atendemos domingos."
      />
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
          {airbnbHorarios
            ? "Na limpeza de checkout você escolhe qualquer horário entre 07:00 e 16:00."
            : `Para ${rascunho.duracao_horas ?? 4} horas de serviço, os horários possíveis são ${horarios.join(" e ")}.`}
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
      <CabecalhoPasso
        titulo="Algo que a profissional precisa saber?"
        subtitulo="Animais, acesso ao prédio, produtos disponíveis, prioridades da limpeza."
      />
      <Textarea
        rows={6}
        placeholder="Ex.: tenho dois gatos, a chave fica com o porteiro, priorizar a cozinha."
        value={rascunho.observacoes}
        onChange={(e) => atualizar({ observacoes: e.target.value })}
      />
    </div>
  );
}
