import { useEffect, useState } from "react";

import { segundosRestantes } from "@/lib/orquestra";

/** Contagem regressiva em segundos até um instante ISO, atualizada a cada segundo. */
export function useContagem(ateISO: string | null | undefined) {
  const [restante, setRestante] = useState(() => segundosRestantes(ateISO));

  useEffect(() => {
    setRestante(segundosRestantes(ateISO));
    if (!ateISO) return;
    const id = window.setInterval(() => {
      setRestante(segundosRestantes(ateISO));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ateISO]);

  return restante;
}
