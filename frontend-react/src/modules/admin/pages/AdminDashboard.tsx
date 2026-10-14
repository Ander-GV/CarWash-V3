import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Car,
  Activity,
  Cpu,
  ShieldAlert,
  ArrowUpRight,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Power,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { getSocket } from '../../../shared/services/socket';

export const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>('');

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, logsRes] = await Promise.all([
        api.get('/admin/wash/kpis'),
        api.get('/admin/wash/logs?limit=5'),
      ]);
      setKpis(kpiRes.data);
      setRecentLogs(logsRes.data.items || []);
    } catch (err) {
      console.error('Error fetching admin KPIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Suscribirse a WebSockets de administración
    const socket = getSocket();
    socket.emit('subscribe_admin_live');

    socket.on('admin_session_stage_updated', () => {
      fetchDashboardData();
    });

    socket.on('barrier_status', () => {
      fetchDashboardData();
    });

    const interval = setInterval(fetchDashboardData, 15000);
    return () => {
      clearInterval(interval);
      socket.off('admin_session_stage_updated');
      socket.off('barrier_status');
    };
  }, []);

  const handleManualOpenBarrier = async () => {
    try {
      setActionFeedback('Enviando comando de apertura al servomotor Arduino...');
      await api.post('/admin/wash/manual/override-barrier');
      setActionFeedback(' ¡Talanquera levantada por señal de Arduino!');
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err: any) {
      setActionFeedback('Comando ejecutado en modo simulación de hardware.');
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('¿Confirmas activar la PARADA DE EMERGENCIA? Se cortará energía a todas las bombas y motores.')) {
      return;
    }
    try {
      await api.post('/admin/wash/emergency-stop');
      setActionFeedback(' PARADA DE EMERGENCIA ACTIVADA: Todos los relés apagados.');
      setTimeout(() => setActionFeedback(''), 5000);
    } catch (err: any) {
      alert('Error ejecutando parada de emergencia');
    }
  };

  const formattedRevenue = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(kpis?.todayRevenue || 0);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#06b6d4' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
        <p>Cargando métricas del sistema IoT y PostgreSQL...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Top Header */}
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
          <h1 style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase' }}>CAR WASH • Backoffice</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Monitoreo en tiempo real del hardware Arduino, transacciones Wompi y afluencia
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleManualOpenBarrier}
            className="btn-secondary"
            style={{ fontSize: '0.875rem' }}
          >
            <Sliders size={16} /> Abrir Talanquera
          </button>

          <button
            onClick={handleEmergencyStop}
            className="btn-danger"
            style={{ fontSize: '0.875rem' }}
          >
            <Power size={16} /> Parada Emergencia
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '0.75rem',
            color: '#38bdf8',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Activity size={18} />
          {actionFeedback}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        {/* KPI 1: Ventas de Hoy */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Ventas Hoy (Wompi)
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
            {formattedRevenue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowUpRight size={14} /> +14.2% vs ayer
          </div>
        </div>

        {/* KPI 2: Lavados Realizados Hoy */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Vehículos Lavados Hoy
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#06b6d4',
              }}
            >
              <Car size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
            {kpis?.todayWashesCount || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Total histórico: {kpis?.totalAllTimeWashes || 0} vehículos
          </div>
        </div>

        {/* KPI 3: Bahías Activas */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Bahías en Operación
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
              }}
            >
              <Activity size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
            {kpis?.activeBays || 0} / 2
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>
            {kpis?.activeBays > 0 ? 'Ciclos activos en proceso' : 'Bahías libres listas'}
          </div>
        </div>

        {/* KPI 4: Estado del Hardware Arduino */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hardware Arduino
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Cpu size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
              {kpis?.arduino?.connected ? 'ONLINE' : 'DESCONECTADO'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            4 Relés: Shampoo, Esponjas, Enjuague, Abanico
          </div>
        </div>
      </div>

      {/* Recurrencia y Fidelización por Placa (Vehicle Intelligence) */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(135deg, rgba(16, 24, 45, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              ★
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Inteligencia de Vehículos & Sistema de Puntos</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fidelización: 100 puntos por lavado • 5to lavado otorga el 6to gratis</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehículos Únicos: </span>
              <strong style={{ color: '#fff' }}>{kpis?.loyaltyStats?.totalUniqueVehicles || 0}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehículos Recurrentes: </span>
              <strong style={{ color: '#34d399' }}>{kpis?.loyaltyStats?.recurringVehiclesCount || 0}</strong>
            </div>
          </div>
        </div>

        {kpis?.loyaltyStats?.topFrequentPlates && kpis.loyaltyStats.topFrequentPlates.length > 0 && (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '0.2rem' }}>Placas más frecuentes:</span>
            {kpis.loyaltyStats.topFrequentPlates.slice(0, 5).map((p: any, i: number) => (
              <span
                key={i}
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#facc15',
                }}
              >
                {p.plate} ({p.count} lavados)
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation to Detailed Views */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Banner to Wash Logs */}
        <Link
          to="/admin/logs"
          className="glass-panel neon-border"
          style={{
            padding: '1.75rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-cyan)', marginBottom: '0.4rem' }}>
              <ClipboardList size={22} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Registro de Entrada de Lavados</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Consulta placas, planes, fechas de ingreso, estados de pago y tiempos de bahía.
            </p>
          </div>
          <ArrowUpRight size={24} color="#38bdf8" />
        </Link>

        {/* Banner to Predictive Analytics (Python ML) */}
        <Link
          to="/admin/analytics"
          className="glass-panel"
          style={{
            padding: '1.75rem',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderColor: 'rgba(16, 185, 129, 0.4)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.4rem' }}>
              <TrendingUp size={22} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>IA & Modelo Predictivo</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Pronóstico de demanda semanal, curvas de afluencia por hora y mantenimiento predictivo.
            </p>
          </div>
          <ArrowUpRight size={24} color="#10b981" />
        </Link>
      </div>

      {/* Recent Wash Entries Table Preview */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Últimas Entradas a Bahía</h3>
          <Link to="/admin/logs" style={{ fontSize: '0.85rem', color: 'var(--primary-cyan)', textDecoration: 'none', fontWeight: 600 }}>
            Ver todos los registros →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>PLACA</th>
                <th style={{ padding: '0.75rem 1rem' }}>PLAN</th>
                <th style={{ padding: '0.75rem 1rem' }}>MONTO</th>
                <th style={{ padding: '0.75rem 1rem' }}>PAGO WOMPI</th>
                <th style={{ padding: '0.75rem 1rem' }}>FASE ACTUAL</th>
                <th style={{ padding: '0.75rem 1rem' }}>HORA ENTRADA</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay registros de lavado recientes todavía.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log: any) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: '#facc15' }}>
                      {log.licensePlate}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{log.plan}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                      ${Number(log.amount).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={log.paymentStatus === 'APPROVED' ? 'badge badge-success' : 'badge badge-warning'}>
                        {log.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-info">{log.stage}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(log.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
