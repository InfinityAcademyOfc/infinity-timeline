import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminTemplates from "./pages/admin/AdminTemplates";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientTimeline from "./pages/client/ClientTimeline";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientIndications from "./pages/client/ClientIndications";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/clients" element={
                <ProtectedRoute requireAdmin>
                  <AdminClients />
                </ProtectedRoute>
              } />
              <Route path="/admin/templates" element={
                <ProtectedRoute requireAdmin>
                  <AdminTemplates />
                </ProtectedRoute>
              } />

              {/* Client Routes */}
              <Route path="/cliente" element={
                <ProtectedRoute>
                  <Navigate to="/cliente/dashboard" replace />
                </ProtectedRoute>
              } />
              <Route path="/cliente/dashboard" element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/cliente/cronograma" element={
                <ProtectedRoute>
                  <ClientTimeline />
                </ProtectedRoute>
              } />
              <Route path="/cliente/documentos" element={
                <ProtectedRoute>
                  <ClientDocuments />
                </ProtectedRoute>
              } />
              <Route path="/cliente/indicacoes" element={
                <ProtectedRoute>
                  <ClientIndications />
                </ProtectedRoute>
              } />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
