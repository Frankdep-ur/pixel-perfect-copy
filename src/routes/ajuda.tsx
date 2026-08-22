import { createFileRoute } from "@tanstack/react-router";
import { Headset } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaginaTexto, type Bloco } from "@/components/pagina-texto";
import { linkSuporte } from "@/lib/whatsapp";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda e suporte — Lar77" },
      {
        name: "description",
        content: "Dúvidas sobre contratação, pagamento, cancelamento e suporte da Lar77.",
      },
      { property: "og:title", content: "Ajuda e suporte — Lar77" },
      {
        property: "og:description",
        content: "Respostas rápidas sobre agendamento, pagamento e cancelamento na Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ajuda,
});

const BLOCOS: Bloco[] = [
  {
    titulo: "Como agendar",
    itens: [
      "Escolha o imóvel cadastrado, a duração e a data. O preço aparece na hora.",
      "Agendamentos precisam de 24 horas de antecedência e não atendemos domingos.",
    ],
  },
  {
    titulo: "Como escolhemos a profissional",
    itens: [
      "Avisamos as profissionais verificadas mais próximas do seu endereço.",
      "Avisamos as profissionais verificadas no raio de 15 km. Quem tiver interesse em 5 minutos entra na lista para você escolher. O pagamento confirma a contratação.",
    ],
  },
  {
    titulo: "Pagamento",
    itens: [
      "O pagamento é feito pela plataforma e fica retido até a conclusão do serviço.",
      "O valor mostrado inclui o serviço, a taxa administrativa e a proteção Lar77.",
    ],
  },
  {
    titulo: "Cancelamento",
    itens: [
      "Cancele em Minhas reservas, antes do início do serviço.",
      "Cancelamentos de última hora podem gerar cobrança parcial.",
    ],
  },
  {
    titulo: "Proteção e verificação",
    itens: [
      "Toda profissional passa por cadastro, documentos e análise da Lar77 antes de atender.",
      "O pagamento fica na plataforma até a conclusão do serviço.",
      "A taxa administrativa (17%) cobre operação, suporte e a proteção da contratação. Não é um seguro à parte na hora de pagar.",
      "Em caso de problema, fale pelo Ajuda / Suporte da reserva ou pelo WhatsApp da central.",
    ],
  },
  {
    titulo: "Falar com a profissional",
    itens: [
      "Use o chat interno na tela da sua reserva. Não divulgamos telefones para preservar a segurança de todos.",
    ],
  },
];

function Ajuda() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <PaginaTexto
          titulo="Ajuda e suporte"
          resumo="As dúvidas mais comuns e o caminho direto para falar com a nossa equipe."
          blocos={BLOCOS}
        />
        <div className="mx-auto w-full max-w-md px-4 pb-8 md:max-w-2xl">
          <a
            href={linkSuporte()}
            target="_blank"
            rel="noreferrer"
            className="flex h-14 items-center justify-center gap-2 rounded-[18px] bg-accent text-[15px] font-bold"
            style={{ color: "#04162F" }}
          >
            <Headset size={20} strokeWidth={1.7} aria-hidden />
            Falar com o suporte
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
