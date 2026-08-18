import { useQuery } from "@tanstack/react-query";

import { SLIDES_PADRAO, slidesQuery } from "@/lib/home-slides";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function HeroCarrossel() {
  const { data } = useQuery(slidesQuery);
  const slides = data && data.length > 0 ? data : SLIDES_PADRAO;

  if (slides.length === 1) {
    const slide = slides[0]!;
    return (
      <figure className="h-full w-full overflow-hidden">
        <img
          src={slide.imagem_url}
          alt={slide.titulo ?? "Profissional de limpeza Lar77"}
          className="h-full w-full object-cover"
        />
      </figure>
    );
  }

  return (
    <Carousel opts={{ loop: true }} className="h-full w-full">
      <CarouselContent className="ml-0 h-full">
        {slides.map((slide) => (
          <CarouselItem key={slide.id} className="relative h-full pl-0">
            <img
              src={slide.imagem_url}
              alt={slide.titulo ?? "Profissional de limpeza Lar77"}
              className="h-[52vh] w-full object-cover md:h-[520px]"
            />
          </CarouselItem>

        ))}
      </CarouselContent>
      <CarouselPrevious className="left-3 hidden md:flex" />
      <CarouselNext className="right-3 hidden md:flex" />
    </Carousel>
  );
}
