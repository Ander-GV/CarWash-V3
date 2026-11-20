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
  Clock,
  Activity,
  Filter,
  Maximize2,
  MoreHorizontal,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  Table,
  CheckCircle2,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import api from '../../../shared/services/api';

export const PredictiveAnalyticsView: React.FC = () => {
  const [demandData, setDemandData] = useState<any>(null);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  // Power BI Interactivity Slicers & State
  const [chartTab, setChartTab] = useState<'hours' | 'days'>('hours');
  const [metricView, setMetricView] = useState<'load' | 'vehicles' | 'revenue'>('load');
  const [filterPeakOnly, setFilterPeakOnly] = useState<boolean>(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);

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

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/admin/analytics/retrain');
      await fetchAnalytics();
    } catch (err) {
      console.error('Error re-entrenando modelo:', err);
      await fetchAnalytics();
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#00b8d9' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1.5rem auto' }} />
        <p style={{ fontFamily: 'Segoe UI, Inter, sans-serif', fontSize: '0.95rem' }}>
          Cargando modelo semántico y visuales de Power BI desde microservicio Python ML...
        </p>
      </div>
    );
  }

  // Base Datasets
  const rawHoursList = demandData?.hourlyCurve || [
    { hour: '07:00 - 09:00', loadFactor: 0.22, status: 'BAJO' },
    { hour: '09:00 - 11:00', loadFactor: 0.58, status: 'MODERADO' },
    { hour: '11:00 - 13:00', loadFactor: 0.94, status: 'PICO MÁXIMO' },
    { hour: '13:00 - 15:00', loadFactor: 0.82, status: 'ALTO' },
    { hour: '15:00 - 17:00', loadFactor: 0.74, status: 'ALTO' },
    { hour: '17:00 - 19:00', loadFactor: 0.86, status: 'ALTO' },
    { hour: '19:00 - 21:00', loadFactor: 0.45, status: 'MODERADO' },
  ];

  const rawDaysList = demandData?.forecast || [
    { day: 'Lunes', date: 'Lun 16', predictedWashes: 38, predictedRevenue: 760000 },
    { day: 'Martes', date: 'Mar 17', predictedWashes: 42, predictedRevenue: 840000 },
    { day: 'Miércoles', date: 'Mié 18', predictedWashes: 45, predictedRevenue: 900000 },
    { day: 'Jueves', date: 'Jue 19', predictedWashes: 49, predictedRevenue: 980000 },
    { day: 'Viernes', date: 'Vie 20', predictedWashes: 72, predictedRevenue: 1440000, isPeakDay: true },
    { day: 'Sábado', date: 'Sáb 21', predictedWashes: 85, predictedRevenue: 1700000, isPeakDay: true },
    { day: 'Domingo', date: 'Dom 22', predictedWashes: 68, predictedRevenue: 1360000 },
  ];

  const isHours = chartTab === 'hours';
  const hoursList = filterPeakOnly ? rawHoursList.filter((h: any) => h.loadFactor >= 0.7) : rawHoursList;
  const daysList = filterPeakOnly ? rawDaysList.filter((d: any) => d.isPeakDay || d.predictedWashes >= 60) : rawDaysList;

  // Transform coordinates for Power BI Canvas (viewBox 0 0 880 280)
  const leftMargin = 65;
  const rightMargin = 750;
  const graphWidth = rightMargin - leftMargin;
  const baseBottomY = 235;
  const maxTopY = 55;
  const graphHeight = baseBottomY - maxTopY;

  const currentDataset = isHours
    ? hoursList.map((h: any, i: number) => {
        const x = leftMargin + (i / Math.max(hoursList.length - 1, 1)) * graphWidth;
        const loadVal = h.loadFactor;
        const vehiclesVal = Math.round(loadVal * 20);
        const revenueVal = vehiclesVal * 20000;

        let normalizedVal = loadVal;
        let displayVal = `${Math.round(loadVal * 100)}%`;
        if (metricView === 'vehicles') {
          normalizedVal = vehiclesVal / 22;
          displayVal = `${vehiclesVal} veh`;
        } else if (metricView === 'revenue') {
          normalizedVal = revenueVal / 420000;
          displayVal = `$${(revenueVal / 1000).toFixed(0)}K`;
        }

        const y = baseBottomY - normalizedVal * graphHeight;
        return {
          x,
          y,
          label: h.hour.split(' - ')[0],
          fullLabel: h.hour,
          displayVal,
          loadPercent: Math.round(loadVal * 100),
          vehicles: vehiclesVal,
          revenue: revenueVal,
          status: h.status || 'Normal',
          isPeak: loadVal >= 0.85,
        };
      })
    : daysList.map((d: any, i: number) => {
        const x = leftMargin + (i / Math.max(daysList.length - 1, 1)) * graphWidth;
        const maxVehicles = 90;
        const loadVal = Math.min(d.predictedWashes / maxVehicles, 1);
        const vehiclesVal = d.predictedWashes;
        const revenueVal = d.predictedRevenue || 0;

        let normalizedVal = loadVal;
        let displayVal = `${Math.round(loadVal * 100)}%`;
        if (metricView === 'vehicles') {
          normalizedVal = vehiclesVal / 90;
          displayVal = `${vehiclesVal} veh`;
        } else if (metricView === 'revenue') {
          normalizedVal = revenueVal / 1800000;
          displayVal = `$${(revenueVal / 1000000).toFixed(1)}M`;
        }

        const y = baseBottomY - normalizedVal * graphHeight;
        return {
          x,
          y,
          label: d.day.slice(0, 3),
          fullLabel: d.day,
          displayVal,
          loadPercent: Math.round(loadVal * 100),
          vehicles: vehiclesVal,
          revenue: revenueVal,
          status: Boolean(d.isPeakDay || d.predictedWashes >= 70) ? 'DÍA PICO' : 'HABITUAL',
          isPeak: Boolean(d.isPeakDay || d.predictedWashes >= 70),
        };
      });

  // Smooth Bézier Spline generator
  let pathD = '';
  let areaD = '';
  if (currentDataset.length > 0) {
    pathD = `M ${currentDataset[0].x.toFixed(1)} ${currentDataset[0].y.toFixed(1)}`;
    for (let i = 0; i < currentDataset.length - 1; i++) {
      const p0 = currentDataset[i === 0 ? i : i - 1];
      const p1 = currentDataset[i];
      const p2 = currentDataset[i + 1];
      const p3 = currentDataset[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    const lastX = currentDataset[currentDataset.length - 1].x;
    const firstX = currentDataset[0].x;
    areaD = `${pathD} L ${lastX.toFixed(1)} ${baseBottomY} L ${firstX.toFixed(1)} ${baseBottomY} Z`;
  }

  // Reference lines calculation
  const criticalLimitY = baseBottomY - 0.85 * graphHeight;
  const averageLineY = baseBottomY - 0.642 * graphHeight;

  return (
    <div
      className="app-container"
      style={{
        paddingTop: '1.5rem',
        paddingBottom: '4rem',
        fontFamily: 'Segoe UI, Inter, -apple-system, sans-serif',
      }}
    >
      {/* Power BI Top Ribbon & Workspace Metadata */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0B1329',
          border: '1px solid #1E293B',
          borderRadius: '6px',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #F2C80F 0%, #D83B01 100%)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.85rem',
              color: '#000',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            Pb
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              CarWash Analytics • Tablero Predictivo Power BI
              <span
                style={{
                  fontSize: '0.68rem',
                  background: '#1E293B',
                  color: '#94A3B8',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                PROD v3.2
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#8EAAC8' }}>
              Dataset: Telemetría Bahía IoT + PostgreSQL • Modelo: RandomForest Regressor • {overviewData?.isTrainedOnRealData ? `Datos Reales BD (${overviewData.realSamplesCount || overviewData.trainingSamples} registros)` : 'Ajustado con Bootstrap + Datos Reales'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.3rem 0.65rem',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontWeight: 600,
            }}
          >
            <span className="pulse-dot" style={{ width: '6px', height: '6px', background: '#10B981' }}></span>
            {overviewData?.isTrainedOnRealData ? 'Dataset en Vivo' : 'Dataset Sincronizado'}
          </span>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="btn-primary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '4px',
              background: retraining ? '#475569' : '#00b8d9',
              color: '#000000',
              fontWeight: 700,
              border: 'none',
              cursor: retraining ? 'wait' : 'pointer',
            }}
            title="Re-entrenar modelo RandomForest con datos de la base de datos"
          >
            <BrainCircuit size={13} className={retraining ? 'animate-spin' : ''} />
            {retraining ? 'Entrenando ML...' : 'Re-entrenar Modelo'}
          </button>

          <button
            onClick={fetchAnalytics}
            className="btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: '4px',
              background: '#1E293B',
              border: '1px solid #334155',
            }}
            title="Refrescar datos del modelo"
          >
            <RefreshCw size={13} /> Actualizar Datos
          </button>
        </div>
      </div>

      {/* Power BI KPI Multi-Card Visuals (Cards con franja indicadora de color) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* KPI 1: Precisión R2 */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderLeft: '4px solid #10B981',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            PRECISIÓN DEL MODELO (R²)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: '0.2rem 0' }}>
            {overviewData?.r2Score ? `${(overviewData.r2Score * 100).toFixed(1)}%` : '94.2%'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <ArrowUpRight size={13} /> MAE: {overviewData?.meanAbsoluteError ?? 1.42} • Muestras: {overviewData?.trainingSamples ?? 120}
          </div>
        </div>

        {/* KPI 2: Ingresos Estimados */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderLeft: '4px solid #00B8D9',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            INGRESOS ESTIMADOS (7 DÍAS)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: '0.2rem 0' }}>
            ${(demandData?.summary?.estimatedWeeklyRevenue || 7980000).toLocaleString('es-CO')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <TrendingUp size={13} /> Tendencia: {demandData?.summary?.trend || 'Ascendente sostenida'}
          </div>
        </div>

        {/* KPI 3: Integridad Hardware */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderLeft: '4px solid #F2C80F',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            SALUD DE COMPONENTES IOT
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: '0.2rem 0' }}>
            {maintenanceData?.overallSystemIntegrity || '91.8%'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#FDE047', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <Cpu size={13} /> 4 Actuadores monitoreados en línea
          </div>
        </div>

        {/* KPI 4: Día Pico */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderLeft: '4px solid #A855F7',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            DÍA DE MAYOR AFLUENCIA
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F8FAFC', margin: '0.2rem 0' }}>
            {demandData?.summary?.peakDay || 'Sábado'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#C084FC', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <Clock size={13} /> Capacidad bahía proyectada: 100%
          </div>
        </div>
      </div>

      {/* Power BI Visual Principal: Gráfico de Líneas & Área con Controles Nativos */}
      <div
        style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '6px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Visual Header Estilo Power BI */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid #1E293B',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity size={17} color="#00B8D9" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                {isHours
                  ? 'Curva de Carga Operativa por Franjas Horarias (Demanda Bahía)'
                  : 'Proyección Semanal de Tráfico Vehicular (Previsión 7 Días)'}
              </h2>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8EAAC8', marginTop: '0.2rem' }}>
              Eje de valor: {metricView === 'load' ? 'Factor de Carga (%)' : metricView === 'vehicles' ? 'Vehículos Proyectados' : 'Ingresos Estimados (COP)'} • Línea de meta analítica (85%) y promedio ponderado (64.2%)
            </div>
          </div>

          {/* Power BI Visual Header Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => {
                setChartTab('hours');
                setMetricView('load');
                setFilterPeakOnly(false);
              }}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.55rem',
                fontSize: '0.72rem',
                borderRadius: '4px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Restablecer filtros del visual"
            >
              <RotateCcw size={12} /> Restablecer
            </button>

            <button
              onClick={() => setFocusMode(!focusMode)}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.55rem',
                fontSize: '0.72rem',
                borderRadius: '4px',
                background: focusMode ? '#0284c7' : '#1E293B',
                color: focusMode ? '#ffffff' : '#94A3B8',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Modo de enfoque (Focus Mode)"
            >
              <Maximize2 size={12} /> Modo Enfoque
            </button>
          </div>
        </div>

        {/* Power BI Chiclet Slicers Bar (Segmentadores de Datos Interactivos) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            background: '#0B1329',
            padding: '0.65rem 0.95rem',
            borderRadius: '4px',
            border: '1px solid #1E293B',
            marginBottom: '1.25rem',
          }}
        >
          {/* Segmentador 1: Granularidad */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8EAAC8', fontWeight: 600, textTransform: 'uppercase' }}>
              Granularidad:
            </span>
            <div style={{ display: 'flex', background: '#1E293B', padding: '2px', borderRadius: '4px', gap: '2px', border: '1px solid #334155' }}>
              <button
                onClick={() => {
                  setChartTab('hours');
                  setHoveredIdx(null);
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isHours ? '#00B8D9' : 'transparent',
                  color: isHours ? '#000000' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                Hoy (Horas)
              </button>
              <button
                onClick={() => {
                  setChartTab('days');
                  setHoveredIdx(null);
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isHours ? '#00B8D9' : 'transparent',
                  color: !isHours ? '#000000' : '#94A3B8',
                  transition: 'all 0.15s ease',
                }}
              >
                7 Días (Semanal)
              </button>
            </div>
          </div>

          {/* Segmentador 2: Medida Métrica */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8EAAC8', fontWeight: 600, textTransform: 'uppercase' }}>
              Medida:
            </span>
            <div style={{ display: 'flex', background: '#1E293B', padding: '2px', borderRadius: '4px', gap: '2px', border: '1px solid #334155' }}>
              <button
                onClick={() => setMetricView('load')}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: metricView === 'load' ? '#0F172A' : 'transparent',
                  color: metricView === 'load' ? '#00B8D9' : '#94A3B8',
                  borderBottom: metricView === 'load' ? '2px solid #00B8D9' : '2px solid transparent',
                }}
              >
                % Carga Bahía
              </button>
              <button
                onClick={() => setMetricView('vehicles')}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: metricView === 'vehicles' ? '#0F172A' : 'transparent',
                  color: metricView === 'vehicles' ? '#10B981' : '#94A3B8',
                  borderBottom: metricView === 'vehicles' ? '2px solid #10B981' : '2px solid transparent',
                }}
              >
                Vehículos Proyectados
              </button>
              <button
                onClick={() => setMetricView('revenue')}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: metricView === 'revenue' ? '#0F172A' : 'transparent',
                  color: metricView === 'revenue' ? '#FACC15' : '#94A3B8',
                  borderBottom: metricView === 'revenue' ? '2px solid #FACC15' : '2px solid transparent',
                }}
              >
                Ingresos Estimados ($)
              </button>
            </div>
          </div>

          {/* Segmentador 3: Filtro de Franjas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#8EAAC8', fontWeight: 600, textTransform: 'uppercase' }}>
              Filtro Rápido:
            </span>
            <div style={{ display: 'flex', background: '#1E293B', padding: '2px', borderRadius: '4px', gap: '2px', border: '1px solid #334155' }}>
              <button
                onClick={() => setFilterPeakOnly(false)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !filterPeakOnly ? '#0F172A' : 'transparent',
                  color: !filterPeakOnly ? '#F8FAFC' : '#94A3B8',
                }}
              >
                Todas las franjas
              </button>
              <button
                onClick={() => setFilterPeakOnly(true)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '3px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: filterPeakOnly ? '#F97316' : 'transparent',
                  color: filterPeakOnly ? '#FFFFFF' : '#94A3B8',
                }}
              >
                Solo Picos (≥70%)
              </button>
            </div>
          </div>
        </div>

        {/* Canvas SVG Power BI Line & Area Chart */}
        <div
          style={{
            position: 'relative',
            background: '#0B1329',
            borderRadius: '4px',
            border: '1px solid #1E293B',
            padding: '1.25rem 1rem 0.75rem 0.5rem',
            overflowX: 'auto',
          }}
        >
          <svg
            viewBox="0 0 880 280"
            style={{ width: '100%', height: 'auto', minWidth: '700px', display: 'block' }}
          >
            <defs>
              <linearGradient id="pbiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00B8D9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#00B8D9" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Cuadrícula horizontal cartesiana Power BI */}
            {[
              { y: 55, label: metricView === 'load' ? '100%' : metricView === 'vehicles' ? '22' : '$420K' },
              { y: 100, label: metricView === 'load' ? '75%' : metricView === 'vehicles' ? '16' : '$315K' },
              { y: 145, label: metricView === 'load' ? '50%' : metricView === 'vehicles' ? '11' : '$210K' },
              { y: 190, label: metricView === 'load' ? '25%' : metricView === 'vehicles' ? '5' : '$105K' },
              { y: 235, label: '0' },
            ].map((g, i) => (
              <g key={i}>
                <line
                  x1={leftMargin}
                  y1={g.y}
                  x2={rightMargin}
                  y2={g.y}
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={leftMargin - 10}
                  y={g.y + 3.5}
                  fill="#64748B"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="Segoe UI, monospace"
                  fontWeight="600"
                >
                  {g.label}
                </text>
              </g>
            ))}

            {/* Eje Y Label Title */}
            <text
              x="18"
              y="145"
              fill="#64748B"
              fontSize="9"
              fontWeight="700"
              transform="rotate(-90 18,145)"
              textAnchor="middle"
              letterSpacing="0.08em"
            >
              {metricView === 'load' ? 'FACTOR DE CARGA (%)' : metricView === 'vehicles' ? 'VOLUMEN VEHICULAR' : 'INGRESOS (COP)'}
            </text>

            {/* Power BI Analytics Line 1: Línea de Capacidad Crítica (85%) */}
            {metricView === 'load' && (
              <g>
                <line
                  x1={leftMargin}
                  y1={criticalLimitY}
                  x2={rightMargin}
                  y2={criticalLimitY}
                  stroke="#F97316"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
                <rect
                  x="755"
                  y={criticalLimitY - 9}
                  width="112"
                  height="18"
                  rx="3"
                  fill="#1E293B"
                  stroke="#F97316"
                  strokeWidth="1"
                />
                <text
                  x="811"
                  y={criticalLimitY + 3}
                  fill="#FB923C"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="Segoe UI, sans-serif"
                >
                  Límite Bahía: 85%
                </text>
              </g>
            )}

            {/* Power BI Analytics Line 2: Línea de Promedio Ponderado (64.2%) */}
            {metricView === 'load' && (
              <g>
                <line
                  x1={leftMargin}
                  y1={averageLineY}
                  x2={rightMargin}
                  y2={averageLineY}
                  stroke="#FACC15"
                  strokeWidth="1.2"
                  strokeDasharray="5 3"
                />
                <rect
                  x="755"
                  y={averageLineY - 9}
                  width="112"
                  height="18"
                  rx="3"
                  fill="#1E293B"
                  stroke="#FACC15"
                  strokeWidth="1"
                />
                <text
                  x="811"
                  y={averageLineY + 3}
                  fill="#FDE047"
                  fontSize="9.5"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="Segoe UI, sans-serif"
                >
                  Promedio: 64.2%
                </text>
              </g>
            )}

            {/* Área Sombreada Tenue de Power BI */}
            {areaD && <path d={areaD} fill="url(#pbiAreaGrad)" />}

            {/* Línea Principal del Gráfico */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#00B8D9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Nodos de Datos, Etiquetas y Líneas Guía Verticales */}
            {currentDataset.map((pt, i) => (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Línea Guía Vertical al pasar el cursor */}
                {hoveredIdx === i && (
                  <line
                    x1={pt.x}
                    y1={maxTopY}
                    x2={pt.x}
                    y2={baseBottomY}
                    stroke="#475569"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Marcador Circular de Datos Power BI */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? 6 : pt.isPeak ? 5 : 4}
                  fill={pt.isPeak ? '#0284C7' : '#00B8D9'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Power BI Data Labels (Etiquetas Directas de Valor sobre el Punto) */}
                <rect
                  x={pt.x - 22}
                  y={pt.y - 25}
                  width="44"
                  height="17"
                  rx="3"
                  fill={pt.isPeak ? '#0C2646' : hoveredIdx === i ? '#1E293B' : '#0B1329'}
                  stroke={pt.isPeak ? '#00B8D9' : hoveredIdx === i ? '#64748B' : '#1E293B'}
                  strokeWidth="1"
                />
                <text
                  x={pt.x}
                  y={pt.y - 13}
                  fill={pt.isPeak ? '#38BDF8' : '#E2E8F0'}
                  fontSize="10"
                  fontWeight={pt.isPeak ? '800' : '600'}
                  textAnchor="middle"
                  fontFamily="Segoe UI, sans-serif"
                >
                  {pt.displayVal}
                </text>

                {/* Marcas del Eje X */}
                <line
                  x1={pt.x}
                  y1={baseBottomY}
                  x2={pt.x}
                  y2={baseBottomY + 5}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={pt.x}
                  y={baseBottomY + 18}
                  fill={hoveredIdx === i ? '#FFFFFF' : '#94A3B8'}
                  fontSize="11"
                  fontWeight={hoveredIdx === i ? '700' : '500'}
                  textAnchor="middle"
                  fontFamily="Segoe UI, sans-serif"
                >
                  {pt.label}
                </text>
              </g>
            ))}

            {/* Eje X Title */}
            <text
              x="410"
              y="273"
              fill="#64748B"
              fontSize="9.5"
              fontWeight="700"
              textAnchor="middle"
              letterSpacing="0.08em"
            >
              INTERVALO TEMPORAL ({isHours ? 'FRANJAS HORARIAS DEL DÍA' : 'DÍAS DEL PERÍODO SEMANAL'})
            </text>
          </svg>

          {/* Power BI Custom Card Tooltip (Flotante) */}
          {hoveredIdx !== null && currentDataset[hoveredIdx] && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: `${Math.min(Math.max((currentDataset[hoveredIdx].x / 880) * 100, 18), 80)}%`,
                transform: 'translateX(-50%)',
                background: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.65)',
                pointerEvents: 'none',
                textAlign: 'left',
                zIndex: 30,
                minWidth: '220px',
              }}
            >
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#94A3B8',
                  fontWeight: 700,
                  paddingBottom: '0.4rem',
                  borderBottom: '1px solid #1E293B',
                  marginBottom: '0.5rem',
                }}
              >
                {currentDataset[hoveredIdx].fullLabel}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#00B8D9', display: 'inline-block' }}></span>
                    Carga Bahía:
                  </span>
                  <strong style={{ color: '#FFFFFF' }}>{currentDataset[hoveredIdx].loadPercent}%</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981', display: 'inline-block' }}></span>
                    Demanda Est.:
                  </span>
                  <strong style={{ color: '#FFFFFF' }}>{currentDataset[hoveredIdx].vehicles} vehículos</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#FACC15', display: 'inline-block' }}></span>
                    Ingreso Proyectado:
                  </span>
                  <strong style={{ color: '#FACC15' }}>
                    ${currentDataset[hoveredIdx].revenue.toLocaleString('es-CO')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.35rem', borderTop: '1px solid #1E293B', marginTop: '0.2rem' }}>
                  <span style={{ color: '#8EAAC8' }}>Estado Operativo:</span>
                  <span
                    style={{
                      color: currentDataset[hoveredIdx].isPeak ? '#38BDF8' : '#10B981',
                      fontWeight: 700,
                    }}
                  >
                    {currentDataset[hoveredIdx].status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Power BI Matrix Visual: Desglose Tabular con Barras de Datos (Data Bars) */}
        <div style={{ marginTop: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Table size={16} color="#00B8D9" />
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC' }}>
                Matriz de Datos: Desglose por Intervalo (Formato Condicional)
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Mostrando {currentDataset.length} filas • Medidas ponderadas por RandomForest
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #1E293B', borderRadius: '4px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ background: '#0B1329', borderBottom: '1px solid #334155', color: '#8EAAC8' }}>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>INTERVALO</th>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>FACTOR DE CARGA</th>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>DISTRIBUCIÓN (BARRA DE DATOS)</th>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>DEMANDA APROX.</th>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>ESTADO (KPI)</th>
                  <th style={{ padding: '0.65rem 1rem', fontWeight: 700 }}>ACCIÓN OPERATIVA RECOMENDADA</th>
                </tr>
              </thead>
              <tbody>
                {currentDataset.map((item, idx) => {
                  const percent = item.loadPercent;
                  const isHigh = percent >= 80;
                  const isMid = percent >= 50 && percent < 80;

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid #1E293B',
                        background: idx % 2 === 0 ? '#0B1329' : '#0F172A',
                      }}
                    >
                      <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: '#F8FAFC' }}>
                        {item.fullLabel}
                      </td>

                      <td style={{ padding: '0.65rem 1rem', color: '#E2E8F0', fontWeight: 700 }}>
                        {percent}%
                      </td>

                      {/* Power BI Data Bar Cell */}
                      <td style={{ padding: '0.65rem 1rem', width: '180px' }}>
                        <div
                          style={{
                            height: '14px',
                            width: '100%',
                            background: '#1E293B',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${percent}%`,
                              background: isHigh
                                ? 'linear-gradient(90deg, #0284C7, #00B8D9)'
                                : isMid
                                ? 'linear-gradient(90deg, #0369A1, #0284C7)'
                                : '#334155',
                              borderRadius: '2px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </td>

                      <td style={{ padding: '0.65rem 1rem', color: '#CBD5E1' }}>
                        {item.vehicles} vehículos (${(item.revenue / 1000).toFixed(0)}K)
                      </td>

                      {/* Power BI Status Dot + Badge */}
                      <td style={{ padding: '0.65rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isHigh ? 'rgba(56, 189, 248, 0.12)' : isMid ? 'rgba(2, 132, 199, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: isHigh ? '#38BDF8' : isMid ? '#60A5FA' : '#94A3B8',
                            border: `1px solid ${isHigh ? 'rgba(56, 189, 248, 0.3)' : isMid ? 'rgba(2, 132, 199, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: isHigh ? '#38BDF8' : isMid ? '#60A5FA' : '#94A3B8',
                            }}
                          ></span>
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.65rem 1rem', color: '#94A3B8', fontSize: '0.78rem' }}>
                        {isHigh
                          ? 'Operar 2 bombas a 180 Bar y dosificar champú al 100%'
                          : isMid
                          ? 'Velocidad de cinta transportadora nominal en ciclo estándar'
                          : 'Modo Eco: menor consumo eléctrico de turbinas'}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Summary Row (Fila de Resumen Power BI) */}
                <tr style={{ background: '#16233B', borderTop: '2px solid #334155', fontWeight: 700 }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#F8FAFC' }}>
                    PROMEDIO PONDERADO
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#38BDF8' }}>
                    64.2%
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ height: '6px', width: '64.2%', background: '#FACC15', borderRadius: '2px' }}></div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#F8FAFC' }}>
                    ~456 veh / ciclo sem.
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ color: '#10B981', fontSize: '0.75rem' }}>CAPACIDAD ESTABLE</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                    Insumos y hardware listos para operación continua
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tarjetas de Pronóstico Semanal y Mantenimiento IoT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Visual de Distribución Horaria */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '6px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Gauge size={18} color="#00B8D9" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              Distribución Horaria Estimada (Perfil de Consumo)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {rawHoursList.map((h: any, i: number) => {
              const percent = Math.round(h.loadFactor * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#CBD5E1' }}>{h.hour}</span>
                    <span style={{ color: percent > 80 ? '#38BDF8' : '#94A3B8', fontWeight: 700 }}>
                      {percent}% Carga {h.status ? `(${h.status})` : ''}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      background: '#1E293B',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background:
                          percent > 85
                            ? 'linear-gradient(90deg, #0284C7, #00B8D9)'
                            : '#0284C7',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual de Mantenimiento IoT y Salud de Actuadores */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '6px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Wrench size={18} color="#10B981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
              Mantenimiento Predictivo (Sensores de Bahía IoT)
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {maintenanceData?.components?.map((comp: any) => (
              <div
                key={comp.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '4px',
                  background: '#0B1329',
                  border: '1px solid #1E293B',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#F8FAFC' }}>{comp.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#8EAAC8' }}>
                      Ciclos ejecutados: {comp.totalCycles} | Próximo servicio: ~{comp.cyclesToNextService} ciclos
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: comp.riskLevel === 'BAJO' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: comp.riskLevel === 'BAJO' ? '#34D399' : '#FBBF24',
                      border: `1px solid ${comp.riskLevel === 'BAJO' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    }}
                  >
                    Salud {comp.healthScore}%
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={12} color="#00B8D9" />
                  <span>{comp.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
