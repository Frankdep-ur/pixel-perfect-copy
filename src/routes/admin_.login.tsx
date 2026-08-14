import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Login administrativo — LAR10" },
      {
        name: "description",
        content: "Área restrita: acesso ao painel administrativo da LAR10.",
      },
      { property: "og:title", content: "Login administrativo — LAR10" },
      { property: "og:description", content: "Acesso restrito ao painel interno da LAR10." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLoginPage,
});

async function ehAdmin(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!ativo) return;
      if (data.user && (await ehAdmin(data.user.id))) {
        navigate({ to: "/admin", replace: true });
        return;
      }
      if (ativo) setVerificando(false);
    });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data.user) {
      setEnviando(false);
      toast.error("Não foi possível entrar", {
        description: error?.message ?? "Verifique e-mail e senha.",
      });
      return;
    }

    const admin = await ehAdmin(data.user.id);
    setEnviando(false);
    if (!admin) {
      await supabase.auth.signOut();
      toast.error("Acesso restrito", {
        description: "Esta conta não tem permissão de administrador.",
      });
      return;
    }

    router.invalidate();
    navigate({ to: "/admin", replace: true });
  }

  if (verificando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="size-5" strokeWidth={1.5} aria-hidden />
          <span className="font-display text-lg font-bold">LAR10 Admin</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Acesso administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Área restrita à equipe LAR10. Entre com suas credenciais de administrador.
        </p>

        <form className="mt-6 space-y-4" onSubmit={entrar}>
          <div className="space-y-2">
            <Label htmlFor="email-admin">E-mail</Label>
            <Input
              id="email-admin"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha-admin">Senha</Label>
            <Input
              id="senha-admin"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entrar no painel
          </Button>
        </form>
      </div>
    </main>
  );
}
