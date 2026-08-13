import { BadgeCheck, Star } from "lucide-react";

const PROFISSIONAIS = [
  { nome: "Adriana", nota: 4.9, cidade: "Florianópolis", img: 5 },
  { nome: "Juliana", nota: 4.8, cidade: "São José", img: 44 },
  { nome: "Márcia", nota: 5.0, cidade: "Balneário Camboriú", img: 26 },
  { nome: "Simone", nota: 4.7, cidade: "Florianópolis", img: 47 },
  { nome: "Patrícia", nota: 4.9, cidade: "São José", img: 32 },
  { nome: "Rosana", nota: 4.8, cidade: "Balneário Camboriú", img: 20 },
] as const;

export function ProfissionaisRegiao() {
  return (
    <section id="profissionais-regiao" className="bg-background py-14 md:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="px-5">
          <h2 className="text-2xl text-foreground md:text-3xl">Profissionais da sua região</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Verificadas, avaliadas e prontas para atender.
          </p>
        </div>

        <div className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {PROFISSIONAIS.map((p) => (
            <article
              key={p.nome}
              className="lar-card flex w-[62vw] shrink-0 snap-start flex-col items-center p-5 text-center sm:w-[42vw] md:w-auto"
            >
              <img
                src={`https://i.pravatar.cc/150?img=${p.img}`}
                alt={`Foto de ${p.nome}, profissional de limpeza`}
                width={72}
                height={72}
                loading="lazy"
                className="h-[72px] w-[72px] rounded-full object-cover"
              />
              <p className="mt-3 text-base font-semibold text-foreground">{p.nome}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
                <Star strokeWidth={2} className="h-4 w-4 fill-accent text-accent" aria-hidden />
                {p.nota.toFixed(1)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{p.cidade}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent/12 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                <BadgeCheck strokeWidth={2} className="h-3.5 w-3.5 text-accent" aria-hidden />
                Verificada
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
