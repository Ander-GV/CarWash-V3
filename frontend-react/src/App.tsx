import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './shared/components/Navbar';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

// Módulo Cliente
import { ClientLanding } from './modules/client/pages/ClientLanding';
import { WashLiveTracker } from './modules/client/pages/WashLiveTracker';

// Módulo Admin
import { AdminLogin } from './modules/admin/pages/AdminLogin';
import { AdminDashboard } from './modules/admin/pages/AdminDashboard';
import { WashLogsView } from './modules/admin/pages/WashLogsView';
import { PredictiveAnalyticsView } from './modules/admin/pages/PredictiveAnalyticsView';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Rutas Públicas Módulo Cliente (Kiosco / Web) */}
              <Route path="/" element={<ClientLanding />} />
              <Route path="/tracker/:sessionId" element={<WashLiveTracker />} />

              {/* Autenticación de Administradores */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Rutas Protegidas Módulo de Administración (ROLE_ADMIN / Backoffice) */}
              <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN" redirectTo="/admin/login" />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/logs" element={<WashLogsView />} />
                <Route path="/admin/analytics" element={<PredictiveAnalyticsView />} />
              </Route>

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
