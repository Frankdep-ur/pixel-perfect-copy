import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TabBarMobile } from "./tab-bar-mobile";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        is: vi.fn().mockReturnValue({
          neq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      }),
    }),
  },
}));

const rootRoute = createRootRoute({ component: TabBarMobile });
const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

describe("TabBarMobile", () => {
  it("exporta o componente nomeado corretamente", () => {
    expect(TabBarMobile).toBeDefined();
    expect(typeof TabBarMobile).toBe("function");
  });

  it("renderiza sem erro quando deslogado", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
    // Sem usuário autenticado a barra retorna null; o teste só precisa não quebrar.
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
