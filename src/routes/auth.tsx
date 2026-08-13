import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Busca = { next?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (busca: Record<string, unknown>): Busca => ({
    next: typeof busca.next === "string" ? busca.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — LAR10" },
      {
        name: "description",
        content:
          "Acesse sua conta LAR10 para acompanhar suas contratações de limpeza em Santa Catarina.",
      },
      { property: "og:title", content: "Entrar ou criar conta — LAR10" },
      {
        property: "og:description",
        content: "Acesse sua conta LAR10 e acompanhe suas contratações de limpeza.",
      },
    ],
  }),
  component: AuthPage,
});

function destinoSeguro(next: string | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/minha-conta";
  return next;
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const destino = destinoSeguro(next);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
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
    setEnviando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, telefone },
        emailRedirectTo: `${window.location.origin}${destino}`,
      },
    });
    setEnviando(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada!", { description: "Bem-vinda ao LAR10." });
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="text-center text-3xl font-semibold tracking-tight">Acesse o LAR10</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Entre para acompanhar suas contratações e avaliar profissionais.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-8 w-full"
          onClick={entrarComGoogle}
        >
          Continuar com Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou use seu e-mail
          <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="entrar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="criar">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="entrar">
            <form className="space-y-4 pt-4" onSubmit={entrar}>
              <div className="space-y-2">
                <Label htmlFor="email-login">E-mail</Label>
                <Input
                  id="email-login"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-login">Senha</Label>
                <Input
                  id="senha-login"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="criar">
            <form className="space-y-4 pt-4" onSubmit={cadastrar}>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(48) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-novo">E-mail</Label>
                <Input
                  id="email-novo"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-nova">Senha</Label>
                <Input
                  id="senha-nova"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={enviando}>
                {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
                Criar conta
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
