import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import heroProfissional from "@/assets/hero-profissional.jpg.asset.json";
import heroSala from "@/assets/hero-sala.jpg";

export type Slide = {
  id: string;
  imagem_url: string;
  titulo: string | null;
  legenda: string | null;
  ordem: number;
  ativo: boolean;
};

/** Máximo de imagens do carrossel da home. */
export const MAX_SLIDES = 3;

export const SLIDES_PADRAO: Slide[] = [
  {
    id: "padrao-1",
    imagem_url: heroProfissional.url,
    titulo: "Profissionais verificadas",
    legenda: "Uniformizadas, avaliadas e prontas para cuidar da sua casa.",
    ordem: 1,
    ativo: true,
  },
  {
    id: "padrao-2",
    imagem_url: heroSala,
    titulo: "Sua casa impecável",
    legenda: "Você escolhe o serviço, a data e acompanha tudo pelo app.",
    ordem: 2,
    ativo: true,
  },
];

export const slidesQuery = queryOptions({
  queryKey: ["home_slides"],
  queryFn: async (): Promise<Slide[]> => {
    const { data, error } = await supabase
      .from("home_slides")
      .select("id, imagem_url, titulo, legenda, ordem, ativo")
      .eq("ativo", true)
      .order("ordem", { ascending: true })
      .limit(MAX_SLIDES);
    if (error) throw error;
    return data as Slide[];
  },
});

export const slidesAdminQuery = queryOptions({
  queryKey: ["admin", "home_slides"],
  queryFn: async (): Promise<Slide[]> => {
    const { data, error } = await supabase
      .from("home_slides")
      .select("id, imagem_url, titulo, legenda, ordem, ativo")
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data as Slide[];
  },
});
