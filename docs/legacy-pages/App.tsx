import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// The homepage is the overwhelmingly common entry point — keep it in the main
// bundle. Everything else is code-split so a first visit doesn't download the
// whole site.
import Index from "./pages/Index";

const Checkout = lazy(() => import("./pages/Checkout"));
const DinhGiaSim = lazy(() => import("./pages/DinhGiaSim"));
const SimPhongThuy = lazy(() => import("./pages/SimPhongThuy"));
const SimTraGop = lazy(() => import("./pages/SimTraGop"));
const ThanhToan = lazy(() => import("./pages/thanh-toan"));
const TinTuc = lazy(() => import("./pages/TinTuc"));
const TinTucBai1 = lazy(() => import("./pages/TinTucBai1"));
const TinTucBai2 = lazy(() => import("./pages/TinTucBai2"));
const TinTucBai3 = lazy(() => import("./pages/TinTucBai3"));
const TinTucBai4 = lazy(() => import("./pages/TinTucBai4"));
const TinTucBai5 = lazy(() => import("./pages/TinTucBai5"));
const TinTucBai6 = lazy(() => import("./pages/TinTucBai6"));
const MuaSimTuQuy = lazy(() => import("./pages/MuaSimTuQuy"));
const MuaSimGiaRe = lazy(() => import("./pages/MuaSimGiaRe"));
const PolicyPage = lazy(() => import("./pages/PolicyPage"));
const SimNamSinh = lazy(() => import("./pages/SimNamSinh"));
const NotFound = lazy(() => import("./pages/NotFound"));

import FloatingContactButtons from "./components/FloatingContactButtons";
import MessengerChatPlugin from "./components/MessengerChatPlugin";
import MessengerQuickTemplates from "./components/MessengerQuickTemplates";
import StickyCtaBottomBar from "./components/StickyCtaBottomBar";
import BuildBadge from "./components/BuildBadge";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="sr-only">Đang tải…</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/*
        Opt into the v7 behaviours now so the eventual React Router 7 upgrade is a
        version bump rather than a behaviour change:
          - startTransition: route state updates are wrapped in React.startTransition,
            which lets the lazy-loaded routes above suspend without tearing.
          - relativeSplatPath: relative links inside the `*` route resolve the way v7
            does. Only NotFound renders under a splat here, so the blast radius is
            small — the right time to flip it.
      */}
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mua-ngay/:simId" element={<Checkout />} />
            <Route path="/dinh-gia-sim" element={<DinhGiaSim />} />
            <Route path="/sim-phong-thuy" element={<SimPhongThuy />} />
            <Route path="/sim-tra-gop" element={<SimTraGop />} />
            <Route path="/thanh-toan" element={<ThanhToan />} />
            <Route path="/tin-tuc" element={<TinTuc />} />
            <Route path="/tin-tuc/y-nghia-sim-so-dep" element={<TinTucBai1 />} />
            <Route path="/tin-tuc/so-tong-dai-cac-nha-mang" element={<TinTucBai2 />} />
            <Route path="/tin-tuc/y-nghia-cac-con-so-1-9" element={<TinTucBai3 />} />
            <Route path="/tin-tuc/cach-xem-sim-phong-thuy-hop-tuoi" element={<TinTucBai4 />} />
            <Route path="/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep" element={<TinTucBai5 />} />
            <Route path="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat" element={<TinTucBai6 />} />
            <Route path="/mua-sim-tu-quy" element={<MuaSimTuQuy />} />
            <Route path="/mua-sim-gia-re" element={<MuaSimGiaRe />} />

            {/* Policy pages — previously dead href="#" links in the footer */}
            <Route path="/chinh-sach-bao-mat" element={<PolicyPage />} />
            <Route path="/dieu-khoan-su-dung" element={<PolicyPage />} />
            <Route path="/chinh-sach-giao-hang" element={<PolicyPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* `/:slug` only resolves `/sim-nam-sinh-YYYY`; anything else 404s. */}
            <Route path="/:slug" element={<SimNamSinh />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <FloatingContactButtons />
        <MessengerChatPlugin />
        <MessengerQuickTemplates />
        <StickyCtaBottomBar />
        <BuildBadge />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
