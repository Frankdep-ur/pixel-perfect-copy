import { Check, Star } from "lucide-react";

import { CabecalhoPasso, CardOpcao } from "@/components/contratar/ui-funil";
import {
  AIRBNB_INCLUSOS,
  TIPOS_IMOVEL,
  ehAirbnb,
  formatBRL,
} from "@/lib/catalogo";

export function SeletorTipoImovel({
  valor,
  onChange,
  precoAirbnb,
  titulo = "Qual o tipo do imóvel?",
  subtitulo = "Essa informação nos ajuda a entender melhor suas necessidades.",
}: {
  valor: string | null;
  onChange: (id: string) => void;
  precoAirbnb?: number;
  titulo?: string;
  subtitulo?: string;
}) {
  const airbnb = ehAirbnb(valor);

  return (
    <div className="space-y-5">
      <CabecalhoPasso titulo={titulo} subtitulo={subtitulo} />
      <div className="grid gap-2.5">
        {TIPOS_IMOVEL.map((tipo) => {
          const Icone = tipo.icon;
          return (
            <CardOpcao
              key={tipo.id}
              icone={Icone}
              label={tipo.label}
              selo={tipo.selo}
              ativo={valor === tipo.id}
              onClick={() => onChange(tipo.id)}
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
          {precoAirbnb != null && (
            <p className="text-sm font-semibold text-foreground">
              Valor fixo do serviço: {formatBRL(precoAirbnb)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                (taxa da Lar77 já inclusa)
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
