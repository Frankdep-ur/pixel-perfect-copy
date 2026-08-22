import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaginaTexto, type Bloco } from "@/components/pagina-texto";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — Lar77" },
      {
        name: "description",
        content: "Como a Lar77 coleta, usa e protege os dados de clientes e profissionais.",
      },
      { property: "og:title", content: "Política de privacidade — Lar77" },
      {
        property: "og:description",
        content: "Quais dados a Lar77 usa, por quê e como você pode pedir a exclusão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacidade,
});

const BLOCOS: Bloco[] = [
  {
    titulo: "1. Dados que coletamos",
    itens: [
      "Cadastro: nome, CPF, e-mail e telefone.",
      "Serviço: endereços do imóvel, datas, horários, observações e valores.",
      "Profissionais: documentos de identificação, endereço de atuação e dados de recebimento (PIX).",
    ],
  },
  {
    titulo: "2. Para que usamos",
    itens: [
      "Encontrar a profissional disponível mais próxima do seu imóvel.",
      "Processar pagamentos e repasses.",
      "Enviar avisos sobre a sua faxina por WhatsApp e pelo aplicativo.",
      "Prevenir fraudes e garantir a segurança de clientes e profissionais.",
    ],
  },
  {
    titulo: "3. Com quem compartilhamos",
    itens: [
      "Com a profissional escolhida: apenas o necessário para realizar o serviço (endereço, data, horário e observações).",
      "Com prestadores de pagamento e de mensagens, somente para executar o serviço contratado.",
      "Nunca vendemos seus dados.",
    ],
  },
  {
    titulo: "4. Contato entre cliente e profissional",
    itens: [
      "A conversa acontece pelo chat interno do aplicativo. Não expomos telefone nem documentos da profissional ao cliente.",
    ],
  },
  {
    titulo: "5. Seus direitos",
    itens: [
      "Você pode acessar e corrigir seus dados em Conta → Meu perfil.",
      "Pode pedir a exclusão da conta pelo suporte; dados fiscais e de serviços concluídos podem ser mantidos pelo prazo exigido por lei.",
    ],
  },
  {
    titulo: "6. Segurança",
    itens: [
      "Os dados ficam armazenados com controle de acesso por usuário e conexão criptografada.",
      "Documentos enviados por profissionais são visíveis apenas para a equipe de análise da Lar77.",
    ],
  },
];

function Privacidade() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <PaginaTexto
          titulo="Política de privacidade"
          resumo="Explicamos de forma direta quais dados usamos e por quê."
          blocos={BLOCOS}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
