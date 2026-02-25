import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import DinhGiaSim from "./pages/DinhGiaSim";
import SimPhongThuy from "./pages/SimPhongThuy";
import SimTraGop from "./pages/SimTraGop";
import ThanhToan from "./pages/thanh-toan";
import TinTuc from "./pages/TinTuc";
import TinTucBai1 from "./pages/TinTucBai1";
import TinTucBai2 from "./pages/TinTucBai2";
import TinTucBai3 from "./pages/TinTucBai3";
import TinTucBai4 from "./pages/TinTucBai4";
import TinTucBai5 from "./pages/TinTucBai5";
import NotFound from "./pages/NotFound";
import SimNamSinh from "./pages/SimNamSinh";
import SimDuoi1Trieu from "./pages/SimDuoi1Trieu";
import SimTamHoaGiaRe from "./pages/SimTamHoaGiaRe";
import SimMobifoneGiaRe from "./pages/SimMobifoneGiaRe";
import FloatingContactButtons from "./components/FloatingContactButtons";
import MessengerChatPlugin from "./components/MessengerChatPlugin";
import MessengerQuickTemplates from "./components/MessengerQuickTemplates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/sim-duoi-1-trieu" element={<SimDuoi1Trieu />} />
          <Route path="/sim-tam-hoa-gia-re" element={<SimTamHoaGiaRe />} />
          <Route path="/sim-mobifone-gia-re" element={<SimMobifoneGiaRe />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/:slug" element={<SimNamSinh />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingContactButtons />
        <MessengerChatPlugin />
        <MessengerQuickTemplates />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
