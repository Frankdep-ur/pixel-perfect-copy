import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { SLIDES_PADRAO, slidesQuery } from "@/lib/home-slides";

type Props = {
  /** Título usado quando o slide não tem título próprio. */
  tituloPadrao: string;
  /** Subtítulo usado quando o slide não tem legenda própria. */
  subtituloPadrao: string;
};

/**
 * Hero da home: card de 210px com imagem, gradiente claro à esquerda,
 * texto sobre a área clara e indicadores abaixo.
 */
export function HeroCarrossel({ tituloPadrao, subtituloPadrao }: Props) {
  const { data } = useQuery(slidesQuery);
  const slides = data && data.length > 0 ? data : SLIDES_PADRAO;
  const trilha = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);

  function aoRolar() {
    const el = trilha.current;
    if (!el) return;
    const indice = Math.round(el.scrollLeft / el.clientWidth);
    setAtivo(Math.max(0, Math.min(slides.length - 1, indice)));
  }

  return (
    <div>
      <div
        ref={trilha}
        onScroll={aoRolar}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full shrink-0 snap-start px-4">
            <article className="relative h-[210px] overflow-hidden rounded-2xl">
              <img
                src={slide.imagem_url}
                alt={slide.titulo ?? "Profissional de limpeza Lar77"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(245,247,250,0.97) 0%, rgba(245,247,250,0.9) 46%, rgba(245,247,250,0.35) 74%, rgba(245,247,250,0) 100%)",
                }}
              />
              <div className="relative flex h-full max-w-[60%] flex-col items-start justify-center p-5 text-left">
                <h1
                  className="font-display font-bold leading-[1.15] line-clamp-2"
                  style={{ fontSize: "26px", color: "#04162F" }}
                >
                  {slide.titulo ?? tituloPadrao}
                </h1>
                <p
                  className="mt-1.5 text-[14px] leading-snug line-clamp-3"
                  style={{ color: "#1B3050" }}
                >
                  {slide.legenda ?? subtituloPadrao}
                </p>
                <a
                  href="#como-funciona"
                  className="mt-3 inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-accent transition-transform duration-200 ease-out active:scale-[0.97]"
                  style={{ backgroundColor: "#04162F" }}
                >
                  Saiba mais
                </a>
              </div>
            </article>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <span
              key={slide.id}
              aria-hidden
              className={
                i === ativo
                  ? "h-1.5 w-5 rounded-full bg-accent"
                  : "size-1.5 rounded-full bg-border"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
