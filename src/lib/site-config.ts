import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import logoLar77 from "@/assets/logo-lar77.png.asset.json";

/** Textos editáveis da home (Admin → Configurações do sistema). */
export type TextosSite = {
  slogan: string;
  hero_botao_cliente: string;
  hero_botao_profissional: string;
  como_titulo: string;
  como_subtitulo: string;
  garantia_titulo: string;
  garantia_texto: string;
  garantia_fechamento: string;
  prof_titulo: string;
  prof_chamada: string;
  prof_texto: string;
  prof_fechamento_1: string;
  prof_fechamento_2: string;
  prof_fechamento_3: string;
  rodape: string;
};

export type CoresSite = {
  primary: string;
  accent: string;
  background: string;
};

export const TEXTOS_PADRAO: TextosSite = {
  slogan: "Lar77 — O jeito inteligente de cuidar do seu espaço.",
  hero_botao_cliente: "AGENDAR MINHA FAXINA",
  hero_botao_profissional: "TRABALHE CONOSCO",
  como_titulo: "Como funciona a Lar77?",
  como_subtitulo: "Contrate uma profissional de confiança de forma simples, rápida e segura.",
  garantia_titulo: "Garantia Lar77",
  garantia_texto:
    "Na Lar77, segurança também faz parte do serviço. Nossas profissionais cadastradas contam com a proteção oferecida pela empresa durante a realização do serviço, conforme as condições da contratação.",
  garantia_fechamento: "Você escolhe. A Lar77 cuida do resto.",
  prof_titulo: "Trabalhe com a Lar77",
  prof_chamada: "Você trabalha. A Lar77 garante.",
  prof_texto:
    "Na Lar77, você encontra oportunidades de trabalho com valores definidos, pagamento garantido e segurança durante a realização do serviço.",
  prof_fechamento_1: "Você trabalha com tranquilidade.",
  prof_fechamento_2: "Você recebe pelo seu trabalho.",
  prof_fechamento_3: "Você conta com a Lar77.",
  rodape: "Seu trabalho valorizado. Seu pagamento garantido. Sua segurança em primeiro lugar.",
};

/** Valores em oklch — iguais aos tokens de src/styles.css. */
export const CORES_PADRAO: CoresSite = {
  primary: "oklch(0.7750 0.1250 86)",
  accent: "oklch(0.7750 0.1250 86)",
  background: "oklch(0.1900 0.0450 264)",
};


export const LOGO_PADRAO = logoLar77.url;

export type SiteConfig = {
  textos: TextosSite;
  cores: CoresSite;
  logo_url: string;
};

export const CONFIG_PADRAO: SiteConfig = {
  textos: TEXTOS_PADRAO,
  cores: CORES_PADRAO,
  logo_url: LOGO_PADRAO,
};

type Linha = { chave: string; valor: unknown };

export function montarConfig(linhas: Linha[] | null | undefined): SiteConfig {
  const mapa = new Map((linhas ?? []).map((l) => [l.chave, l.valor]));
  const textos = (mapa.get("textos") ?? {}) as Partial<TextosSite>;
  const cores = (mapa.get("cores") ?? {}) as Partial<CoresSite>;
  const logo = mapa.get("logo") as { url?: string } | undefined;
  return {
    textos: { ...TEXTOS_PADRAO, ...textos },
    cores: { ...CORES_PADRAO, ...cores },
    logo_url: logo?.url || LOGO_PADRAO,
  };
}

export const siteConfigQuery = queryOptions({
  queryKey: ["site_config"],
  queryFn: async (): Promise<SiteConfig> => {
    const { data, error } = await supabase.from("site_config").select("chave, valor");
    if (error) throw error;
    return montarConfig(data as Linha[]);
  },
  staleTime: 60_000,
});

export async function salvarConfig(chave: string, valor: unknown) {
  const { error } = await supabase
    .from("site_config")
    .upsert({ chave, valor: valor as never }, { onConflict: "chave" });
  if (error) throw error;
}
