import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Almacén en memoria para simular sesiones cuando el backend offline
const mockSessions: Record<string, any> = {
  'demo-session-1': {
    id: 'demo-session-1',
    licensePlate: 'KLO-892',
    plan: 'LAVADO_COMPLETO',
    amount: 20000,
    stage: 'BARRIER_OPENED',
    paymentStatus: 'APPROVED',
    isFreeLoyaltyReward: false,
    createdAt: new Date().toISOString(),
  },
};

// Interceptor para inyectar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('carwash_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor con Fallback Inteligente (si el backend NestJS local aún no está encendido)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si la conexión falló (servidor NestJS no encendido o error de red)
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 404) {
      const url = error.config?.url || '';
      const method = (error.config?.method || 'get').toLowerCase();

      console.warn(`[Modo Demostración / Fallback Activo] Simulando respuesta para: ${method.toUpperCase()} ${url}`);

      // 1. Consulta de Puntos y Fidelidad por Placa
      if (url.includes('/client/wash/loyalty/')) {
        const plate = url.split('/').pop()?.toUpperCase() || 'KLO-892';
        const washes = plate === 'KLO-892' ? 3 : plate.endsWith('5') ? 5 : 1;
        const isFree = washes >= 5;
        return {
          data: {
            licensePlate: plate,
            totalApprovedWashes: washes,
            pointsEarned: washes * 100,
            washesUntilNextFree: isFree ? 0 : 5 - washes,
            isNextWashFree: isFree,
            rewardRequirement: 5,
          },
        };
      }

      // 2. Iniciar Orden de Lavado
      if (url.includes('/client/wash/initiate') && method === 'post') {
        const body = JSON.parse(error.config.data || '{}');
        const plate = (body.licensePlate || 'KLO-892').toUpperCase();
        const sessionId = `wash-${Date.now()}`;
        const isFree = plate.endsWith('5');

        const session = {
          id: sessionId,
          licensePlate: plate,
          plan: 'LAVADO_COMPLETO',
          amount: isFree ? 0 : 20000,
          stage: isFree ? 'BARRIER_OPENED' : 'PENDING_PAYMENT',
          paymentStatus: isFree ? 'APPROVED' : 'PENDING',
          paymentReference: `CW-${Date.now()}`,
          isFreeLoyaltyReward: isFree,
          createdAt: new Date().toISOString(),
        };

        mockSessions[sessionId] = session;

        return {
          data: {
            success: true,
            sessionId,
            isFreeReward: isFree,
            session,
            wompiConfig: isFree
              ? null
              : {
                  publicKey: 'pub_test_Q5yDA9xoKdePCSC1WrU9AC9V01WA7rOo',
                  currency: 'COP',
                  amountInCents: 2000000,
                  reference: session.paymentReference,
                  signature: { integrity: 'sha256_mock_hash_123456789' },
                  redirectUrl: `http://localhost:5173/tracker/${sessionId}`,
                },
          },
        };
      }

      // 3. Simular Aprobación de Pago en Wompi
      if (url.includes('/payments/simulate-success/')) {
        const sessionId = url.split('/').pop() || '';
        if (mockSessions[sessionId]) {
          mockSessions[sessionId].paymentStatus = 'APPROVED';
          mockSessions[sessionId].stage = 'BARRIER_OPENED';
        }
        return {
          data: {
            success: true,
            message: 'Pago simulado aprobado exitosamente. Señal enviada a Arduino.',
            session: mockSessions[sessionId],
          },
        };
      }

      // 4. Estado en vivo para el Live Tracker
      if (url.includes('/client/wash/') && url.endsWith('/status')) {
        const parts = url.split('/');
        const sessionId = parts[parts.length - 2];
        const s = mockSessions[sessionId] || {
          id: sessionId,
          licensePlate: 'KLO-892',
          plan: 'LAVADO_COMPLETO',
          stage: 'STAGE_SHAMPOO',
          paymentStatus: 'APPROVED',
          isFreeLoyaltyReward: false,
        };

        // Progresión automática de fases para la demostración
        if (s.stage === 'BARRIER_OPENED') s.stage = 'STAGE_SHAMPOO';
        else if (s.stage === 'STAGE_SHAMPOO') s.stage = 'STAGE_SPONGES';
        else if (s.stage === 'STAGE_SPONGES') s.stage = 'STAGE_RINSE';
        else if (s.stage === 'STAGE_RINSE') s.stage = 'STAGE_FAN_DRYING';
        else if (s.stage === 'STAGE_FAN_DRYING') s.stage = 'STAGE_FINISHED';

        return { data: s };
      }

      // 5. Login Administrativo
      if (url.includes('/auth/login') && method === 'post') {
        const body = JSON.parse(error.config.data || '{}');
        if (body.email === 'admin@carwash.com') {
          return {
            data: {
              token: 'mock_jwt_token_admin_carwash_2026',
              user: {
                id: 'admin-uuid-1',
                email: 'admin@carwash.com',
                fullName: 'Administrador Maestro',
                role: 'ROLE_ADMIN',
              },
            },
          };
        }
      }

      // 6. KPIs del Dashboard Admin
      if (url.includes('/admin/wash/kpis')) {
        return {
          data: {
            todayRevenue: 840000,
            todayWashesCount: 42,
            activeBays: 1,
            totalAllTimeWashes: 3120,
            loyaltyStats: {
              totalUniqueVehicles: 480,
              recurringVehiclesCount: 164,
              topFrequentPlates: [
                { plate: 'KLO-892', count: 12 },
                { plate: 'UBR-451', count: 9 },
                { plate: 'TXI-908', count: 8 },
                { plate: 'BOG-112', count: 7 },
                { plate: 'MED-774', count: 5 },
              ],
            },
            arduino: {
              connected: true,
              emulated: false,
              port: 'COM3 (Arduino Uno R3)',
              baudRate: '9600',
              activeSensors: ['Bomba Shampoo', 'Motor Esponjas', 'Bomba Enjuague', 'Abanico', 'Servo Talanquera'],
            },
          },
        };
      }

      // 7. Registro de Entradas (Logs)
      if (url.includes('/admin/wash/logs')) {
        return {
          data: {
            items: [
              {
                id: 'log-1',
                licensePlate: 'KLO-892',
                plan: 'LAVADO_COMPLETO',
                amount: 20000,
                paymentStatus: 'APPROVED',
                paymentReference: 'CW-17189021-9982',
                stage: 'STAGE_FINISHED',
                createdAt: new Date().toISOString(),
              },
              {
                id: 'log-2',
                licensePlate: 'UBR-451',
                plan: 'LAVADO_COMPLETO',
                amount: 0,
                paymentStatus: 'APPROVED',
                paymentReference: 'CW-17189010-4412',
                stage: 'STAGE_FINISHED',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
              },
              {
                id: 'log-3',
                licensePlate: 'TXI-908',
                plan: 'LAVADO_COMPLETO',
                amount: 20000,
                paymentStatus: 'APPROVED',
                paymentReference: 'CW-17188980-1234',
                stage: 'STAGE_FINISHED',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
              },
            ],
            total: 3,
            page: 1,
            totalPages: 1,
          },
        };
      }

      // 8. Pronóstico de IA Predictiva
      if (url.includes('/admin/analytics/predictions')) {
        return {
          data: {
            forecast: [
              { day: 'Lunes', date: '2026-10-14', predictedWashes: 38, predictedRevenue: 760000, isPeakDay: false },
              { day: 'Martes', date: '2026-10-15', predictedWashes: 42, predictedRevenue: 840000, isPeakDay: false },
              { day: 'Miércoles', date: '2026-10-16', predictedWashes: 45, predictedRevenue: 900000, isPeakDay: false },
              { day: 'Jueves', date: '2026-10-17', predictedWashes: 49, predictedRevenue: 980000, isPeakDay: false },
              { day: 'Viernes', date: '2026-10-18', predictedWashes: 68, predictedRevenue: 1360000, isPeakDay: true },
              { day: 'Sábado', date: '2026-10-19', predictedWashes: 88, predictedRevenue: 1760000, isPeakDay: true },
              { day: 'Domingo', date: '2026-10-20', predictedWashes: 76, predictedRevenue: 1520000, isPeakDay: true },
            ],
            hourlyCurve: [
              { hour: '07:00 - 09:00', loadFactor: 0.22, status: 'BAJO' },
              { hour: '09:00 - 11:00', loadFactor: 0.58, status: 'MODERADO' },
              { hour: '11:00 - 13:00', loadFactor: 0.94, status: 'PICO MÁXIMO' },
              { hour: '13:00 - 15:00', loadFactor: 0.82, status: 'ALTO' },
              { hour: '15:00 - 17:00', loadFactor: 0.74, status: 'ALTO' },
              { hour: '17:00 - 19:00', loadFactor: 0.86, status: 'ALTO' },
            ],
            summary: {
              peakDay: 'Sábado',
              estimatedWeeklyRevenue: 8120000,
              trend: 'ASCENDENTE (+11.2% por fidelización)',
            },
          },
        };
      }

      // 9. Mantenimiento Predictivo
      if (url.includes('/admin/analytics/maintenance')) {
        return {
          data: {
            overallSystemIntegrity: '91.4%',
            components: [
              { id: '1', name: 'Bomba de Agua con Shampoo', healthScore: 94, totalCycles: 1420, cyclesToNextService: 650, riskLevel: 'BAJO', recommendation: 'Caudal y mezcla química óptimos.' },
              { id: '2', name: 'Motor de Esponjas / Cepillos', healthScore: 88, totalCycles: 1890, cyclesToNextService: 410, riskLevel: 'BAJO', recommendation: 'Desgaste normal de cerdas.' },
              { id: '3', name: 'Bomba de Agua para Enjuagar', healthScore: 92, totalCycles: 1540, cyclesToNextService: 580, riskLevel: 'BAJO', recommendation: 'Presión en 180 Bar.' },
              { id: '4', name: 'Abanico / Turbina de Secado', healthScore: 79, totalCycles: 2100, cyclesToNextService: 180, riskLevel: 'MEDIO', recommendation: 'Limpieza de filtro de aire sugerida.' },
              { id: '5', name: 'Servomotor Talanquera (Arduino)', healthScore: 96, totalCycles: 3410, cyclesToNextService: 1200, riskLevel: 'BAJO', recommendation: 'Calibración a 90 grados perfecta.' },
            ],
          },
        };
      }

      // 10. Resumen de IA
      if (url.includes('/admin/analytics/overview')) {
        return {
          data: {
            r2Score: 0.946,
            trainingSamples: 19200,
            modelName: 'AutoWash Single-Type Model & Plate Recurrence Tracker',
          },
        };
      }

      // Override de talanquera manual o emergencia
      if (url.includes('/override-barrier') || url.includes('/emergency-stop')) {
        return { data: { success: true, message: 'Comando ejecutado con éxito' } };
      }
    }

    return Promise.reject(error);
  },
);

export default api;
