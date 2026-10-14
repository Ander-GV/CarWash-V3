import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Droplets,
  Wind,
  Car,
  Gift,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Timer,
} from 'lucide-react';
import api from '../../../shared/services/api';
import { WompiCheckoutModal } from '../components/WompiCheckoutModal';

export const ClientLanding: React.FC = () => {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState('KLO-892');
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  // Consultar fidelidad y puntos automáticamente cuando la placa tiene 6-7 caracteres
  useEffect(() => {
    if (licensePlate.length >= 6) {
      const fetchLoyalty = async () => {
        try {
          const res = await api.get(`/client/wash/loyalty/${licensePlate}`);
          setLoyaltyInfo(res.data);
        } catch {
          setLoyaltyInfo(null);
        }
      };
      fetchLoyalty();
    } else {
      setLoyaltyInfo(null);
    }
  }, [licensePlate]);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (val.length === 3 && !val.includes('-')) {
      val = val + '-';
    }
    setLicensePlate(val.slice(0, 7));
  };

  const handleStartWash = async () => {
    if (!licensePlate || licensePlate.length < 3) {
      alert('Por favor ingresa la placa de tu vehículo');
      return;
    }

    setIsInitiating(true);
    try {
      const response = await api.post('/client/wash/initiate', {
        licensePlate,
      });

      const data = response.data;

      // Si el cliente se ganó el lavado GRATIS por acumular puntos de fidelidad
      if (data.isFreeReward) {
        alert('🎉 ¡FELICITACIONES! Has acumulado 5 lavados con esta placa. ¡Este lavado te sale TOTALMENTE GRATIS! La talanquera se abrirá enseguida.');
        navigate(`/tracker/${data.sessionId}`);
        return;
      }

      // De lo contrario, abrir la pasarela Wompi
      setSessionData({
        sessionId: data.sessionId,
        licensePlate: data.session.licensePlate,
        plan: data.session.plan,
        amount: Number(data.session.amount),
        wompiConfig: data.wompiConfig,
      });
      setModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al conectar con el servidor');
    } finally {
      setIsInitiating(false);
    }
  };

  const handlePaymentApproved = (sessionId: string) => {
    setModalOpen(false);
    navigate(`/tracker/${sessionId}`);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 75px)', position: 'relative', overflow: 'hidden' }}>
      {/* Luces de fondo ambientales */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '25%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div className="app-container" style={{ paddingTop: '2rem', paddingBottom: '3.5rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem auto' }}>
          {/* Official CAR WASH Hero Banner */}
          <div
            className="animate-float"
            style={{
              maxWidth: '540px',
              margin: '0 auto 1.75rem auto',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(6, 182, 212, 0.35)',
            }}
          >
            <img
              src="/carwash-branding.jpg"
              alt="CAR WASH"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div
            className="badge badge-info"
            style={{ marginBottom: '1rem', padding: '0.45rem 1.25rem', fontSize: '0.85rem', letterSpacing: '0.08em' }}
          >
            <Sparkles size={16} /> AUTOLAVADO AUTOMATIZADO • 100% SEGURO
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}
          >
            BIENVENIDO A{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CAR WASH
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Tu vehículo impecable en 4 minutos. Digita tu placa para acumular <strong>Puntos de Fidelidad</strong>.
            Paga en un toque con <strong>Wompi</strong> y la talanquera se levantará automáticamente.
          </p>

          {/* Placa y Tarjeta de Fidelidad Interactiva */}
          <div
            className="glass-panel"
            style={{
              padding: '1.5rem',
              maxWidth: '680px',
              margin: '0 auto 2rem auto',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 15px 35px rgba(6, 182, 212, 0.25)',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={24} color="#38bdf8" />
                <label style={{ fontWeight: 800, fontSize: '0.95rem' }}>INGRESA TU PLACA:</label>
              </div>

              {/* Colombian License Plate Badge */}
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
                  boxShadow: 'inset 0 0 5px rgba(0,0,0,0.4)',
                }}
              >
                <input
                  type="text"
                  value={licensePlate}
                  onChange={handlePlateChange}
                  placeholder="AAA-123"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#0f172a',
                    fontFamily: 'monospace',
                    fontWeight: 900,
                    fontSize: '1.5rem',
                    letterSpacing: '0.1em',
                    width: '135px',
                    textAlign: 'center',
                  }}
                />
              </div>

              <button
                onClick={handleStartWash}
                disabled={isInitiating}
                className="btn-primary"
                style={{
                  padding: '0.9rem 1.8rem',
                  fontSize: '1.05rem',
                  background: loyaltyInfo?.isNextWashFree
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : undefined,
                }}
              >
                <Zap size={18} />
                {isInitiating
                  ? 'Conectando...'
                  : loyaltyInfo?.isNextWashFree
                  ? '¡Reclamar Lavado GRATIS!'
                  : 'Tocar Pantalla para Pagar'}
              </button>
            </div>

            {/* Loyalty Punch Card Status */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.85rem',
                padding: '0.85rem 1.25rem',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Gift size={20} color="#f59e0b" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {loyaltyInfo?.isNextWashFree ? (
                      <span style={{ color: '#34d399' }}>🎉 ¡TIENES UN LAVADO GRATIS DISPONIBLE!</span>
                    ) : loyaltyInfo?.totalApprovedWashes > 0 ? (
                      `Vehículo Recurrente: ${loyaltyInfo.totalApprovedWashes} lavados registrados (${loyaltyInfo.pointsEarned} pts)`
                    ) : (
                      '⭐ Sistema de Fidelidad: Acumula 5 lavados y el 6to es GRATIS'
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {loyaltyInfo?.isNextWashFree
                      ? 'Has completado los 5 lavados requeridos con esta placa.'
                      : `Te faltan ${loyaltyInfo?.washesUntilNextFree || 5} lavados para tu próximo lavado de regalo.`}
                  </div>
                </div>
              </div>

              {/* Punch card stamp indicators */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[1, 2, 3, 4, 5].map((num) => {
                  const isStamped = loyaltyInfo?.totalApprovedWashes
                    ? (loyaltyInfo.totalApprovedWashes % 5) >= num || loyaltyInfo.isNextWashFree
                    : false;

                  return (
                    <div
                      key={num}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isStamped ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                        border: isStamped ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: isStamped ? '#fff' : 'var(--text-dim)',
                      }}
                    >
                      {isStamped ? '✓' : num}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Master Single Wash Display (Un solo tipo de lavado) */}
        <div style={{ maxWidth: '850px', margin: '0 auto 3rem auto' }}>
          <div
            onClick={handleStartWash}
            className="glass-panel neon-border"
            style={{
              padding: '2.5rem',
              cursor: 'pointer',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--grad-primary)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '0.35rem 1.25rem',
                borderRadius: '9999px',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.6)',
              }}
            >
              LAVADO COMPLETO AUTOMATIZADO
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 900, color: '#ffffff' }}>
                $20.000
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '0.5rem' }}>
                COP / ciclo integral
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
              Un único proceso automatizado con los 4 componentes físicos del autolavado sincronizados por Arduino:
            </p>

            {/* 4 Hardware Components in Flow */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem 0.85rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <Droplets size={22} color="#38bdf8" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>1. Agua + Shampoo</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Espuma activa de alta penetración</div>
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem 0.85rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <Sparkles size={22} color="#60a5fa" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>2. Esponjas Suaves</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frotado mecánico de carrocería</div>
              </div>

              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem 0.85rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <Droplets size={22} color="#34d399" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>3. Agua pa' Enjuagar</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aclarado a presión con agua limpia</div>
              </div>

              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem 0.85rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                  <Wind size={22} color="#c084fc" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>4. Abanico Secador</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Turbina de secado por aire</div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{
                padding: '1rem 2.5rem',
                fontSize: '1.15rem',
                boxShadow: '0 10px 30px rgba(6, 182, 212, 0.5)',
              }}
            >
              <span>Presiona aquí para Pagar con Wompi</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Wompi */}
      <WompiCheckoutModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sessionData={sessionData}
        onPaymentSuccess={handlePaymentApproved}
      />
    </div>
  );
};
