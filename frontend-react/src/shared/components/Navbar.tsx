import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Car,
  Droplets,
  Sparkles,
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  LogOut,
  LogIn,
  Layers,
  Users,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Kiosco Cliente', icon: Layers },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Admins', icon: Users },
    { to: '/admin/logs', label: 'Registro Entradas', icon: ClipboardList },
    { to: '/admin/analytics', label: 'IA Predictiva', icon: TrendingUp },
  ];

  return (
    <header className="carwash-navbar">
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.5rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Logo & Carwash Badge */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          {/* Logo con aura de agua */}
          <div
            style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '2.5px solid #ffffff',
              boxShadow: '0 0 20px rgba(7, 14, 30, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3)',
              background: '#070e1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="/carwash-branding.jpg"
              alt="CAR WASH"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                // Fallback si la imagen no carga
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <Car
              size={24}
              color="#00f0ff"
              style={{ position: 'absolute', zIndex: -1 }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  color: '#070e1e',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.4)',
                }}
              >
                CAR WASH
              </span>
              <span
                style={{
                  background: '#070e1e',
                  color: '#00f0ff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Droplets size={10} color="#00f0ff" /> PRO
              </span>
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                color: '#042f44',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '1px',
              }}
            >
              <span className="pulse-dot"></span>
              Túnel Inteligente • ESP32 IoT
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Tabs (Contraste Oscuro contra el Aqua Brillante) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-pill-carwash ${active ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Auth Status & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  textAlign: 'right',
                  background: 'rgba(7, 14, 30, 0.75)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                }}
                className="user-profile-badge"
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                  {user?.fullName}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#38bdf8',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.25rem',
                  }}
                >
                  <ShieldCheck size={11} /> {user?.role}
                </div>
              </div>

              <button
                onClick={logout}
                className="nav-pill-carwash"
                style={{
                  padding: '0.5rem 0.85rem',
                  color: '#fb7185',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                }}
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
                <span className="btn-label-text">Salir</span>
              </button>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="nav-pill-carwash"
              style={{
                background: '#070e1e',
                color: '#00f0ff',
                borderColor: '#00f0ff',
                boxShadow: '0 0 14px rgba(0, 240, 255, 0.4)',
              }}
            >
              <LogIn size={16} />
              <span>Acceso Admin</span>
            </Link>
          )}

          {/* Botón de Menú Móvil */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              background: '#070e1e',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              padding: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Abrir Menú"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(7, 14, 30, 0.98)',
            borderTop: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            backdropFilter: 'blur(16px)',
          }}
          className="mobile-nav-drawer"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-pill-carwash ${active ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Reglas Responsive en bloque style integrado */}
      <style>{`
        @media (max-width: 960px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
          .user-profile-badge {
            display: none !important;
          }
          .btn-label-text {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
