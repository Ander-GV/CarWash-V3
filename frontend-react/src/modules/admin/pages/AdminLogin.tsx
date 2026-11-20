import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Lock, Mail, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@carwash.com');
  const [password, setPassword] = useState('AdminCarWash2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas. Verifique su correo y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(6, 182, 212, 0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '20px',
              overflow: 'hidden',
              margin: '0 auto 1.25rem auto',
              border: '2px solid var(--primary-cyan)',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)',
            }}
          >
            <img
              src="/carwash-branding.jpg"
              alt="CAR WASH"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            CAR WASH
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Panel de Control Administrativo & IoT
          </p>
        </div>

        {error && (
          <div
            id="login-error-alert"
            className="animate-slide-up"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: error.toLowerCase().includes('suspendida')
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(244, 63, 94, 0.15)',
              border: error.toLowerCase().includes('suspendida')
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid rgba(244, 63, 94, 0.4)',
              color: error.toLowerCase().includes('suspendida') ? '#fcd34d' : '#fb7185',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              boxShadow: error.toLowerCase().includes('suspendida')
                ? '0 0 15px rgba(245, 158, 11, 0.2)'
                : '0 0 15px rgba(244, 63, 94, 0.2)',
            }}
          >
            <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                {error.toLowerCase().includes('suspendida')
                  ? 'Su cuenta se encuentra suspendida'
                  : error.toLowerCase().includes('no existe')
                  ? 'Cuenta no existe'
                  : 'Error de Acceso'}
              </div>
              <div style={{ opacity: 0.95, fontSize: '0.825rem' }}>{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
              Correo Administrativo
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#64748b"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="login-input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#64748b"
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="login-input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Validando Credenciales...' : 'Ingresar al Dashboard'}
          </button>
        </form>

        {/* Credentials reminder & fast test selector */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.85rem',
            borderRadius: '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.4rem' }}>
            <CheckCircle2 size={14} /> Cuentas para Pruebas Rápidas:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => { setEmail('admin@carwash.com'); setPassword('AdminCarWash2026!'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.15rem 0',
              }}
            >
              • <strong>admin@carwash.com</strong> (Admin Maestro)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('supervisor@carwash.com'); setPassword('AdminCarWash2026!'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.15rem 0',
              }}
            >
              • <strong>supervisor@carwash.com</strong> (Supervisor)
            </button>
            <button
              type="button"
              onClick={() => { setEmail('operador.bahia@carwash.com'); setPassword('AdminCarWash2026!'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: '0.15rem 0',
              }}
            >
              • <strong>operador.bahia@carwash.com</strong> (Operador Bahía)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
