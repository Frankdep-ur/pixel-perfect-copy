import { createFileRoute } from "@tanstack/react-router";

/**
 * Webhook "Ao receber mensagem" da Z-API: permite que a profissional aceite
 * (ou recuse) a oportunidade respondendo direto na conversa do WhatsApp.
 * Protegido por segredo na querystring (?token=ZAPI_WEBHOOK_TOKEN).
 */

type Intencao = "aceitar" | "indisponivel" | "desconhecida";

function textoDaMensagem(payload: Record<string, unknown>): string {
  const texto = payload["text"] as { message?: string } | undefined;
  if (texto?.message) return texto.message;
  const botao = payload["buttonsResponseMessage"] as { message?: string } | undefined;
  if (botao?.message) return botao.message;
  const lista = payload["listResponseMessage"] as { title?: string } | undefined;
  if (lista?.title) return lista.title;
  if (typeof payload["message"] === "string") return payload["message"] as string;
  return "";
}

function interpretar(bruto: string): Intencao {
  const t = bruto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[.!,]/g, "");
  if (["1", "sim", "s", "aceito", "aceitar", "aceite", "quero", "confirmo"].includes(t)) {
    return "aceitar";
  }
  if (["2", "nao", "n", "indisponivel", "recuso", "recusar", "nao posso"].includes(t)) {
    return "indisponivel";
  }
  return "desconhecida";
}

const RESPOSTAS: Record<string, string> = {
  aceito:
    "✅ Recebemos seu aceite! Agora aguarde a escolha do cliente — avisamos aqui assim que a faxina for confirmada.",
  indisponivel: "Ok, avisamos que você não está disponível para esta faxina. Até a próxima!",
  expirado:
    "⏰ O prazo desta oportunidade já encerrou. Abra o Lar77 para ver as próximas faxinas da sua região.",
  sem_convite:
    "Não encontramos nenhuma oportunidade aberta no seu número agora. Abra o Lar77 para acompanhar as próximas.",
  duvida: "Não entendi 🙂 Responda *1* para ACEITAR ou *2* se estiver INDISPONÍVEL.",
};

export const Route = createFileRoute("/api/public/zapi-receber")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const esperado = process.env["ZAPI_WEBHOOK_TOKEN"];
        const enviado = new URL(request.url).searchParams.get("token");
        if (!esperado || !enviado || enviado !== esperado) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = (await request.json()) as Record<string, unknown>;
        } catch {
          return new Response("Payload inválido", { status: 400 });
        }

        // Ignora o que não é mensagem recebida de pessoa física.
        if (payload["fromMe"] === true || payload["isGroup"] === true) {
          return Response.json({ ignorado: true });
        }

        const telefone = String(payload["phone"] ?? payload["participantPhone"] ?? "");
        const intencao = interpretar(textoDaMensagem(payload));
        if (!telefone) return Response.json({ ignorado: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let resposta = RESPOSTAS["duvida"]!;
        let status = "duvida";

        if (intencao !== "desconhecida") {
          const { data, error } = await supabaseAdmin.rpc("responder_convite_whatsapp", {
            _telefone: telefone,
            _aceitar: intencao === "aceitar",
          });
          if (error) {
            console.error("[zapi-receber] rpc", error);
            return new Response("Erro ao registrar resposta", { status: 500 });
          }
          status = String(data ?? "sem_convite");
          resposta = RESPOSTAS[status] ?? RESPOSTAS["sem_convite"]!;
        }

        const { error: erroFila } = await supabaseAdmin.from("notificacoes_whatsapp").insert({
          telefone,
          tipo: "resposta_convite",
          mensagem: resposta,
          status: "pendente",
        });
        if (erroFila) console.error("[zapi-receber] fila", erroFila);

        try {
          const { drenarFila } = await import("@/lib/notificacoes.server");
          await drenarFila(5);
        } catch (e) {
          console.warn("[zapi-receber] drenar", e);
        }

        return Response.json({ status });
      },
    },
  },
});
