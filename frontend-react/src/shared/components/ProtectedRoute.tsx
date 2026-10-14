import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: string;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectTo = '/admin/login',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#06b6d4' }}>
        <p>Cargando sesión segura...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#f43f5e' }}>
        <h2>Acceso Restringido</h2>
        <p>Tu cuenta ({user?.role}) no posee permisos suficientes para acceder a esta área de administración.</p>
        <button
          className="btn-secondary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => window.location.href = '/'}
        >
          Regresar al Inicio
        </button>
      </div>
    );
  }

  return <Outlet />;
};
