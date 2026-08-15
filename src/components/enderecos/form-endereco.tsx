import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buscarCep, mascaraCep } from "@/lib/contratacao";
import { REGIOES, regiaoPorCidade } from "@/lib/regioes";
import type { Endereco } from "@/lib/enderecos";

type Campos = {
  apelido: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  regiao: string | null;
};

function inicial(endereco?: Endereco | null): Campos {
  return {
    apelido: endereco?.apelido ?? "",
    cep: endereco?.cep ?? "",
    rua: endereco?.rua ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    estado: endereco?.estado ?? "",
    regiao: endereco?.regiao ?? null,
  };
}

export function FormEndereco({
  userId,
  endereco,
  onSalvo,
  onCancelar,
}: {
  userId: string;
  endereco?: Endereco | null;
  onSalvo: (endereco: Endereco) => void;
  onCancelar?: () => void;
}) {
  const [campos, setCampos] = useState<Campos>(() => inicial(endereco));
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function set(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  async function consultar() {
    setBuscando(true);
    try {
      const dados = await buscarCep(campos.cep);
      const cidade = dados.localidade ?? "";
      const regiao = regiaoPorCidade(cidade);
      setCampos((atual) => ({
        ...atual,
        rua: dados.logradouro ?? atual.rua,
        bairro: dados.bairro ?? atual.bairro,
        cidade,
        estado: dados.uf ?? "",
        regiao,
      }));
      if (!regiao) {
        toast.info("Ainda não atendemos esta cidade", {
          description: `Atendemos ${REGIOES.grande_floripa.nome} e ${REGIOES.balneario.nome}.`,
        });
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Erro ao consultar o CEP.");
    } finally {
      setBuscando(false);
    }
  }

  async function salvar() {
    if (!campos.rua || !campos.numero || !campos.cidade) {
      toast.error("Preencha rua, número e cidade.");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        user_id: userId,
        apelido: campos.apelido.trim() || "Meu imóvel",
        cep: campos.cep,
        rua: campos.rua,
        numero: campos.numero,
        complemento: campos.complemento,
        bairro: campos.bairro,
        cidade: campos.cidade,
        estado: campos.estado,
        regiao: campos.regiao ?? regiaoPorCidade(campos.cidade),
      };

      const consulta = endereco
        ? supabase.from("enderecos").update(payload).eq("id", endereco.id)
        : supabase.from("enderecos").insert(payload);

      const { data, error } = await consulta
        .select(
          "id, apelido, cep, rua, numero, complemento, bairro, cidade, estado, regiao, padrao",
        )
        .single();
      if (error) throw error;

      toast.success(endereco ? "Imóvel atualizado!" : "Imóvel cadastrado!");
      onSalvo(data as Endereco);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar o imóvel.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="apelido">Nome do imóvel</Label>
        <Input
          id="apelido"
          placeholder="Casa, Apartamento da praia, Escritório…"
          value={campos.apelido}
          onChange={(e) => set("apelido", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <div className="flex gap-2">
          <Input
            id="cep"
            inputMode="numeric"
            placeholder="88000-000"
            value={campos.cep}
            onChange={(e) => set("cep", mascaraCep(e.target.value))}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={consultar}
            disabled={buscando || campos.cep.replace(/\D/g, "").length !== 8}
          >
            {buscando ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Buscar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="rua">Rua</Label>
          <Input id="rua" value={campos.rua} onChange={(e) => set("rua", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" value={campos.numero} onChange={(e) => set("numero", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            placeholder="Apto, bloco, referência"
            value={campos.complemento}
            onChange={(e) => set("complemento", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" value={campos.bairro} onChange={(e) => set("bairro", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={campos.cidade}
            onChange={(e) => {
              const cidade = e.target.value;
              setCampos((atual) => ({ ...atual, cidade, regiao: regiaoPorCidade(cidade) }));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estado">Estado</Label>
          <Input
            id="estado"
            maxLength={2}
            value={campos.estado}
            onChange={(e) => set("estado", e.target.value.toUpperCase())}
          />
        </div>
      </div>

      {campos.cidade && !campos.regiao && (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          Ainda não atendemos <strong>{campos.cidade}</strong>. Você pode salvar o imóvel, mas a
          contratação está disponível apenas nas regiões atendidas.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={salvar} disabled={salvando} className="gap-2">
          {salvando && <Loader2 className="size-4 animate-spin" />}
          {endereco ? "Salvar alterações" : "Salvar imóvel"}
        </Button>
        {onCancelar && (
          <Button type="button" variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
