import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TIPOS_LIMPEZA } from "@/lib/catalogo";
import { REGIOES, type RegiaoId } from "@/lib/regioes";
import { UploadFoto } from "@/components/upload-foto";

type Props = { user: User };

export function CadastroProfissional({ user }: Props) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState((user.user_metadata?.['nome'] as string) ?? "");
  const [telefone, setTelefone] = useState((user.user_metadata?.['telefone'] as string) ?? "");
  const [foto, setFoto] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [anos, setAnos] = useState("1");
  const [raio, setRaio] = useState("15");
  const [regiao, setRegiao] = useState<RegiaoId>("grande_floripa");
  const [cidade, setCidade] = useState("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>(["padrao"]);


  function alternar(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe seu nome completo.");
      if (tipos.length === 0) throw new Error("Escolha pelo menos um tipo de limpeza.");
      if (cidades.length === 0) throw new Error("Escolha as cidades que você atende.");

      const { error: erroPerfil } = await supabase
        .from("profiles")
        .update({ nome: nome.trim(), telefone: telefone.trim() || null, foto_url: foto })
        .eq("id", user.id);

      if (erroPerfil) throw erroPerfil;

      const { error } = await supabase.from("profissionais").insert({
        user_id: user.id,
        bio: bio.trim() || null,
        anos_experiencia: Number(anos) || 0,
        raio_km: Number(raio) || 15,
        regiao,
        cidade: cidade || cidades[0] || null,
        cidades_atendidas: cidades,
        tipos_limpeza: tipos,
      });
      if (error) throw error;

      await supabase.from("user_roles").insert({ user_id: user.id, role: "profissional" });
    },
    onSuccess: () => {
      toast.success("Cadastro enviado! Nossa equipe vai analisar seu perfil.");
      queryClient.invalidateQueries({ queryKey: ["meu-perfil-profissional"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Cadastro de profissional</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha seus dados para começar a receber serviços. Seu perfil passa por análise
          antes de ficar visível para os clientes.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">WhatsApp</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(48) 99999-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anos">Anos de experiência</Label>
            <Input
              id="anos"
              type="number"
              min={0}
              value={anos}
              onChange={(e) => setAnos(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="raio">Distância máxima que você atende (km)</Label>
            <Input
              id="raio"
              type="number"
              min={1}
              value={raio}
              onChange={(e) => setRaio(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Sobre você</Label>
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte sua experiência, cuidados e diferenciais no atendimento."
          />
        </div>

        <div className="space-y-3">
          <Label>Região de atuação</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(REGIOES) as RegiaoId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRegiao(id);
                  setCidades([]);
                  setCidade("");
                }}
                className={cn(
                  "rounded-xl border p-4 text-left text-sm transition",
                  regiao === id
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/40",
                )}
              >
                <span className="font-medium">{REGIOES[id].nome}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Cidades atendidas</Label>
          <div className="flex flex-wrap gap-4">
            {REGIOES[regiao].cidades.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={cidades.includes(c)}
                  onCheckedChange={() => alternar(cidades, setCidades, c)}
                />
                {c}
              </label>
            ))}
          </div>
          {cidades.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="cidade-base">Cidade onde você mora</Label>
              <select
                id="cidade-base"
                value={cidade || cidades[0]}
                onChange={(e) => setCidade(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {cidades.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Tipos de limpeza que você faz</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {TIPOS_LIMPEZA.map((t) => (
              <label
                key={t.id}
                className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"
              >
                <Checkbox
                  checked={tipos.includes(t.id)}
                  onCheckedChange={() => alternar(tipos, setTipos, t.id)}
                />
                <span>
                  <span className="font-medium">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.descricao}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={salvar.isPending}
          onClick={() => salvar.mutate()}
        >
          {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enviar cadastro
        </Button>
      </CardContent>
    </Card>
  );
}
