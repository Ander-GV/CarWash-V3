import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, X, Sparkles, ExternalLink } from 'lucide-react';
import api from '../../../shared/services/api';

interface WompiModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    sessionId: string;
    licensePlate: string;
    plan: string;
    amount: number;
    wompiConfig: {
      publicKey: string;
      currency: string;
      amountInCents: number;
      reference: string;
      signature: {
        integrity: string;
      };
      redirectUrl: string;
    };
  } | null;
  onPaymentSuccess: (sessionId: string) => void;
}

export const WompiCheckoutModal: React.FC<WompiModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !sessionData) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      // Llamada al endpoint de simulación de pago Wompi del backend
      const response = await api.post(`/payments/simulate-success/${sessionData.sessionId}`);
      if (response.data.success) {
        onPaymentSuccess(sessionData.sessionId);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error al procesar pago con Wompi');
    } finally {
      setIsProcessing(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(sessionData.amount);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(6, 182, 212, 0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                color: '#fff',
                fontSize: '1rem',
              }}
            >
              W
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#f8fafc' }}>
                Pasarela de Pagos Wompi
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bancolombia • Nequi • PSE • Tarjetas
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div style={{ padding: '1.5rem' }}>
          {/* Resumen de Orden */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              borderRadius: '0.85rem',
              padding: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Vehículo:</span>
              <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary-cyan)' }}>
                {sessionData.licensePlate}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Paquete Seleccionado:</span>
              <span style={{ fontWeight: 600 }}>{sessionData.plan}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Referencia Wompi:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                {sessionData.wompiConfig.reference}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                marginTop: '0.5rem',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total a Pagar:</span>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: 'var(--accent-emerald)',
                }}
              >
                {formattedAmount}
              </span>
            </div>
          </div>

          {/* Sello de Seguridad SHA-256 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '0.65rem',
              fontSize: '0.75rem',
              color: '#6ee7b7',
              marginBottom: '1.25rem',
            }}
          >
            <ShieldCheck size={18} />
            <div>
              Firma de Integridad SHA-256 Wompi calculada y validada por Backend NestJS.
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#fb7185',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          {/* Opciones de Pago */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Botón de Simulación Sandbox de Wompi */}
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 20px -4px rgba(16, 185, 129, 0.5)',
              }}
            >
              <CheckCircle2 size={20} />
              {isProcessing
                ? 'Conectando con Arduino y autorizando...'
                : 'Aprobar Pago Inmediato (Sandbox / Kiosco)'}
            </button>

            {/* Simulación con Redirección oficial Wompi */}
            <button
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.875rem',
                justifyContent: 'center',
              }}
            >
              <CreditCard size={18} /> Pagar con Tarjeta Crédito / Nequi / PSE (Wompi Widget)
            </button>
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
              marginTop: '1.25rem',
            }}
          >
            Al confirmar el pago, la talanquera de acceso se levantará automáticamente mediante el
            microcontrolador Arduino.
          </div>
        </div>
      </div>
    </div>
  );
};
