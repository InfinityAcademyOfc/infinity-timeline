// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AppLayout from './components/AppLayout';
import AdminNav from './components/AdminNav';

// Páginas Públicas
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import AdminAuthPage from './pages/AdminAuthPage'; // <-- IMPORT ATUALIZADO
import NotFound from './pages/NotFound';

// Páginas Admin (Protegidas)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminClientDetails from './pages/admin/AdminClientDetails';
import AdminTemplates from './pages/admin/AdminTemplates';
import AdminTimelines from './pages/admin/AdminTimelines';
import AdminSettings from './pages/admin/AdminSettings';

// Páginas Cliente (Protegidas)
import ClientDashboard from './pages/client/ClientDashboard';
import ClientTimeline from './pages/client/ClientTimeline';
import ClientProgress from './pages/client/ClientProgress';
import ClientDocuments from './pages/client/ClientDocuments';
import ClientIndications from './pages/client/ClientIndications';
import ClientSettings from './pages/client/ClientSettings';

import './App.css';
import { Toaster } from './components/ui/toaster';

const queryClient = new QueryClient();

// Layout de Admin Simples
const AdminLayout = () => (
  <div className="flex min-h-screen w-full flex-col bg-muted/40">
    <AdminNav />
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Outlet />
    </main>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* === Rotas Públicas === */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} /> {/* Rota Login Cliente */}
            <Route path="/admin/login" element={<AdminAuthPage />} /> {/* Rota Login Admin */}

            {/* === Rotas de Admin (Protegidas) === */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="clients/:id" element={<AdminClientDetails />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="timelines" element={<AdminTimelines />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* === Rotas de Cliente (Protegidas) === */}
            <Route
              path="/cliente"
              element={
                <ProtectedRoute requireClient>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="timeline" element={<ClientTimeline />} />
              <Route path="progress" element={<ClientProgress />} />
              <Route path="documents" element={<ClientDocuments />} />
              <Route path="indicacoes" element={<ClientIndications />} />
              <Route path="settings" element={<ClientSettings />} />
            </Route>

            {/* === Redirecionamentos / Aliases === */}
            <Route path="/timeline" element={<Navigate to="/cliente/timeline" replace />} />
            <Route path="/documentos" element={<Navigate to="/cliente/documentos" replace />} />
            <Route path="/indicacoes" element={<Navigate to="/cliente/indicacoes" replace />} />
            <Route path="/progresso" element={<Navigate to="/cliente/progresso" replace />} />
            <Route path="/configuracoes" element={<Navigate to="/cliente/configuracoes" replace />} />
            <Route path="/dashboard" element={<Navigate to="/cliente/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
