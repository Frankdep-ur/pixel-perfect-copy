import { createFileRoute, redirect } from "@tanstack/react-router";

/** Favoritos saiu do produto: o destino agora é "Minhas reservas". */
export const Route = createFileRoute("/favoritos")({
  beforeLoad: () => {
    throw redirect({ to: "/reservas", replace: true });
  },
});
