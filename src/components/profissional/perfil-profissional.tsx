import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadFoto } from "@/components/upload-foto";
import { TIPOS_LIMPEZA, TIPOS_LIMPEZA_AIRBNB } from "@/lib/catalogo";
import { REGIOES, type RegiaoId } from "@/lib/regioes";
import { cn } from "@/lib/utils";
import {
  EnderecoProfissional,
  ENDERECO_PROF_INICIAL,
  type EnderecoProf,
} from "@/components/profissional/endereco-profissional";

export type PerfilProfissionalEdicao = {
  id: string;
  user_id: string;
  bio: string | null;
  anos_experiencia: number | null;
  raio_km: number | null;
  regiao: string | null;
  cidade: string | null;
  cidades_atendidas: string[];
  tipos_limpeza: string[];
  nome: string | null;
  telefone: string | null;
  foto_url: string | null;
  pix_tipo: string | null;
  pix_chave: string | null;
  pix_titular: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  estado?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const TIPOS_PIX = [
  { id: "cpf", label: "CPF" },
  { id: "telefone", label: "Telefone" },
  { id: "email", label: "E-mail" },
  { id: "aleatoria", label: "Chave aleatória" },
];

export function PerfilProfissional({ perfil }: { perfil: PerfilProfissionalEdicao }) {
  const queryClient = useQueryClient();
  const [foto, setFoto] = useState(perfil.foto_url);
  const nome = perfil.nome ?? "";
  const telefone = perfil.telefone ?? "";
  const [bio, setBio] = useState(perfil.bio ?? "");
  const [anos, setAnos] = useState(perfil.anos_experiencia === null ? "" : String(perfil.anos_experiencia));
  const [raio, setRaio] = useState(perfil.raio_km === null ? "" : String(perfil.raio_km));
  const [regiao, setRegiao] = useState<RegiaoId>(
    (perfil.regiao as RegiaoId) in REGIOES ? (perfil.regiao as RegiaoId) : "grande_floripa",
  );
  const [cidades, setCidades] = useState<string[]>(perfil.cidades_atendidas ?? []);
  const [cidade, setCidade] = useState(perfil.cidade ?? "");
  const [tipos, setTipos] = useState<string[]>(perfil.tipos_limpeza ?? []);
  const [pixTipo, setPixTipo] = useState(perfil.pix_tipo ?? "cpf");
  const [pixChave, setPixChave] = useState(perfil.pix_chave ?? "");
  const [pixTitular, setPixTitular] = useState(perfil.pix_titular ?? nome);
  const [endereco, setEndereco] = useState<EnderecoProf>({
    ...ENDERECO_PROF_INICIAL,
    cep: perfil.cep ?? "",
    rua: perfil.rua ?? "",
    numero: perfil.numero ?? "",
    complemento: perfil.complemento ?? "",
    bairro: perfil.bairro ?? "",
    cidade: perfil.cidade ?? "",
    estado: perfil.estado ?? "",
    latitude: perfil.latitude ?? null,
    longitude: perfil.longitude ?? null,
  });



  function alternar(lista: string[], set: (v: string[]) => void, valor: string) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const salvar = useMutation({
    mutationFn: async (dados?: { foto_url?: string | null }) => {
      const fotoFinal = dados && "foto_url" in dados ? (dados.foto_url ?? null) : foto;
      if (!nome.trim()) throw new Error("Informe seu nome completo.");
      if (cidades.length === 0) throw new Error("Escolha ao menos uma cidade atendida.");
      if (tipos.length === 0) throw new Error("Escolha ao menos um tipo de limpeza.");
      if (!anos.trim()) throw new Error("Informe seus anos de experiência.");
      if (!raio.trim() || Number(raio) <= 0)
        throw new Error("Informe a distância máxima que você atende (km).");
      if (!pixChave.trim()) throw new Error("Informe sua chave PIX para recebimento.");
      if (!pixTitular.trim()) throw new Error("Informe o nome do titular da conta PIX.");
      if (
        nome.trim() &&
        pixTitular.trim().toLowerCase() !== nome.trim().toLowerCase()
      )
        throw new Error("O titular do PIX deve ser exatamente o mesmo nome do seu cadastro.");
      if (!dados) {
        if (!endereco.rua.trim() || !endereco.numero.trim())
          throw new Error("Informe seu endereço completo (rua e número).");
        if (endereco.latitude === null || endereco.longitude === null)
          throw new Error("Marque sua localização no mapa para receber serviços perto de você.");
      }

      const { error: erroPerfil } = await supabase
        .from("profiles")
        .update({ foto_url: fotoFinal })
        .eq("id", perfil.user_id);
      if (erroPerfil) throw erroPerfil;


      const { error } = await supabase
        .from("profissionais")
        .update({
          bio: bio.trim() || null,
          anos_experiencia: Number(anos),
          raio_km: Number(raio),
          pix_tipo: pixTipo,
          pix_chave: pixChave.trim(),
          pix_titular: pixTitular.trim(),
          regiao,
          cidade: cidade || cidades[0] || null,
          cidades_atendidas: cidades,
          tipos_limpeza: tipos,
          cep: endereco.cep || null,
          rua: endereco.rua.trim() || null,
          numero: endereco.numero.trim() || null,
          complemento: endereco.complemento.trim() || null,
          bairro: endereco.bairro.trim() || null,
          estado: endereco.estado.trim() || null,
          latitude: endereco.latitude,
          longitude: endereco.longitude,
        })
        .eq("id", perfil.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["meu-perfil-profissional"] });
      queryClient.invalidateQueries({ queryKey: ["profissionais"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return (
    <Card className="mt-3">
      <CardHeader>
        <CardTitle>Meu perfil</CardTitle>
        <p className="text-sm text-muted-foreground">
          Essas informações aparecem para os clientes na hora de escolher a profissional.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <UploadFoto
          userId={perfil.user_id}
          url={foto}
          nome={nome}
          onChange={(url) => {
            setFoto(url);
            salvar.mutate({ foto_url: url });
          }}
        />

        <div className="space-y-3 rounded-xl bg-surface-tint p-4 text-sm">
          <p className="font-semibold text-foreground">Dados cadastrais</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <p className="text-muted-foreground">
              Nome: <span className="font-medium text-foreground">{nome || "—"}</span>
            </p>
            <p className="text-muted-foreground">
              WhatsApp: <span className="font-medium text-foreground">{telefone || "—"}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Nome, telefone, e-mail e documentos só podem ser alterados pela equipe Lar77 — fale
            com o suporte se algo estiver errado.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-anos">Anos de experiência *</Label>
            <Input
              id="p-anos"
              type="number"
              min={0}
              value={anos}
              onChange={(e) => setAnos(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-raio">Distância máxima que atende (km) *</Label>
            <Input
              id="p-raio"
              type="number"
              min={1}
              value={raio}
              onChange={(e) => setRaio(e.target.value)}
            />
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="p-bio">Sobre você</Label>
          <Textarea
            id="p-bio"
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
              <Label htmlFor="p-cidade">Cidade onde você mora</Label>
              <select
                id="p-cidade"
                value={cidades.includes(cidade) ? cidade : cidades[0]}
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
          <Label>Tipos de limpeza</Label>
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

        <div className="space-y-3 rounded-xl border border-border p-4">
          <div>
            <Label>Conta PIX para recebimento *</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              A conta precisa estar no mesmo nome do seu cadastro. É por aqui que a Lar77
              repassa os seus pagamentos.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-pix-tipo">Tipo de chave</Label>
              <select
                id="p-pix-tipo"
                value={pixTipo}
                onChange={(e) => setPixTipo(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIPOS_PIX.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-pix-chave">Chave PIX</Label>
              <Input
                id="p-pix-chave"
                value={pixChave}
                onChange={(e) => setPixChave(e.target.value)}
                placeholder="Sua chave PIX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-pix-titular">Nome do titular</Label>
            <Input
              id="p-pix-titular"
              value={pixTitular}
              onChange={(e) => setPixTitular(e.target.value)}
              placeholder="Igual ao nome do cadastro"
            />
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={salvar.isPending}
          onClick={() => salvar.mutate(undefined)}
        >
          {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Salvar alterações
        </Button>
      </CardContent>
    </Card>
  );
}
