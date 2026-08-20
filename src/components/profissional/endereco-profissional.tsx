import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapaLocal } from "@/components/mapa-local";
import { buscarCep, mascaraCep } from "@/lib/contratacao";

export type EnderecoProf = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
};

export const ENDERECO_PROF_INICIAL: EnderecoProf = {
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  latitude: null,
  longitude: null,
};

type Props = {
  valor: EnderecoProf;
  onChange: (parcial: Partial<EnderecoProf>) => void;
};

/**
 * Endereço da profissional + localizador no mapa. A coordenada é o que define
 * quais serviços entram no raio de atuação dela.
 */
export function EnderecoProfissional({ valor, onChange }: Props) {
  const [buscando, setBuscando] = useState(false);

  async function consultarCep(cep: string) {
    if (cep.replace(/\D/g, "").length !== 8) return;
    setBuscando(true);
    try {
      const dados = await buscarCep(cep);
      onChange({
        rua: dados.logradouro ?? valor.rua,
        bairro: dados.bairro ?? valor.bairro,
        cidade: dados.localidade ?? valor.cidade,
        estado: dados.uf ?? valor.estado,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  const enderecoTexto = [valor.rua, valor.numero, valor.bairro, valor.cidade, valor.estado]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      <div>
        <Label>Endereço completo</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Usamos seu endereço apenas para calcular a distância dos serviços. O cliente não vê
          esses dados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prof-cep">CEP</Label>
          <div className="relative">
            <Input
              id="prof-cep"
              inputMode="numeric"
              value={valor.cep}
              onChange={(e) => {
                const cep = mascaraCep(e.target.value);
                onChange({ cep });
                void consultarCep(cep);
              }}
              placeholder="00000-000"
            />
            {buscando && (
              <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-primary" />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-rua">Rua</Label>
          <Input
            id="prof-rua"
            value={valor.rua}
            onChange={(e) => onChange({ rua: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-numero">Número</Label>
          <Input
            id="prof-numero"
            value={valor.numero}
            onChange={(e) => onChange({ numero: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-compl">Complemento</Label>
          <Input
            id="prof-compl"
            value={valor.complemento}
            onChange={(e) => onChange({ complemento: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-bairro">Bairro</Label>
          <Input
            id="prof-bairro"
            value={valor.bairro}
            onChange={(e) => onChange({ bairro: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prof-estado">Estado</Label>
          <Input
            id="prof-estado"
            maxLength={2}
            value={valor.estado}
            onChange={(e) => onChange({ estado: e.target.value.toUpperCase() })}
          />
        </div>
      </div>

      <MapaLocal
        latitude={valor.latitude}
        longitude={valor.longitude}
        enderecoTexto={enderecoTexto}
        onChange={(coord) => onChange(coord)}
      />
    </div>
  );
}
