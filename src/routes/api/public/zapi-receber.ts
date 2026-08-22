import { createFileRoute } from "@tanstack/react-router";

import { numeroInternacional } from "@/lib/whatsapp";

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
    "✅ DISPONIBILIDADE REGISTRADA!\n\nRecebemos sua resposta e você foi incluída na lista de profissionais disponíveis. Isso ainda não confirma o serviço — o cliente escolhe e o pagamento confirma. Se for selecionada, avisamos aqui.\n\nLAR77 — Diaristas de Confiança",
  indisponivel:
    "Ok, registramos que você não tem interesse nesta oportunidade. Até a próxima!\n\nLAR77 — Diaristas de Confiança",
  expirado:
    "⏰ O prazo desta oportunidade já encerrou. Fique de olho nas próximas faxinas da sua região.",
  sem_convite:
    "Não encontramos nenhuma oportunidade aberta no seu número agora. Abra o Lar77 para acompanhar as próximas.",
  ambiguo:
    "Este número está cadastrado em mais de um perfil, então não conseguimos confirmar por aqui. Abra o Lar77 para responder.",
  duvida:
    "Não entendi 🙂 Responda *1* se TEM INTERESSE E ESTÁ DISPONÍVEL ou *2* se NÃO TEM INTERESSE.",
};

export const Route = createFileRoute("/api/public/zapi-receber")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Aceita o segredo interno (ZAPI_WEBHOOK_TOKEN) ou a chave publicável
        // do projeto — o painel da Z-API só permite colar a URL, sem headers.
        const enviado = new URL(request.url).searchParams.get("token");
        const validos = [
          process.env["ZAPI_WEBHOOK_TOKEN"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
          process.env["SUPABASE_ANON_KEY"],
        ].filter((v): v is string => Boolean(v));
        if (!enviado || !validos.includes(enviado)) {
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

        // Só conversamos com números de profissionais cadastradas: qualquer
        // outra pessoa que escreva para a instância é ignorada em silêncio.
        const numero = numeroInternacional(telefone);
        const { data: cadastradas, error: erroCadastro } = await supabaseAdmin
          .from("profissionais")
          .select("id, profiles!inner(telefone)");
        if (erroCadastro) {
          console.error("[zapi-receber] cadastro", erroCadastro);
          return new Response("Erro ao identificar o número", { status: 500 });
        }
        const conhecida = (cadastradas ?? []).some((p) => {
          const tel = (p as { profiles?: { telefone: string | null } | null }).profiles?.telefone;
          return numero !== null && numeroInternacional(tel) === numero;
        });
        if (!conhecida) return Response.json({ ignorado: true });

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
