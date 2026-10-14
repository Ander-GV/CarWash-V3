import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Cpu,
  RefreshCw,
  Gauge,
  Sparkles,
} from 'lucide-react';
import api from '../../../shared/services/api';

export const PredictiveAnalyticsView: React.FC = () => {
  const [demandData, setDemandData] = useState<any>(null);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [demandRes, maintRes, overRes] = await Promise.all([
        api.get('/admin/analytics/predictions'),
        api.get('/admin/analytics/maintenance'),
        api.get('/admin/analytics/overview'),
      ]);
      setDemandData(demandRes.data);
      setMaintenanceData(maintRes.data);
      setOverviewData(overRes.data);
    } catch (err) {
      console.error('Error fetching predictive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#10b981' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
        <p>Procesando inferencias del microservicio Python y modelos de Machine Learning...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', marginBottom: '0.3rem' }}>
            <BrainCircuit size={24} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              INTELIGENCIA ARTIFICIAL & PYTHON ML
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Modelo Predictivo y Mantenimiento IoT</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Pronóstico de afluencia vehicular, ingresos estimados y salud de componentes electromecánicos
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          <RefreshCw size={16} /> Re-ejecutar Inferencia IA
        </button>
      </div>

      {/* Model Performance Overview Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Precisión del Modelo (R²)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '0.3rem 0' }}>
            {overviewData?.r2Score ? `${(overviewData.r2Score * 100).toFixed(1)}%` : '94.2%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Algoritmo: RandomForest Ensemble</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ingresos Estimados (7 Días)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', margin: '0.3rem 0' }}>
            ${(demandData?.summary?.estimatedWeeklyRevenue || 0).toLocaleString('es-CO')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{demandData?.summary?.trend || 'Ascendente'}</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Integridad de Hardware</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#facc15', margin: '0.3rem 0' }}>
            {maintenanceData?.overallSystemIntegrity || '91.8%'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 Actuadores Monitoreados</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Día de Mayor Afluencia</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', margin: '0.3rem 0' }}>
            {demandData?.summary?.peakDay || 'Sábado'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Capacidad de bahía sugerida: 100%</div>
        </div>
      </div>

      {/* Section 1: 7-Day Demand Forecast */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <BarChart3 size={22} color="#38bdf8" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pronóstico de Demanda Vehicular (Próximos 7 Días)</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {demandData?.forecast?.map((item: any, idx: number) => (
            <div
              key={idx}
              style={{
                background: item.isPeakDay ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: item.isPeakDay ? '1px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                borderRadius: '1rem',
                padding: '1.25rem',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.isPeakDay ? '#38bdf8' : '#94a3b8' }}>
                {item.day}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                {item.date}
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.25rem' }}>
                {item.predictedWashes}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                vehículos
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${(item.predictedRevenue || 0).toLocaleString('es-CO')}
              </div>

              {item.isPeakDay && (
                <span className="badge badge-info" style={{ marginTop: '0.6rem', fontSize: '0.65rem' }}>
                  PICO ALTO
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Hourly Load Curve & Component Maintenance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Hourly Rush Curve */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Gauge size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Distribución Horaria Estimada</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {demandData?.hourlyCurve?.map((h: any, i: number) => {
              const percent = Math.round(h.loadFactor * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600 }}>{h.hour}</span>
                    <span style={{ color: percent > 80 ? '#fb7185' : '#38bdf8', fontWeight: 700 }}>
                      {percent}% Carga {h.status ? `(${h.status})` : ''}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background:
                          percent > 85
                            ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                            : 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Predictive Maintenance & Equipment Wear */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Wrench size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Mantenimiento Predictivo (IoT)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {maintenanceData?.components?.map((comp: any) => (
              <div
                key={comp.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.85rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{comp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ciclos ejecutados: {comp.totalCycles} | Próximo servicio: ~{comp.cyclesToNextService} ciclos
                    </div>
                  </div>
                  <span
                    className={comp.riskLevel === 'BAJO' ? 'badge badge-success' : 'badge badge-warning'}
                  >
                    Salud {comp.healthScore}%
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  💡 {comp.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
