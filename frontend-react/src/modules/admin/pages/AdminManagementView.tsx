import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Key,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  UserCheck,
  UserX,
} from 'lucide-react';
import api, { getStoredMockAdmins } from '../../../shared/services/api';
import { useAuth } from '../../../context/AuthContext';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ROLE_ADMIN' | 'ROLE_OPERATOR'>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ROLE_ADMIN' | 'ROLE_OPERATOR'>('ROLE_ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await api.get('/auth/admins');
      const list = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.admins) ? res.data.admins : getStoredMockAdmins());
      setAdmins(list && list.length > 0 ? list : getStoredMockAdmins());
    } catch {
      // Respaldo transparente con almacén local de personal si el backend está offline
      setAdmins(getStoredMockAdmins());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionFeedback(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setActionError('Por favor completa todos los campos del formulario.');
      return;
    }

    if (password.length < 6) {
      setActionError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/admins', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setActionFeedback(`¡Personal ${fullName} registrado exitosamente!`);
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('ROLE_ADMIN');
      fetchAdmins();

      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || 'Error al registrar el personal. Verifica el correo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (admin.email === 'admin@carwash.com') {
      setActionError('La cuenta del Administrador Maestro principal no puede ser eliminada.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    setConfirmDeleteId(null);

    // 1. Actualización visual instantánea en el estado
    setAdmins((prev) => prev.filter((a) => a.id !== admin.id));

    // 2. Persistencia directa en localStorage para entornos de desarrollo / fallback
    try {
      const raw = localStorage.getItem('carwash_mock_admins');
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.filter(
          (a: any) =>
            a.id !== admin.id &&
            a.id.toLowerCase() !== admin.id.toLowerCase() &&
            a.email.toLowerCase() !== admin.email.toLowerCase()
        );
        localStorage.setItem('carwash_mock_admins', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error sincronizando localStorage:', e);
    }

    // 3. Notificación al backend / API
    try {
      await api.delete(`/auth/admins/${admin.id}`);
      setActionFeedback(`Cuenta de "${admin.fullName}" eliminada definitivamente. Al intentar iniciar sesión el sistema indicará: "Cuenta no existe".`);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Error al eliminar usuario.');
      setTimeout(() => setActionError(null), 4000);
      fetchAdmins();
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.email === 'admin@carwash.com') {
      setActionError('La cuenta del Administrador Maestro principal no puede ser suspendida.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }

    const nextStatus = admin.isActive === false ? true : false;

    // 1. Actualización visual instantánea en el estado local
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, isActive: nextStatus } : a))
    );

    // 2. Persistencia directa en localStorage para entornos de desarrollo / fallback
    try {
      const raw = localStorage.getItem('carwash_mock_admins');
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((a: any) =>
          a.id === admin.id || a.email.toLowerCase() === admin.email.toLowerCase()
            ? { ...a, isActive: nextStatus }
            : a
        );
        localStorage.setItem('carwash_mock_admins', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error sincronizando localStorage:', e);
    }

    // 3. Llamada al endpoint
    try {
      const res = await api.post(`/auth/admins/${admin.id}/toggle-status`);
      const msg = res.data?.message || (nextStatus ? `Cuenta de "${admin.fullName}" reactivada con éxito.` : `Cuenta de "${admin.fullName}" suspendida. Al intentar iniciar sesión dirá: "Su cuenta se encuentra suspendida".`);
      setActionFeedback(msg);
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err: any) {
      // Revertir en caso de falla real
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: admin.isActive } : a))
      );
      setActionError(err.response?.data?.message || 'Error al cambiar estado del usuario.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  const adminList = Array.isArray(admins) ? admins : [];

  const filteredAdmins = adminList.filter((a) => {
    if (roleFilter === 'ALL') return true;
    return a.role === roleFilter;
  });

  const getPasswordStrength = () => {
    if (!password) return { text: 'Sin contraseña', color: '#94a3b8', width: '0%' };
    if (password.length < 6) return { text: 'Débil (mínimo 6 caracteres)', color: '#f43f5e', width: '30%' };
    if (password.length < 9) return { text: 'Moderada', color: '#f59e0b', width: '65%' };
    return { text: 'Fuerte y Segura', color: '#10b981', width: '100%' };
  };

  const strength = getPasswordStrength();

  return (
    <div style={{ minHeight: 'calc(100vh - 75px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div className="app-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Breadcrumb & Title */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            <div
              className="badge badge-info"
              style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ShieldCheck size={14} /> SEGURIDAD Y CONTROL DE ACCESOS
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Gestión de Personal (Admins y Empleados)
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Registra, suspende o elimina administradores y empleados de bahía autorizados para operar la estación.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchAdmins}
              className="btn-secondary"
              style={{ padding: '0.65rem 1rem' }}
              title="Recargar lista"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setShowModal(true);
                setActionError(null);
              }}
              className="btn-primary"
              style={{
                padding: '0.65rem 1.35rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
              }}
            >
              <UserPlus size={18} />
              <span>Registrar Personal</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {actionFeedback && (
          <div
            className="animate-slide-up"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1.25rem',
              color: '#34d399',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <CheckCircle2 size={20} />
            <span style={{ fontWeight: 600 }}>{actionFeedback}</span>
          </div>
        )}

        {actionError && !showModal && (
          <div
            className="animate-slide-up"
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1.25rem',
              color: '#fb7185',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <AlertCircle size={20} />
            <span style={{ fontWeight: 600 }}>{actionError}</span>
          </div>
        )}

        {/* Stats Summary Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Personal
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#38bdf8' }}>
                  {adminList.length}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={20} color="#38bdf8" />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Accesos habilitados en base de datos
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Administradores
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60a5fa' }}>
                  {adminList.filter((a) => a.role === 'ROLE_ADMIN').length}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={20} color="#60a5fa" />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Permiso total de control y finanzas
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Operadores Bahía
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f59e0b' }}>
                  {adminList.filter((a) => a.role === 'ROLE_OPERATOR').length}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Key size={20} color="#f59e0b" />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Supervisión de ciclos y apertura manual
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Personal Activo
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34d399' }}>
                  {adminList.filter((a) => a.isActive !== false).length}
                </div>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} color="#34d399" />
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Cuentas habilitadas para operar
            </div>
          </div>
        </div>

        {/* Admins Table / List Card */}
        <div className="glass-panel" style={{ padding: '1.75rem', overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '0.75rem',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#38bdf8" />
              Personal Registrado ({filteredAdmins.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sesión activa: <strong style={{ color: '#fff' }}>{currentUser?.email}</strong>
            </span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRoleFilter('ALL')}
              className={roleFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            >
              Todos ({adminList.length})
            </button>
            <button
              onClick={() => setRoleFilter('ROLE_ADMIN')}
              className={roleFilter === 'ROLE_ADMIN' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            >
              Administradores ({adminList.filter((a) => a.role === 'ROLE_ADMIN').length})
            </button>
            <button
              onClick={() => setRoleFilter('ROLE_OPERATOR')}
              className={roleFilter === 'ROLE_OPERATOR' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            >
              Empleados / Operadores ({adminList.filter((a) => a.role === 'ROLE_OPERATOR').length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>Cargando lista de administradores...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <ShieldAlert size={36} color="#f43f5e" style={{ margin: '0 auto 0.5rem auto' }} />
              <p>No se encontraron usuarios para este filtro.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-glass)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <th style={{ padding: '0.75rem 1rem' }}>Usuario / Personal</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Correo Electrónico</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Rol</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Fecha de Registro</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((adm) => {
                    const isMaster = adm.email === 'admin@carwash.com';
                    const initials = adm.fullName
                      ? adm.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AD';

                    return (
                      <tr
                        key={adm.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Avatar & Name */}
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isMaster
                                ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                                : 'linear-gradient(135deg, #6366f1, #a855f7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: '#fff',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                              {adm.fullName}
                            </div>
                            {isMaster && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#38bdf8',
                                  fontWeight: 600,
                                }}
                              >
                                ★ Administrador Principal
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={14} color="#64748b" />
                            <span>{adm.email}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '1rem' }}>
                          <span
                            className={adm.role === 'ROLE_ADMIN' ? 'badge badge-info' : 'badge badge-warning'}
                            style={{ fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {adm.role === 'ROLE_ADMIN' ? 'ADMINISTRADOR' : 'OPERADOR BAHÍA'}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span
                              style={{
                                width: '9px',
                                height: '9px',
                                borderRadius: '50%',
                                background: adm.isActive !== false ? '#10b981' : '#f43f5e',
                                boxShadow: adm.isActive !== false ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: adm.isActive !== false ? '#34d399' : '#fb7185',
                              }}
                            >
                              {adm.isActive !== false ? 'Activo' : 'Suspendido'}
                            </span>
                          </div>
                        </td>

                        {/* Created At */}
                        <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                          {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {isMaster ? (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-dim)',
                                fontStyle: 'italic',
                              }}
                            >
                              Cuenta Maestra Protegida
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
                              <button
                                id={`btn-toggle-${adm.id}`}
                                onClick={() => handleToggleStatus(adm)}
                                className="btn-secondary"
                                style={{
                                  padding: '0.45rem 0.75rem',
                                  color: adm.isActive !== false ? '#f59e0b' : '#34d399',
                                  borderColor: adm.isActive !== false ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                                  background: adm.isActive !== false ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                                title={adm.isActive !== false ? 'Suspender acceso temporalmente' : 'Reactivar acceso a la cuenta'}
                              >
                                {adm.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                                <span>{adm.isActive !== false ? 'Suspender' : 'Reactivar'}</span>
                              </button>

                              {confirmDeleteId === adm.id ? (
                                <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                                  <button
                                    id={`btn-confirm-delete-${adm.id}`}
                                    onClick={() => handleDeleteAdmin(adm)}
                                    style={{
                                      padding: '0.45rem 0.85rem',
                                      background: '#f43f5e',
                                      color: '#ffffff',
                                      border: '1px solid #f43f5e',
                                      borderRadius: '0.5rem',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      boxShadow: '0 0 12px rgba(244, 63, 94, 0.5)',
                                      cursor: 'pointer',
                                    }}
                                    title="Haga clic para confirmar la eliminación permanente"
                                  >
                                    <Trash2 size={14} />
                                    <span>¿Confirmar?</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="btn-secondary"
                                    style={{
                                      padding: '0.45rem 0.6rem',
                                      fontSize: '0.8rem',
                                      color: 'var(--text-muted)',
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn-delete-${adm.id}`}
                                  onClick={() => setConfirmDeleteId(adm.id)}
                                  className="btn-secondary"
                                  style={{
                                    padding: '0.45rem 0.75rem',
                                    color: 'var(--accent-rose)',
                                    borderColor: 'rgba(244, 63, 94, 0.35)',
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                  title="Eliminar usuario definitivamente"
                                >
                                  <Trash2 size={14} />
                                  <span>Eliminar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Registrar Nuevo Administrador */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(5, 10, 24, 0.85)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem',
            }}
          >
            <div
              className="glass-panel animate-scale-up"
              style={{
                maxWidth: '520px',
                width: '100%',
                padding: '2rem',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.3)',
                borderRadius: '1.25rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid var(--border-glass)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserPlus size={22} color="#38bdf8" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registrar Personal (Admin u Operador)</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Crea credenciales con acceso al panel y control de bahía para otros administradores o empleados
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>

              {actionError && (
                <div
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    borderRadius: '0.65rem',
                    padding: '0.75rem 1rem',
                    color: '#fb7185',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterAdmin}>
                {/* Nombre Completo */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Nombre Completo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={18}
                      color="#64748b"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Ej: Ing. Andrea Morales"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Correo Electrónico Corporativo */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Correo Electrónico Corporativo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      color="#64748b"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="andrea.admin@carwash.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Contraseña Segura */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Contraseña Inicial
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key
                      size={18}
                      color="#64748b"
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div
                        style={{
                          height: '4px',
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: strength.width,
                            background: strength.color,
                            transition: 'width 0.3s, background 0.3s',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: strength.color, marginTop: '0.25rem', textAlign: 'right' }}>
                        Seguridad: {strength.text}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rol Selector */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Nivel de Permisos (Rol)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div
                      onClick={() => setRole('ROLE_ADMIN')}
                      style={{
                        border: role === 'ROLE_ADMIN' ? '2px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                        background: role === 'ROLE_ADMIN' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '0.75rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <ShieldCheck size={16} color={role === 'ROLE_ADMIN' ? '#38bdf8' : '#94a3b8'} />
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: role === 'ROLE_ADMIN' ? '#38bdf8' : '#fff' }}>
                          ADMINISTRADOR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Control total: ingresos, talanquera, logs y usuarios
                      </div>
                    </div>

                    <div
                      onClick={() => setRole('ROLE_OPERATOR')}
                      style={{
                        border: role === 'ROLE_OPERATOR' ? '2px solid var(--accent-amber)' : '1px solid var(--border-glass)',
                        background: role === 'ROLE_OPERATOR' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '0.75rem',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <Key size={16} color={role === 'ROLE_OPERATOR' ? '#f59e0b' : '#94a3b8'} />
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: role === 'ROLE_OPERATOR' ? '#f59e0b' : '#fff' }}>
                          OPERADOR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Supervisión de lavado y apertura de emergencia
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                    style={{ padding: '0.65rem 1.25rem' }}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>{role === 'ROLE_ADMIN' ? 'Crear Administrador' : 'Crear Empleado'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagementView;
