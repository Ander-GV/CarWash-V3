import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  Cpu,
  TrendingUp,
  LogOut,
  LogIn,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      style={{
        background: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid var(--primary-cyan)',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0f172a',
            }}
          >
            <img
              src="/carwash-branding.jpg"
              alt="CAR WASH"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
                background: 'linear-gradient(to right, #ffffff 0%, #38bdf8 50%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
              }}
            >
              CAR WASH
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-dot"></span> Autolavado Inteligente • Arduino IoT
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            to="/"
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem',
              background: isActive('/') ? 'rgba(6, 182, 212, 0.15)' : undefined,
              borderColor: isActive('/') ? 'var(--primary-cyan)' : undefined,
              color: isActive('/') ? '#38bdf8' : undefined,
            }}
          >
            <Layers size={16} /> Kiosco Cliente
          </Link>

          <Link
            to="/admin"
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem',
              background: isActive('/admin') ? 'rgba(59, 130, 246, 0.15)' : undefined,
              borderColor: isActive('/admin') ? 'var(--primary-blue)' : undefined,
              color: isActive('/admin') ? '#60a5fa' : undefined,
            }}
          >
            <LayoutDashboard size={16} /> Dashboard Admin
          </Link>

          <Link
            to="/admin/logs"
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem',
              background: isActive('/admin/logs') ? 'rgba(139, 92, 246, 0.15)' : undefined,
              borderColor: isActive('/admin/logs') ? 'var(--accent-purple)' : undefined,
              color: isActive('/admin/logs') ? '#c084fc' : undefined,
            }}
          >
            <ClipboardList size={16} /> Registro Entradas
          </Link>

          <Link
            to="/admin/analytics"
            className="btn-secondary"
            style={{
              padding: '0.5rem 0.9rem',
              fontSize: '0.875rem',
              background: isActive('/admin/analytics') ? 'rgba(16, 185, 129, 0.15)' : undefined,
              borderColor: isActive('/admin/analytics') ? 'var(--accent-emerald)' : undefined,
              color: isActive('/admin/analytics') ? '#34d399' : undefined,
            }}
          >
            <TrendingUp size={16} /> IA Predictiva
          </Link>
        </nav>

        {/* Right Section: Auth Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.fullName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)' }}>{user?.role}</div>
              </div>
              <button
                onClick={logout}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.75rem', color: 'var(--accent-rose)' }}
                title="Cerrar Sesión"
              >
                <LogOut size={16} /> Salir
              </button>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <LogIn size={16} /> Acceso Admin
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
