import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Dispara as mensagens pendentes da fila pela Z-API. */
export const dispararFilaWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { drenarFila } = await import("./notificacoes.server");
    return drenarFila(20);
  });

/** Reenvio manual de uma mensagem da fila (admin). */
export const reenviarNotificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas o administrador pode reenviar mensagens.");
    const { reenviarItem } = await import("./notificacoes.server");
    return reenviarItem(data.id);
  });

/** Envio de teste para um número qualquer (admin). */
export const enviarTesteWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ telefone: z.string().min(8).max(20), mensagem: z.string().min(1).max(1000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas o administrador pode enviar testes.");
    const { enviarTeste } = await import("./notificacoes.server");
    return enviarTeste(data.telefone, data.mensagem);
  });

/** Estado da instância Z-API (admin). */
export const statusWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Apenas o administrador pode consultar a instância.");
    const { statusInstancia } = await import("./notificacoes.server");
    return statusInstancia();
  });
