import { useEffect, useState } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CampoTelefone } from "@/components/campo-telefone";

function mascaraCpf(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export type PapelAcesso = "cliente" | "profissional";

type Props = {
  papel: PapelAcesso;
  next: string | undefined;
};

const CONFIG: Record<
  PapelAcesso,
  {
    titulo: string;
    subtitulo: string;
    destino: string;
    ctaCriar: string;
    rotaOposta: string;
    labelOposta: string;
  }
> = {
  cliente: {
    titulo: "Acesso cliente",
    subtitulo: "Entre para contratar faxinas e acompanhar seus serviços.",
    destino: "/minha-conta",
    ctaCriar: "Criar conta de cliente",
    rotaOposta: "/profissional/entrar",
    labelOposta: "Sou profissional de limpeza",
  },
  profissional: {
    titulo: "Acesso profissional",
    subtitulo: "Entre para receber pedidos da sua região e gerenciar sua agenda.",
    destino: "/profissional",
    ctaCriar: "Quero trabalhar com a Lar77",
    rotaOposta: "/entrar",
    labelOposta: "Quero contratar uma faxina",
  },
};

function destinoSeguro(next: string | undefined, padrao: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return padrao;
  return next;
}

export function FormAcesso({ papel, next }: Props) {
  const config = CONFIG[papel];
  const navigate = useNavigate();
  const router = useRouter();
  const destino = destinoSeguro(next, config.destino);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: destino, replace: true });
    });
  }, [destino, navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    router.invalidate();
    navigate({ to: destino, replace: true });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    const cpfDigitos = cpf.replace(/\D/g, "");
    if (cpfDigitos.length !== 11) {
      toast.error("Informe um CPF válido", { description: "O CPF deve ter 11 dígitos." });
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone, cpf: cpfDigitos, role: papel },
        emailRedirectTo: `${window.location.origin}${destino}`,
      },
    });
    setEnviando(false);
    if (error) {
      const descricao =
        error.message.includes("at least 6") || error.message.includes("weak_password")
          ? "Use uma senha com pelo menos 6 caracteres."
          : error.message;
      toast.error("Não foi possível criar a conta", { description: descricao });
      return;
    }
    toast.success("Conta criada!", { description: "Bem-vinda ao Lar77." });
    router.invalidate();
    navigate({ to: destino, replace: true });
  }

  async function entrarComGoogle() {
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?next=${encodeURIComponent(destino)}`,
    });
    if (resultado.error) {
      toast.error("Falha no login com Google");
      return;
    }
    if (resultado.redirected) return;
    router.invalidate();
    navigate({ to: destino, replace: true });
  }

  const Icone = papel === "profissional" ? Sparkles : ShieldCheck;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 pb-16 pt-8">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/12">
        <Icone className="size-5 text-primary" />
      </span>
      <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight">{config.titulo}</h1>
      <p className="mt-2 text-center text-[15px] text-muted-foreground">{config.subtitulo}</p>

      <Button type="button" variant="outline" className="mt-7 h-12 w-full text-base" onClick={entrarComGoogle}>
        Continuar com Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-[13px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou use seu e-mail
        <span className="h-px flex-1 bg-border" />
      </div>

      <Tabs defaultValue="entrar">
        <TabsList className="grid h-auto w-full grid-cols-2 p-1">
          <TabsTrigger value="entrar" className="min-h-11 text-[13px]">Entrar</TabsTrigger>
          <TabsTrigger value="criar" className="min-h-11 text-[13px]">Criar conta</TabsTrigger>
        </TabsList>

        <TabsContent value="entrar">
          <form className="space-y-4 pt-4" onSubmit={entrar}>
            <div className="space-y-2">
              <Label htmlFor="email-login">E-mail</Label>
              <Input
                className="h-12"
                id="email-login"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-login">Senha</Label>
              <Input
                className="h-12"
                id="senha-login"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 w-full text-base" size="lg" disabled={enviando}>
              {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="criar">
          <form className="space-y-4 pt-4" onSubmit={cadastrar}>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" className="h-12" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <CampoTelefone
              id="telefone"
              label="Telefone (WhatsApp)"
              value={telefone}
              onChange={setTelefone}
            />
            <div className="space-y-2">
              <Label htmlFor="cpf-novo">CPF</Label>
              <Input
                className="h-12"
                id="cpf-novo"
                inputMode="numeric"
                required
                value={cpf}
                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                placeholder="000.000.000-00"
              />
              <p className="text-[13px] text-muted-foreground">
                Obrigatório para validarmos sua conta na Lar77.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-novo">E-mail</Label>
              <Input
                className="h-12"
                id="email-novo"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha-nova">Senha</Label>
              <Input
                className="h-12"
                id="senha-nova"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <p className="text-[13px] text-muted-foreground">Mínimo de 6 caracteres.</p>
            </div>
            <Button type="submit" className="h-12 w-full text-base" size="lg" disabled={enviando}>
              {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
              {config.ctaCriar}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* O acesso da profissional é uma jornada fechada: sem atalho para o lado cliente. */}
      {papel === "cliente" && (
        <Link
          to={config.rotaOposta}
          className="mt-8 flex min-h-12 items-center justify-center rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {config.labelOposta}
        </Link>
      )}
      {/* Acesso administrativo não faz parte do app da profissional. */}
      {papel === "cliente" && (
        <Link
          to="/admin/login"
          className="mt-2 flex min-h-12 items-center justify-center text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          Acesso administrativo
        </Link>
      )}
    </main>
  );
}
