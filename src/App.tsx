import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import DinhGiaSim from "./pages/DinhGiaSim";
import SimPhongThuy from "./pages/SimPhongThuy";
import ThanhToan from "./pages/ThanhToan";
import NotFound from "./pages/NotFound";
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
          <Route path="/thanh-toan" element={<ThanhToan />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
