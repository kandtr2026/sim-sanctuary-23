"use client";

import { Suspense, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePageVisitTracker } from "@/hooks/usePageVisitTracker";

/**
 * Client-side providers, replacing the old `src/main.tsx` wrapper tree
 * (HelmetProvider is gone — Next.js has its own Metadata API).
 *
 * QueryClient is created per-instance with `useState` so a fresh client is used
 * on the browser and never shared across server renders.
 */
function PageVisitTracker() {
  usePageVisitTracker();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* useSearchParams() inside the tracker requires a Suspense boundary,
            otherwise prerendering any page (incl. /_not-found) throws. */}
        <Suspense fallback={null}>
          <PageVisitTracker />
        </Suspense>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
