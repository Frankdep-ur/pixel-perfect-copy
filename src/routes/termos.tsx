import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaginaTexto, type Bloco } from "@/components/pagina-texto";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Lar77" },
      {
        name: "description",
        content: "Termos de uso da plataforma Lar77 para clientes e profissionais de limpeza.",
      },
      { property: "og:title", content: "Termos de uso — Lar77" },
      {
        property: "og:description",
        content: "Regras de contratação, pagamento, cancelamento e conduta na Lar77.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Termos,
});

const BLOCOS: Bloco[] = [
  {
    titulo: "1. O que é a Lar77",
    itens: [
      "A Lar77 é uma plataforma que conecta clientes que precisam de serviços de limpeza a profissionais autônomas cadastradas e verificadas.",
      "A Lar77 não é empregadora das profissionais. Cada profissional atua de forma autônoma, escolhendo os serviços que aceita.",
    ],
  },
  {
    titulo: "2. Contratação e valores",
    itens: [
      "O valor do serviço é calculado no momento da contratação, com base no tipo de imóvel, duração e itens adicionais escolhidos.",
      "Sobre o valor do serviço incide a taxa administrativa da Lar77, informada antes da confirmação do pagamento.",
      "O pagamento é feito pela plataforma e só é liberado à profissional após a conclusão do serviço.",
    ],
  },
  {
    titulo: "3. Agendamento",
    itens: [
      "Os agendamentos exigem no mínimo 24 horas de antecedência.",
      "Não realizamos serviços aos domingos.",
      "Após a solicitação, convidamos as profissionais disponíveis mais próximas. A reserva é confirmada quando uma profissional aceita e o pagamento é concluído.",
    ],
  },
  {
    titulo: "4. Cancelamentos",
    itens: [
      "O cliente pode cancelar pelo aplicativo antes do início do serviço.",
      "Cancelamentos de última hora podem gerar cobrança de parte do valor, para compensar a profissional que reservou a agenda.",
      "Se nenhuma profissional aceitar o serviço, a reserva é encerrada e nenhum valor é cobrado.",
    ],
  },
  {
    titulo: "5. Conduta e segurança",
    itens: [
      "Cliente e profissional se comprometem a manter comunicação respeitosa, exclusivamente pelo chat interno da plataforma.",
      "É proibido combinar serviços por fora da plataforma, o que retira a proteção oferecida pela Lar77.",
      "A Lar77 pode suspender contas que descumpram estas regras.",
    ],
  },
  {
    titulo: "6. Proteção durante o serviço",
    itens: [
      "As profissionais cadastradas contam com a proteção oferecida pela Lar77 durante a realização do serviço, conforme as condições da contratação.",
      "Ocorrências devem ser comunicadas pelo suporte no mesmo dia do serviço.",
    ],
  },
  {
    titulo: "7. Alterações destes termos",
    itens: [
      "Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas no aplicativo.",
      "O uso contínuo da plataforma após a atualização significa concordância com a nova versão.",
    ],
  },
];

function Termos() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <PaginaTexto
          titulo="Termos de uso"
          resumo="Estas regras valem para clientes e profissionais que usam a Lar77."
          blocos={BLOCOS}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
