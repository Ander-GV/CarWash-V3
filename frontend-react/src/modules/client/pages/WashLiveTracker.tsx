import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Car,
  Droplets,
  Wind,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Gift,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { getSocket } from '../../../shared/services/socket';

interface WashStageInfo {
  key: string;
  label: string;
  description: string;
  icon: any;
  durationSec: number;
}

const WASH_STAGES_CONFIG: WashStageInfo[] = [
  {
    key: 'BARRIER_OPENED',
    label: 'Talanquera Abierta',
    description: 'Talanquera levantada por Arduino. Ingrese su vehículo a la bahía.',
    icon: Car,
    durationSec: 10,
  },
  {
    key: 'STAGE_SHAMPOO',
    label: 'Agua con Shampoo',
    description: 'Bomba activa: Aspersión de agua mezclada con champú biodegradable desengrasante.',
    icon: Droplets,
    durationSec: 18,
  },
  {
    key: 'STAGE_SPONGES',
    label: 'Esponjas Activas',
    description: 'Motor activo: Frotado suave con esponjas mecánicas para remover toda suciedad.',
    icon: Sparkles,
    durationSec: 22,
  },
  {
    key: 'STAGE_RINSE',
    label: 'Agua para Enjuagar',
    description: 'Bomba activa: Enjuague a presión con agua limpia para retirar restos de espuma.',
    icon: Droplets,
    durationSec: 20,
  },
  {
    key: 'STAGE_FAN_DRYING',
    label: 'Abanico de Secado',
    description: 'Turbina activa: Flujo de aire de alta velocidad eliminando gotas de la carrocería.',
    icon: Wind,
    durationSec: 25,
  },
  {
    key: 'STAGE_FINISHED',
    label: 'Lavado Completado',
    description: 'Talanquera de salida abierta. ¡Puntos acumulados con éxito! ¡Buen viaje!',
    icon: CheckCircle2,
    durationSec: 0,
  },
];

export const WashLiveTracker: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<string>('BARRIER_OPENED');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const response = await api.get(`/client/wash/${sessionId}/status`);
        setSession(response.data);
        if (response.data.stage) {
          setCurrentStage(response.data.stage);
        }
      } catch (err) {
        console.error('Error cargando estado:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const socket = getSocket();
    socket.emit('subscribe_session', { sessionId });

    socket.on('stage_updated', (data: any) => {
      if (data.sessionId === sessionId) {
        setCurrentStage(data.stage);
      }
    });

    socket.on('barrier_status', (data: any) => {
      if (data.sessionId === sessionId) {
        setCurrentStage('BARRIER_OPENED');
      }
    });

    return () => {
      socket.off('stage_updated');
      socket.off('barrier_status');
    };
  }, [sessionId]);

  const currentStageIndex = WASH_STAGES_CONFIG.findIndex(
    (s) => s.key === currentStage || (currentStage === 'PAYMENT_CONFIRMED' && s.key === 'BARRIER_OPENED')
  );

  const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;
  const progressPercent = Math.round(((activeIndex + 1) / WASH_STAGES_CONFIG.length) * 100);
  const isFinished = currentStage === 'STAGE_FINISHED';

  const activeStageConfig = WASH_STAGES_CONFIG[activeIndex] || WASH_STAGES_CONFIG[0];
  const ActiveIcon = activeStageConfig.icon;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#06b6d4' }}>
        <RefreshCw size={40} className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2>Sincronizando con Arduino...</h2>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Top Banner with Plate & Reward Status */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '2rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              background: '#facc15',
              color: '#0f172a',
              fontFamily: 'monospace',
              fontWeight: 900,
              fontSize: '1.5rem',
              letterSpacing: '0.1em',
              borderRadius: '8px',
              padding: '0.35rem 0.85rem',
              border: '2px solid #000',
            }}
          >
            {session?.licensePlate || 'VEHÍCULO'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                CAR WASH • Lavado Completo
              </h2>
              {session?.isFreeLoyaltyReward ? (
                <span className="badge badge-success" style={{ background: '#10b981', color: '#fff' }}>
                  <Gift size={14} /> ¡Lavado Gratis por Fidelidad!
                </span>
              ) : (
                <span className="badge badge-success">Pago Wompi Aprobado</span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Acumulaste <strong>+100 Puntos</strong> con esta visita
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="pulse-dot"></span>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            Arduino en Vivo (COM3)
          </span>
        </div>
      </div>

      {/* Main Stage Spotlight */}
      <div
        className="glass-panel neon-border"
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          marginBottom: '2.5rem',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            margin: '0 auto 1.5rem auto',
            borderRadius: '50%',
            background: isFinished
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isFinished
              ? '0 0 35px rgba(16, 185, 129, 0.6)'
              : '0 0 35px rgba(6, 182, 212, 0.6)',
            animation: isFinished ? 'none' : 'float 3s ease-in-out infinite',
          }}
        >
          <ActiveIcon size={56} color="#ffffff" />
        </div>

        <div className="badge badge-info" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          FASE {activeIndex + 1} DE {WASH_STAGES_CONFIG.length}
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
          {activeStageConfig.label}
        </h1>

        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            maxWidth: '650px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.6,
          }}
        >
          {activeStageConfig.description}
        </p>

        {/* Progress Bar */}
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Progreso del Ciclo</span>
            <span style={{ color: 'var(--primary-cyan)' }}>{progressPercent}%</span>
          </div>

          <div
            style={{
              height: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '9999px',
              overflow: 'hidden',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'var(--grad-primary)',
                borderRadius: '9999px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)',
              }}
            />
          </div>
        </div>

        {isFinished && (
          <div style={{ marginTop: '2.5rem' }}>
            <Link to="/" className="btn-primary" style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem' }}>
              <CheckCircle2 size={18} /> Iniciar Siguiente Vehículo
            </Link>
          </div>
        )}
      </div>

      {/* Hardware Actuators Timeline */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          Secuencia de Actuadores del Autolavado
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {WASH_STAGES_CONFIG.map((step, idx) => {
            const isCompleted = idx < activeIndex || isFinished;
            const isCurrent = idx === activeIndex && !isFinished;
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                style={{
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  background: isCurrent
                    ? 'rgba(6, 182, 212, 0.12)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isCurrent
                    ? '1px solid var(--primary-cyan)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isCurrent
                        ? 'var(--primary-cyan)'
                        : isCompleted
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    <StepIcon size={16} />
                  </div>
                  {isCompleted ? (
                    <span className="badge badge-success">OK</span>
                  ) : isCurrent ? (
                    <span className="badge badge-info">ACTIVO</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>En espera</span>
                  )}
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {step.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {step.durationSec > 0 ? `~${step.durationSec} seg` : 'Salida'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
