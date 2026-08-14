export const WHATSAPP_SUPORTE = "5548999999999";

export function apenasDigitos(telefone: string | null | undefined) {
  return (telefone ?? "").replace(/\D/g, "");
}

/** Monta o número no formato internacional aceito pelo wa.me (Brasil por padrão). */
export function numeroInternacional(telefone: string | null | undefined) {
  const d = apenasDigitos(telefone);
  if (!d) return null;
  if (d.startsWith("55")) return d;
  if (d.length >= 10 && d.length <= 11) return `55${d}`;
  return d;
}

export function linkWhatsApp(telefone: string | null | undefined, mensagem: string) {
  const numero = numeroInternacional(telefone);
  const texto = encodeURIComponent(mensagem);
  if (!numero) return `https://wa.me/?text=${texto}`;
  return `https://wa.me/${numero}?text=${texto}`;
}

export function linkSuporte(mensagem = "Olá! Preciso de ajuda com a LAR10.") {
  return linkWhatsApp(WHATSAPP_SUPORTE, mensagem);
}

export const MENSAGENS = {
  novoPedido: (codigo: string, data: string, hora: string) =>
    `Olá! Você recebeu um novo pedido de faxina na LAR10 (${codigo}) para ${data} às ${hora}. Entre no app para aceitar.`,
  aceito: (nome: string, data: string, hora: string) =>
    `Olá! Sou ${nome}, sua profissional LAR10. Confirmei sua faxina para ${data} às ${hora}. Qualquer dúvida me chame por aqui.`,
  finalizada: (codigo: string) =>
    `Olá! A faxina ${codigo} foi finalizada. Confirme a conclusão no app da LAR10 para liberar o pagamento. Obrigada!`,
  clienteParaProfissional: (codigo: string) =>
    `Olá! Sou o cliente da faxina ${codigo} da LAR10. Podemos combinar os detalhes?`,
};
