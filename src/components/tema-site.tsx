import { useQuery } from "@tanstack/react-query";

import { siteConfigQuery } from "@/lib/site-config";

/**
 * Aplica as cores definidas em Admin → Configurações do sistema
 * sobrescrevendo os tokens do design system em tempo de execução.
 */
export function TemaSite() {
  const { data } = useQuery(siteConfigQuery);
  if (!data) return null;
  const { primary, accent, background } = data.cores;
  const css = `:root{--primary:${primary};--primary-hover:${primary};--accent:${accent};--ring:${accent};--background:${background};}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
