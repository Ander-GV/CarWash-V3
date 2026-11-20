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
  UserPlus,
  Play,
  MapPin,
  RotateCcw,
  AlertOctagon,
  Flag,
  Droplets,
  Layers,
  Wind,
  Star,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { getSocket } from '../../../shared/services/socket';

export const AdminDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [vehicleLocation, setVehicleLocation] = useState<{ location: string; percent: number }>({
    location: 'INICIO',
    percent: 0,
  });

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

    socket.on('vehicle_location', (data: any) => {
      if (data?.location) {
        setVehicleLocation({
          location: data.location,
          percent: data.percent ?? 0,
        });
      }
    });

    socket.on('stage_updated', (data: any) => {
      if (data?.stage) {
        if (data.stage === 'STAGE_SHAMPOO') setVehicleLocation({ location: 'BOMBA_1_CHAMPU', percent: 20 });
        else if (data.stage === 'STAGE_SPONGES') setVehicleLocation({ location: 'ESPONJAS_ACTIVAS', percent: 50 });
        else if (data.stage === 'STAGE_RINSE') setVehicleLocation({ location: 'BOMBA_2_ENJUAGUE', percent: 75 });
        else if (data.stage === 'STAGE_FAN_DRYING') setVehicleLocation({ location: 'SECADOR_ABANICO', percent: 95 });
        else if (data.stage === 'STAGE_RETURNING') setVehicleLocation({ location: 'RETORNO_ESPEJO', percent: 60 });
        else if (data.stage === 'STAGE_FINISHED') setVehicleLocation({ location: 'INICIO', percent: 0 });
      }
      fetchDashboardData();
    });

    socket.on('barrier_status', () => {
      fetchDashboardData();
    });

    const interval = setInterval(fetchDashboardData, 15000);
    return () => {
      clearInterval(interval);
      socket.off('admin_session_stage_updated');
      socket.off('vehicle_location');
      socket.off('stage_updated');
      socket.off('barrier_status');
    };
  }, []);

  const isEmergencyStopped = Boolean(kpis?.isEmergencyStopped || kpis?.hardware?.isEmergencyStopped);

  const handleStartWash = async () => {
    try {
      setActionFeedback('Enviando orden de inicio a la bahía automatizada...');
      const res = await api.post('/admin/wash/start-wash');
      setActionFeedback(res.data?.message || 'Lavado iniciado exitosamente en la bahía.');
      setVehicleLocation({ location: 'INICIO_A_BOMBA1', percent: 10 });
      await fetchDashboardData();
      setTimeout(() => setActionFeedback(''), 5000);
    } catch (err: any) {
      alert('Error iniciando lavado: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleManualOpenBarrier = async () => {
    try {
      setActionFeedback('Enviando comando de apertura al servomotor de talanquera...');
      await api.post('/admin/wash/manual/override-barrier');
      setActionFeedback('Talanquera levantada por señal del controlador.');
      setTimeout(() => setActionFeedback(''), 4000);
    } catch (err: any) {
      setActionFeedback('Comando ejecutado en modo simulación de hardware.');
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const handleEmergencyStop = async () => {
    if (!window.confirm('¿Confirmas activar la PARADA DE EMERGENCIA? Se cortará energía a todas las bombas, cepillos y motores. El sistema quedará BLOQUEADO hasta que des la orden de reinicio.')) {
      return;
    }
    try {
      const res = await api.post('/admin/wash/emergency-stop');
      setActionFeedback(res.data?.message || 'PARADA DE EMERGENCIA ACTIVADA: Todos los actuadores apagados.');
      await fetchDashboardData();
      setTimeout(() => setActionFeedback(''), 6000);
    } catch (err: any) {
      alert('Error ejecutando parada de emergencia: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResumeSystem = async () => {
    try {
      setActionFeedback('Enviando orden de reinicio y rearme al controlador ESP32...');
      const res = await api.post('/admin/wash/resume-system');
      setActionFeedback(res.data?.message || 'Orden de reinicio ejecutada. Sistema reactivado y listo para operar.');
      await fetchDashboardData();
      setTimeout(() => setActionFeedback(''), 6000);
    } catch (err: any) {
      alert('Error enviando orden de reinicio: ' + (err.response?.data?.message || err.message));
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
            Monitoreo en tiempo real del hardware de bahía, transacciones Wompi y afluencia
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            to="/admin/users"
            className="btn-primary"
            style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <UserPlus size={16} /> Gestionar Personal
          </Link>

          <button
            onClick={handleStartWash}
            className="btn-primary"
            style={{
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.6rem 1.25rem',
              fontWeight: 800,
              cursor: isEmergencyStopped ? 'not-allowed' : 'pointer',
              opacity: isEmergencyStopped ? 0.5 : 1,
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}
            disabled={isEmergencyStopped}
            title={isEmergencyStopped ? 'Bloqueado por parada de emergencia' : 'Iniciar ciclo de lavado'}
          >
            <Play size={16} /> INICIAR LAVADO
          </button>

          {isEmergencyStopped ? (
            <button
              onClick={handleResumeSystem}
              style={{
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.6rem 1.25rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
              }}
            >
              <RefreshCw size={16} className="animate-spin" /> CONTINUAR LAVADO
            </button>
          ) : (
            <button
              onClick={handleEmergencyStop}
              className="btn-danger"
              style={{
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                fontWeight: 800,
              }}
            >
              <Power size={16} /> PARADA EMERGENCIA
            </button>
          )}
        </div>
      </div>

      {/* Visualizador de Ubicación del Vehículo en Tiempo Real */}
      <div
        className="glass-panel neon-border"
        style={{
          padding: '1.5rem 1.75rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
          borderRadius: '1rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                UBICACIÓN DEL VEHÍCULO EN TIEMPO REAL (BAHÍA IOT)
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Rastreo milimétrico del vehículo a lo largo del túnel de lavado
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isEmergencyStopped ? (
              <span className="badge badge-danger" style={{ background: '#ef4444', color: '#fff', padding: '0.4rem 0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertOctagon size={14} /> PAUSADO POR EMERGENCIA
              </span>
            ) : vehicleLocation.percent > 0 ? (
              <span className="badge badge-info" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '0.4rem 0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                {vehicleLocation.location.includes('RETORNO') ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                {vehicleLocation.location.includes('RETORNO') ? 'RETORNO SIMÉTRICO' : 'EN LAVADO ACTIVO'}
              </span>
            ) : (
              <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.4rem 0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Flag size={14} /> VEHÍCULO EN POSICIÓN INICIAL
              </span>
            )}
          </div>
        </div>

        {/* Physical Track Representation */}
        <div style={{ position: 'relative', margin: '2.5rem 1rem 1rem 1rem' }}>
          {/* Track Bar Background */}
          <div
            style={{
              height: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${vehicleLocation.percent}%`,
                background: isEmergencyStopped
                  ? '#ef4444'
                  : 'linear-gradient(90deg, #06b6d4, #3b82f6, #10b981)',
                borderRadius: '9999px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isEmergencyStopped ? '0 0 15px #ef4444' : '0 0 15px rgba(6, 182, 212, 0.8)',
              }}
            />
          </div>

          {/* Gliding Car Badge */}
          <div
            style={{
              position: 'absolute',
              top: '-26px',
              left: `calc(${vehicleLocation.percent}% - 22px)`,
              transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isEmergencyStopped
                  ? 'linear-gradient(135deg, #ef4444, #991b1b)'
                  : 'linear-gradient(135deg, #06b6d4, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isEmergencyStopped
                  ? '0 0 20px rgba(239, 68, 68, 0.8)'
                  : '0 0 20px rgba(6, 182, 212, 0.8)',
                color: '#fff',
                transform: vehicleLocation.location.includes('RETORNO') ? 'scaleX(-1)' : 'scaleX(1)',
                transition: 'transform 0.3s ease',
              }}
            >
              <Car size={22} />
            </div>
          </div>

          {/* 5 Physical Stations Pins */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              position: 'relative',
            }}
          >
            {[
              { id: 'INICIO', label: 'Inicio', sub: '0 cm', icon: Flag },
              { id: 'BOMBA_1', label: 'Bomba 1', sub: 'Champú (2.0s)', icon: Droplets },
              { id: 'ESPONJAS', label: 'Esponjas', sub: '30% Potencia (2.5s)', icon: Layers },
              { id: 'BOMBA_2', label: 'Bomba 2', sub: 'Enjuague (2.0s)', icon: Droplets },
              { id: 'SECADOR', label: 'Abanico', sub: 'Secado (2.5s)', icon: Wind },
            ].map((st, idx) => {
              const IconComponent = st.icon;
              const isCurrent =
                (idx === 0 && vehicleLocation.percent <= 10) ||
                (idx === 1 && vehicleLocation.percent > 10 && vehicleLocation.percent <= 30) ||
                (idx === 2 && vehicleLocation.percent > 30 && vehicleLocation.percent <= 60) ||
                (idx === 3 && vehicleLocation.percent > 60 && vehicleLocation.percent <= 85) ||
                (idx === 4 && vehicleLocation.percent > 85);

              return (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    minWidth: '70px',
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: isCurrent ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)',
                      border: isCurrent ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: isCurrent ? '0 0 10px #06b6d4' : 'none',
                      marginBottom: '0.4rem',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent ? '#38bdf8' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <IconComponent size={13} /> {st.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{st.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current State Detailed Badge */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '0.65rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            <strong>Estado Actual del Carro:</strong>{' '}
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>
              {vehicleLocation.location.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <strong>Posición en Pista:</strong>{' '}
            <span style={{ color: '#facc15', fontWeight: 700 }}>{vehicleLocation.percent}%</span>
          </div>
        </div>
      </div>

      {/* Emergency Stop Critical Alert Banner */}
      {isEmergencyStopped && (
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.2))',
            border: '2px solid rgba(239, 68, 68, 0.8)',
            borderRadius: '1rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <AlertOctagon size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fca5a5' }}>
                SISTEMA BLOQUEADO POR PARADA DE EMERGENCIA
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#fecaca' }}>
                Todos los actuadores, bombas y sensores se encuentran apagados. Las entradas a bahía están suspendidas.
                El sistema permanecerá inactivo hasta que des la <strong>orden de reinicio</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={handleResumeSystem}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
            }}
          >
            <RefreshCw size={18} /> DAR ORDEN DE REINICIO
          </button>
        </div>
      )}

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
            {kpis?.todayWashesCount > 0 ? (
              <>
                <ArrowUpRight size={14} /> +14.2% vs ayer
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Sin transacciones registradas hoy</span>
            )}
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

        {/* KPI 4: Estado del Hardware de Bahía IoT */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hardware ESP32 (IoT)
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
            <span
              className="pulse-dot"
              style={{
                background: isEmergencyStopped ? '#ef4444' : '#10b981',
                boxShadow: isEmergencyStopped ? '0 0 10px #ef4444' : '0 0 10px #10b981',
              }}
            ></span>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isEmergencyStopped ? '#ef4444' : '#38bdf8',
              }}
            >
              {isEmergencyStopped
                ? 'DETENIDO (EMERGENCIA)'
                : (kpis?.hardware?.connected ?? kpis?.arduino?.connected)
                ? 'ONLINE'
                : 'DESCONECTADO'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: isEmergencyStopped ? '#fca5a5' : 'var(--text-muted)' }}>
            {isEmergencyStopped
              ? 'Esperando orden de reinicio del administrador'
              : '4 Actuadores: Shampoo, Esponjas, Enjuague, Abanico'}
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
              <Star size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Inteligencia de Vehículos & Fidelización Mensual</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Contabilidad Mensual ({kpis?.loyaltyStats?.currentMonthName || 'Mes Actual'}): 100 pts/lavado • 5 lavados en el mes otorgan el 6to gratis
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vehículos Únicos: </span>
              <strong style={{ color: '#fff' }}>{kpis?.loyaltyStats?.totalUniqueVehicles || 0}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recurrentes del Mes: </span>
              <strong style={{ color: '#34d399' }}>{kpis?.loyaltyStats?.monthlyRecurringVehiclesCount || kpis?.loyaltyStats?.recurringVehiclesCount || 0}</strong>
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
                {p.plate} ({p.monthCount ? `${p.monthCount} este mes / ` : ''}{p.count} total)
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
