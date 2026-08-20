export const WHATSAPP_SUPORTE = "5548999999999";

export function apenasDigitos(telefone: string | null | undefined) {
  return (telefone ?? "").replace(/\D/g, "");
}

/**
 * Formatação leve durante a digitação. Números com +DDI ficam livres (só limpa
 * caracteres inválidos); números brasileiros de 10/11 dígitos ganham máscara.
 */
export function formatarTelefone(entrada: string) {
  const bruto = (entrada ?? "").replace(/[^\d+\s()-]/g, "");
  if (bruto.trim().startsWith("+")) {
    return "+" + bruto.replace(/\+/g, "").replace(/[^\d\s]/g, " ").replace(/\s{2,}/g, " ").trimStart();
  }
  const digitos = bruto.replace(/\D/g, "");
  // Mais de 11 dígitos: já é um número com DDI (ex.: 5548..., 351...) — não mascara.
  if (digitos.length > 11) return `+${digitos}`;
  const d = digitos;
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aceita qualquer DDD/DDI — só exige um mínimo de dígitos. */
export function telefoneValido(telefone: string | null | undefined) {
  return apenasDigitos(telefone).length >= 8;
}

/**
 * Normaliza para o formato internacional (só dígitos, com código do país).
 * Se o usuário digitou +DDI, o DDI informado é preservado; números de 10/11
 * dígitos sem DDI assumem Brasil (55). Qualquer outro caso é mantido.
 */
export function numeroInternacional(telefone: string | null | undefined) {
  const bruto = (telefone ?? "").trim();
  const d = apenasDigitos(bruto);
  if (!d) return null;
  if (bruto.startsWith("+")) return d;
  if (d.startsWith("55") && d.length >= 12) return d;
  if (d.length >= 10 && d.length <= 11) return `55${d}`;
  return d;
}

export function linkWhatsApp(telefone: string | null | undefined, mensagem: string) {
  const numero = numeroInternacional(telefone);
  const texto = encodeURIComponent(mensagem);
  if (!numero) return `https://wa.me/?text=${texto}`;
  return `https://wa.me/${numero}?text=${texto}`;
}

export function linkSuporte(mensagem = "Olá! Preciso de ajuda com a Lar77.") {
  return linkWhatsApp(WHATSAPP_SUPORTE, mensagem);
}

export const MENSAGENS = {
  novoPedido: (codigo: string, data: string, hora: string) =>
    `Olá! Você recebeu um novo pedido de faxina na Lar77 (${codigo}) para ${data} às ${hora}. Entre no app para aceitar.`,
  aceito: (nome: string, data: string, hora: string) =>
    `Olá! Sou ${nome}, sua profissional Lar77. Confirmei sua faxina para ${data} às ${hora}. Qualquer dúvida me chame por aqui.`,
  finalizada: (codigo: string) =>
    `Olá! A faxina ${codigo} foi finalizada. Confirme a conclusão no app da Lar77 para liberar o pagamento. Obrigada!`,
  clienteParaProfissional: (codigo: string) =>
    `Olá! Sou o cliente da faxina ${codigo} da Lar77. Podemos combinar os detalhes?`,
};
