import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadFoto } from "@/components/upload-foto";

type Perfil = {
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
};

export function MeuPerfil({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["perfil", userId],
    queryFn: async (): Promise<Perfil> => {
      const { data: perfil, error } = await supabase
        .from("profiles")
        .select("nome, cpf, telefone, email, data_nascimento, foto_url")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return perfil as Perfil;
    },
  });

  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setTelefone(data.telefone ?? "");
    setEmail(data.email ?? "");
    setNascimento(data.data_nascimento ?? "");
    setFoto(data.foto_url ?? null);
  }, [data]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          data_nascimento: nascimento || null,
          foto_url: foto,
        })
        .eq("id", userId);
      if (error) throw error;

      if (data && email.trim() && email.trim() !== (data.email ?? "")) {
        const { error: erroAuth } = await supabase.auth.updateUser({ email: email.trim() });
        if (erroAuth) throw erroAuth;
        toast.info("Confirme o novo e-mail", {
          description: "Enviamos um link de confirmação para o endereço informado.",
        });
      }
    },
    onSuccess: () => {
      toast.success("Dados atualizados!");
      queryClient.invalidateQueries({ queryKey: ["perfil", userId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <UploadFoto userId={userId} url={foto} nome={data.nome} onChange={setFoto} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" /> Nome completo
            </Label>
            <Input id="nome" value={data.nome ?? ""} disabled readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpf" className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" /> CPF
            </Label>
            <Input id="cpf" value={data.cpf ?? "—"} disabled readOnly />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Nome e documentos não podem ser alterados. Se houver algum erro, fale com o suporte
          LAR10.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone / WhatsApp</Label>
            <Input
              id="telefone"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nascimento">Data de nascimento</Label>
            <Input
              id="nascimento"
              type="date"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
            />
          </div>
        </div>

        <Button className="gap-2" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
          {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </CardContent>
    </Card>
  );
}
