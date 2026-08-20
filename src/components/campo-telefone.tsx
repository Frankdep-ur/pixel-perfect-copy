import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarTelefone } from "@/lib/whatsapp";

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  ajuda?: string;
  className?: string;
};

/**
 * Campo de WhatsApp tolerante: aceita qualquer DDD do Brasil e também números
 * internacionais (basta digitar com +DDI). Não há lista fixa de DDDs.
 */
export function CampoTelefone({
  id = "telefone",
  label = "WhatsApp",
  value,
  onChange,
  required,
  ajuda = "Qualquer DDD do Brasil ou número internacional (use +DDI).",
  className,
}: Props) {
  return (
    <div className={className ?? "space-y-2"}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="tel"
        autoComplete="tel"
        required={required}
        value={value}
        onChange={(e) => onChange(formatarTelefone(e.target.value))}
        placeholder="(11) 99999-9999 ou +351 961 000 000"
      />
      <p className="text-xs text-muted-foreground">{ajuda}</p>
    </div>
  );
}
