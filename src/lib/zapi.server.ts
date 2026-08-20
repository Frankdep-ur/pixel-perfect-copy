/**
 * Integração com a Z-API (WhatsApp). Só roda no servidor: as credenciais são
 * lidas de process.env dentro das funções, nunca no escopo do módulo.
 */

import { numeroInternacional } from "@/lib/whatsapp";


type Credenciais = {
  instancia: string;
  token: string;
  clientToken: string;
};

function credenciais(): Credenciais {
  const instancia = process.env["ZAPI_INSTANCE_ID"];
  const token = process.env["ZAPI_INSTANCE_TOKEN"];
  const clientToken = process.env["ZAPI_CLIENT_TOKEN"];
  if (!instancia || !token || !clientToken) {
    throw new Error(
      "Credenciais da Z-API ausentes (ZAPI_INSTANCE_ID, ZAPI_INSTANCE_TOKEN, ZAPI_CLIENT_TOKEN).",
    );
  }
  return { instancia, token, clientToken };
}

function baseUrl(c: Credenciais) {
  return `https://api.z-api.io/instances/${c.instancia}/token/${c.token}`;
}

/** Normaliza para o formato aceito pela Z-API: só dígitos, com código do país. */
export function numeroZapi(telefone: string | null | undefined) {
  return numeroInternacional(telefone);
}

export type ResultadoEnvio =
  | { ok: true; messageId: string | null }
  | { ok: false; erro: string };

export async function enviarTextoZapi(
  telefone: string | null | undefined,
  mensagem: string,
): Promise<ResultadoEnvio> {
  const numero = numeroZapi(telefone);
  if (!numero) return { ok: false, erro: "Telefone ausente ou inválido." };

  let c: Credenciais;
  try {
    c = credenciais();
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Credenciais inválidas." };
  }

  try {
    const resp = await fetch(`${baseUrl(c)}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": c.clientToken,
      },
      body: JSON.stringify({ phone: numero, message: mensagem }),
    });

    const texto = await resp.text();
    let corpo: Record<string, unknown> = {};
    try {
      corpo = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
    } catch {
      corpo = {};
    }

    if (!resp.ok) {
      const detalhe =
        (corpo["error"] as string) ||
        (corpo["message"] as string) ||
        texto.slice(0, 300) ||
        `HTTP ${resp.status}`;
      return { ok: false, erro: `Z-API ${resp.status}: ${detalhe}` };
    }

    const messageId =
      (corpo["messageId"] as string) ?? (corpo["id"] as string) ?? (corpo["zaapId"] as string) ?? null;
    return { ok: true, messageId };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Falha de rede ao chamar a Z-API." };
  }
}

export type StatusInstancia = {
  conectada: boolean;
  detalhe: string;
};

export async function statusInstanciaZapi(): Promise<StatusInstancia> {
  let c: Credenciais;
  try {
    c = credenciais();
  } catch (e) {
    return { conectada: false, detalhe: e instanceof Error ? e.message : "Credenciais inválidas." };
  }

  try {
    const resp = await fetch(`${baseUrl(c)}/status`, {
      headers: { "Client-Token": c.clientToken },
    });
    const texto = await resp.text();
    let corpo: Record<string, unknown> = {};
    try {
      corpo = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
    } catch {
      corpo = {};
    }
    if (!resp.ok) {
      return { conectada: false, detalhe: `Z-API ${resp.status}: ${texto.slice(0, 200)}` };
    }
    const conectada = corpo["connected"] === true;
    const detalhe = conectada
      ? "Instância conectada ao WhatsApp."
      : ((corpo["error"] as string) ??
        (corpo["smartphoneConnected"] === false
          ? "Celular desconectado da instância."
          : "Instância não conectada."));
    return { conectada, detalhe };
  } catch (e) {
    return { conectada: false, detalhe: e instanceof Error ? e.message : "Falha ao consultar status." };
  }
}
