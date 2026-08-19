import { createFileRoute } from "@tanstack/react-router";

/**
 * Rede de segurança: reprocessa a fila de WhatsApp caso o disparo imediato
 * não tenha acontecido (aba fechada, falha de rede). Chamado por pg_cron com
 * o header `apikey` do projeto.
 */
export const Route = createFileRoute("/api/public/zapi-drenar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const chave = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
        const enviada = request.headers.get("apikey");
        if (!chave || !enviada || enviada !== chave) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { drenarFila } = await import("@/lib/notificacoes.server");
        try {
          const resumo = await drenarFila(30);
          return Response.json(resumo);
        } catch (e) {
          console.error("[zapi-drenar]", e);
          return new Response("Erro ao drenar fila", { status: 500 });
        }
      },
    },
  },
});
