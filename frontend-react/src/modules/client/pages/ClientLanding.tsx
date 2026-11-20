import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Droplets,
  Wind,
  Car,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Activity,
  Award,
  Leaf,
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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

  const handleQuickPlate = (plate: string) => {
    setLicensePlate(plate);
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
        alert(
          'FELICITACIONES: Has completado los 5 lavados requeridos con esta placa. Este ciclo es totalmente gratis. La talanquera se abrira enseguida.'
        );
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

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: '¿Cómo funciona la apertura automática de la talanquera?',
      a: 'Una vez que apruebas tu pago a través de Wompi (Nequi, Daviplata, PSE o Tarjetas) o canjeas tu lavado gratis, nuestro controlador IoT levanta la talanquera de acceso en 1 segundo y te guía hacia la bahía.',
    },
    {
      q: '¿Cómo acumulo puntos para el lavado GRATIS?',
      a: 'Cada vez que ingresas tu placa colombiana en este kiosco o en la web, el sistema registra tu visita. Al acumular 5 lavados, tu sexto lavado es 100% de regalo sin pagar un solo peso.',
    },
    {
      q: '¿Las esponjas pueden rayar la pintura de mi auto?',
      a: 'No. Utilizamos rodillos de microfibra de celulosa Soft-Touch de última generación que se lubrican constantemente con espuma activa y agua a presión, garantizando un acabado brillante y cero rayones.',
    },
    {
      q: '¿Cuánto tiempo dura el ciclo completo de lavado?',
      a: 'El ciclo completo (espuma activa + esponjas suaves + enjuague hidro-jet a 180 Bar + secado por turbina AeroDry) toma exactamente 4 minutos cronometrados.',
    },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 75px)', position: 'relative', overflow: 'hidden' }}>
      {/* Luces Ambientales de Fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div className="app-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        {/* Live Bay Telemetry Status Pill */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.45rem 1.25rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
            }}
          >
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.04em' }}>
              BAHÍA AUTOMATIZADA: DISPONIBLE • TIEMPO DE LAVADO: 4 MINUTOS • ACCESO INMEDIATO
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto 2.5rem auto' }}>
          {/* Official CAR WASH Hero Banner */}
          <div
            className="animate-float"
            style={{
              maxWidth: '540px',
              margin: '0 auto 1.5rem auto',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(6, 182, 212, 0.35)',
            }}
          >
            <img
              src="/carwash-branding.jpg"
              alt="CAR WASH"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            AUTOLAVADO INTELIGENTE DE{' '}
            <span style={{ color: '#38bdf8' }}>
              NUEVA GENERACIÓN
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '720px',
              margin: '0 auto 2rem auto',
            }}
          >
            Tu vehículo reluciente e impecable en solo <strong>4 minutos</strong>. Digita tu placa para acumular{' '}
            <strong style={{ color: '#38bdf8' }}>Puntos de Fidelidad</strong>. Paga al instante con{' '}
            <strong style={{ color: '#f59e0b' }}>Wompi</strong> y la talanquera se levantará automáticamente.
          </p>

          {/* Placa y Tarjeta de Fidelidad Interactiva */}
          <div
            className="glass-panel"
            style={{
              padding: '1.75rem',
              maxWidth: '720px',
              margin: '0 auto 2.5rem auto',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 20px 45px rgba(6, 182, 212, 0.25)',
              position: 'relative',
            }}
          >
            {/* Quick Demo Plates Pills */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Placas de prueba:</span>
              <button
                type="button"
                className="plate-quick-btn"
                onClick={() => handleQuickPlate('KLO-892')}
              >
                KLO-892 (3 visitas)
              </button>
              <button
                type="button"
                className="plate-quick-btn"
                onClick={() => handleQuickPlate('MED-775')}
                style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: '#34d399' }}
              >
                MED-775 (¡5 visitas - GRATIS!)
              </button>
              <button
                type="button"
                className="plate-quick-btn"
                onClick={() => handleQuickPlate('BOG-101')}
              >
                BOG-101 (Nueva)
              </button>
            </div>

            {/* Input Terminal with Colombian Plate Badge */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={24} color="#38bdf8" />
                <label style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                  DIGITA TU PLACA:
                </label>
              </div>

              {/* Colombian License Plate Badge */}
              <div
                style={{
                  background: '#facc15',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: '1.6rem',
                  letterSpacing: '0.12em',
                  borderRadius: '10px',
                  padding: '0.35rem 0.85rem',
                  border: '2.5px solid #000',
                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.4), 0 4px 15px rgba(250, 204, 21, 0.4)',
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
                    fontSize: '1.6rem',
                    letterSpacing: '0.12em',
                    width: '145px',
                    textAlign: 'center',
                  }}
                />
              </div>

              <button
                onClick={handleStartWash}
                disabled={isInitiating}
                className="btn-primary"
                style={{
                  padding: '0.9rem 1.9rem',
                  fontSize: '1.05rem',
                  background: loyaltyInfo?.isNextWashFree
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : undefined,
                  boxShadow: loyaltyInfo?.isNextWashFree
                    ? '0 0 25px rgba(16, 185, 129, 0.6)'
                    : undefined,
                }}
              >
                <Zap size={18} />
                {isInitiating
                  ? 'Conectando...'
                  : loyaltyInfo?.isNextWashFree
                  ? '¡Reclamar Lavado GRATIS!'
                  : 'Tocar para Iniciar Lavado'}
              </button>
            </div>

            {/* Monthly Loyalty Punch Card Status */}
            <div
              style={{
                background: loyaltyInfo?.isNextWashFree
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1rem',
                padding: '1.25rem 1.5rem',
                border: loyaltyInfo?.isNextWashFree
                  ? '1.5px solid rgba(16, 185, 129, 0.5)'
                  : '1px dashed rgba(255, 255, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: loyaltyInfo?.isNextWashFree
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Gift
                    size={24}
                    color={loyaltyInfo?.isNextWashFree ? '#34d399' : '#f59e0b'}
                  />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '9999px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Fidelidad Mensual • {loyaltyInfo?.currentMonthName || 'Mes Actual'}
                    </span>
                    {loyaltyInfo?.allTimeApprovedWashes && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        ({loyaltyInfo.allTimeApprovedWashes} lavados históricos • {loyaltyInfo.pointsEarned} pts)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    {loyaltyInfo?.isNextWashFree ? (
                      <span style={{ color: '#34d399' }}>
                        LAVADO DE REGALO DISPONIBLE EN {loyaltyInfo?.currentMonthName?.toUpperCase() || 'ESTE MES'}
                      </span>
                    ) : (loyaltyInfo?.monthApprovedWashes ?? loyaltyInfo?.totalApprovedWashes) > 0 ? (
                      `Vehículo Recurrente: ${loyaltyInfo.monthApprovedWashes ?? loyaltyInfo.totalApprovedWashes} de 5 lavados en ${loyaltyInfo.currentMonthName || 'este mes'}`
                    ) : (
                      'Contabilidad Mensual: Lava 5 veces este mes y el 6to es GRATIS'
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {loyaltyInfo?.isNextWashFree
                      ? '¡Has completado los 5 lavados del mes con esta placa! Tu siguiente lavado se procesará sin costo.'
                      : `Te faltan ${loyaltyInfo?.washesUntilNextFree || 5} lavados en ${loyaltyInfo?.currentMonthName || 'este mes'} para tu lavado gratis. La contabilidad se renueva cada mes.`}
                  </div>
                </div>
              </div>

              {/* Punch card stamp indicators (5 mensual + 6to Gratis) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginRight: '0.2rem' }}>
                  Meta del Mes:
                </span>
                {[1, 2, 3, 4, 5].map((num) => {
                  const currentMonthCount = loyaltyInfo?.monthApprovedWashes ?? loyaltyInfo?.totalApprovedWashes ?? 0;
                  const isStamped = currentMonthCount >= num || loyaltyInfo?.isNextWashFree;

                  return (
                    <div
                      key={num}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isStamped
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'rgba(255, 255, 255, 0.08)',
                        border: isStamped
                          ? '1.5px solid #34d399'
                          : '1px solid rgba(255,255,255,0.15)',
                        boxShadow: isStamped ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        color: isStamped ? '#fff' : 'var(--text-dim)',
                        transition: 'all 0.3s ease',
                      }}
                      title={`Lavado #${num} en ${loyaltyInfo?.currentMonthName || 'el mes'}`}
                    >
                      {isStamped ? '✓' : num}
                    </div>
                  );
                })}
                <div
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '0.5rem',
                    background: loyaltyInfo?.isNextWashFree ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                    border: loyaltyInfo?.isNextWashFree ? '1px solid #10b981' : '1px dashed rgba(245, 158, 11, 0.4)',
                    color: loyaltyInfo?.isNextWashFree ? '#34d399' : '#f59e0b',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  6to: GRATIS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Master Single Wash Display (Un solo tipo de lavado) */}
        <div style={{ maxWidth: '900px', margin: '0 auto 3.5rem auto' }}>
          <div
            onClick={handleStartWash}
            className="glass-panel neon-border card-hover-glow"
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
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--grad-primary)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '0.4rem 1.5rem',
                borderRadius: '9999px',
                letterSpacing: '0.06em',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.6)',
              }}
            >
              PROCESO COMPLETO AUTOMATIZADO • 4 ETAPAS
            </div>

            <div style={{ marginBottom: '1.25rem', marginTop: '0.5rem' }}>
              <span
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 900,
                  color: '#ffffff',
                }}
              >
                $20.000
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginLeft: '0.5rem' }}>
                COP / ciclo integral
              </span>
            </div>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '1rem',
                maxWidth: '650px',
                margin: '0 auto 2.25rem auto',
                lineHeight: 1.5,
              }}
            >
              Un único proceso estandarizado de máxima eficiencia sincronizado por nuestro sistema de
              automatización industrial:
            </p>

            {/* 4 Hardware Components in Flow */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                className="card-hover-glow"
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                  }}
                >
                  <Droplets size={24} color="#38bdf8" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#f8fafc' }}>
                  1. Espuma Activa
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Shampoo biodegradable pH neutro desengrasante
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                className="card-hover-glow"
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                  }}
                >
                  <Sparkles size={24} color="#60a5fa" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#f8fafc' }}>
                  2. Esponjas Suaves
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Microfibras Soft-Touch que no rayan la pintura
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                className="card-hover-glow"
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                  }}
                >
                  <Droplets size={24} color="#34d399" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#f8fafc' }}>
                  3. Enjuague Hidro-Jet
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Agua desionizada a 180 Bar para desalojo total
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
                className="card-hover-glow"
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'rgba(139, 92, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                  }}
                >
                  <Wind size={24} color="#c084fc" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem', color: '#f8fafc' }}>
                  4. Secado AeroDry
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Turbina ciclónica de alta velocidad sin marcas
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{
                padding: '1.1rem 2.8rem',
                fontSize: '1.15rem',
                boxShadow: '0 12px 35px rgba(6, 182, 212, 0.5)',
              }}
            >
              <span>Presiona aquí para Pagar con Wompi</span>
              <ArrowRight size={20} />
            </button>

            {/* Wompi trust seal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                marginTop: '1.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span>Pasarela Segura Bancolombia Wompi</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={16} color="#38bdf8" />
                <span>Nequi • Daviplata • Tarjetas • PSE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits & Value Proposition Section */}
        <div style={{ maxWidth: '1100px', margin: '0 auto 4rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>¿Por qué lavar en CAR WASH?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Diseñado para dueños exigentes que valoran su tiempo, la pintura de su vehículo y el medio ambiente.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Clock size={22} color="#38bdf8" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>4 Minutos de Inicio a Fin</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Sin filas innecesarias ni esperas de horas. Ingresas con tu vehículo, disfrutas el espectáculo de
                luces y sales reluciente.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Leaf size={22} color="#34d399" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>75% Ahorro Ecológico</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Nuestra planta de reciclaje y filtración química reduce el desperdicio de agua potable en comparación
                con el lavado tradicional de manguera.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <ShieldCheck size={22} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Protección Cerámica</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Shampoos con polímeros protectores que sellan los microporos de la laca contra rayos UV, lluvia ácida y
                polvo vial.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Award size={22} color="#f59e0b" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Recompensas de Fidelidad</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Sin tarjetas físicas ni registros engorrosos. Solo con digitar tu placa acumulas visitas para tu próximo
                lavado gratis.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Section */}
        <div style={{ maxWidth: '820px', margin: '0 auto 2rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Preguntas Frecuentes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Todo lo que necesitas saber antes de ingresar a nuestra bahía automatizada
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    overflow: 'hidden',
                    borderColor: isOpen ? 'var(--primary-cyan)' : undefined,
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '1.25rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={20} color="#38bdf8" /> : <ChevronDown size={20} color="#94a3b8" />}
                  </button>

                  {isOpen && (
                    <div
                      className="animate-slide-up"
                      style={{
                        padding: '0 1.5rem 1.25rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        borderTop: '1px solid var(--border-glass)',
                        paddingTop: '0.85rem',
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
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

export default ClientLanding;
