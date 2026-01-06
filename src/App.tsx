import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CallingPage from "./pages/CallingPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CompletedPage from "./pages/CompletedPage";
import AISettingsPage from "./pages/AISettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/calling" element={<CallingPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/completed" element={<CompletedPage />} />
          <Route path="/ai-settings" element={<AISettingsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
