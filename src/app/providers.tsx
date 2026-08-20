"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Client-side providers, replacing the old `src/main.tsx` wrapper tree
 * (HelmetProvider is gone — Next.js has its own Metadata API).
 *
 * QueryClient is created per-instance with `useState` so a fresh client is used
 * on the browser and never shared across server renders.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
