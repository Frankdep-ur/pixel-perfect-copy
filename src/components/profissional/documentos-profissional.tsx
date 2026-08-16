import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadDocumento } from "@/components/upload-documento";

type Props = {
  profissionalId: string;
  userId: string;
  docIdentidade: string | null;
  docCpf: string | null;
  comprovante: string | null;
  telefoneRecado: string | null;
};

export function DocumentosProfissional({
  profissionalId,
  userId,
  docIdentidade,
  docCpf,
  comprovante,
  telefoneRecado,
}: Props) {
  const queryClient = useQueryClient();
  const [recado, setRecado] = useState(telefoneRecado ?? "");

  const salvar = useMutation({
    mutationFn: async (campos: {
      doc_identidade_url?: string;
      doc_cpf_url?: string;
      comprovante_url?: string;
      telefone_recado?: string | null;
    }) => {
      const { error } = await supabase
        .from("profissionais")
        .update(campos)
        .eq("id", profissionalId);
      if (error) throw error;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meu-perfil-profissional"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" /> Documentos e contato de emergência
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Os documentos são vistos apenas pela equipe Lar77 e são obrigatórios para aprovação.
          Depois de enviados, só a equipe pode alterá-los.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <UploadDocumento
          userId={userId}
          pasta="identidade"
          titulo="RG ou CNH"
          descricao="Foto legível da frente e do verso, ou PDF."
          url={docIdentidade}
          onChange={(url) => salvar.mutate({ doc_identidade_url: url })}
        />
        <UploadDocumento
          userId={userId}
          pasta="cpf"
          titulo="CPF"
          descricao="Documento com o número do CPF (pode ser a própria CNH)."
          url={docCpf}
          onChange={(url) => salvar.mutate({ doc_cpf_url: url })}
        />
        <UploadDocumento
          userId={userId}
          pasta="residencia"
          titulo="Comprovante de residência"
          descricao="Conta de luz, água ou internet dos últimos 3 meses."
          url={comprovante}
          onChange={(url) => salvar.mutate({ comprovante_url: url })}
        />

        <div className="space-y-2 pt-2">
          <Label htmlFor="recado">Telefone de recado (emergência)</Label>
          <Input
            id="recado"
            inputMode="tel"
            value={recado}
            placeholder="(48) 98888-0000"
            onChange={(e) => setRecado(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Um número de familiar ou pessoa próxima, usado só em caso de emergência.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate({ telefone_recado: recado.trim() || null })}
          >
            {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar telefone de recado
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
