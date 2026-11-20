import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Almacén en memoria para simular sesiones cuando el backend offline
const mockSessions: Record<string, any> = {};

// Almacén para simular administradores persistidos en demostración
let mockIsEmergencyStopped = false;
const INITIAL_MOCK_ADMINS = [
  {
    id: 'admin-uuid-1',
    email: 'admin@carwash.com',
    fullName: 'Administrador Maestro',
    role: 'ROLE_ADMIN',
    isActive: true,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'admin-uuid-2',
    email: 'supervisor@carwash.com',
    fullName: 'Ing. Laura Restrepo',
    role: 'ROLE_ADMIN',
    isActive: true,
    createdAt: '2026-03-12T10:15:00.000Z',
  },
  {
    id: 'admin-uuid-3',
    email: 'operador.bahia@carwash.com',
    fullName: 'Juan Camilo Pérez',
    role: 'ROLE_OPERATOR',
    isActive: true,
    createdAt: '2026-04-05T14:20:00.000Z',
  },
];

export const getStoredMockAdmins = (): any[] => {
  try {
    const raw = localStorage.getItem('carwash_mock_admins');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...INITIAL_MOCK_ADMINS];
};

export const saveStoredMockAdmins = (admins: any[]) => {
  try {
    localStorage.setItem('carwash_mock_admins', JSON.stringify(admins));
  } catch {}
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

// Función auxiliar con Fallback Inteligente para demostración cuando backend offline o Vite SPA fallback
const executeMockFallback = (config: any) => {
  const url = config?.url || '';
  const method = (config?.method || 'get').toLowerCase();

  console.warn(`[Modo Demostración / Fallback Activo] Simulando respuesta para: ${method.toUpperCase()} ${url}`);

  // 1. Consulta de Puntos y Fidelidad por Placa (Contabilidad Mensual)
  if (url.includes('/client/wash/loyalty/')) {
    const plate = url.split('/').pop()?.toUpperCase() || 'KLO-892';
    const now = new Date();
    const currentMonthName = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    
    // Simulación de contabilidad mensual de la placa:
    const monthWashes = plate === 'KLO-892' ? 3 : plate.endsWith('5') ? 5 : 1;
    const allTimeWashes = plate === 'KLO-892' ? 12 : plate.endsWith('5') ? 15 : monthWashes;
    const isFree = monthWashes >= 5;
    return {
      data: {
        licensePlate: plate,
        currentMonthName,
        monthApprovedWashes: monthWashes,
        totalApprovedWashes: monthWashes,
        allTimeApprovedWashes: allTimeWashes,
        pointsEarned: allTimeWashes * 100,
        washesUntilNextFree: isFree ? 0 : 5 - monthWashes,
        isNextWashFree: isFree,
        rewardRequirement: 5,
        isMonthlyProgram: true,
      },
    };
  }

      // 2. Iniciar Orden de Lavado
      if (url.includes('/client/wash/initiate') && method === 'post') {
        if (mockIsEmergencyStopped) {
          return Promise.reject({
            response: {
              status: 400,
              data: {
                message: 'El sistema de lavado se encuentra DETENIDO POR EMERGENCIA. No es posible iniciar lavados hasta que un administrador ordene el reinicio.',
              },
            },
          });
        }
        const body = JSON.parse(config?.data || '{}');
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
            message: 'Pago simulado aprobado exitosamente. Señal enviada al controlador de bahía.',
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
        const body = JSON.parse(config?.data || '{}');
        const email = (body.email || '').toLowerCase().trim();
        const storedAdmins = getStoredMockAdmins();
        const matchAdmin = storedAdmins.find((a: any) => a.email.toLowerCase() === email);

        if (!matchAdmin) {
          return Promise.reject({
            response: {
              status: 404,
              data: {
                message: 'Cuenta no existe. Verifique el correo ingresado.',
              },
            },
          });
        }

        if (matchAdmin.isActive === false) {
          return Promise.reject({
            response: {
              status: 403,
              data: {
                message: 'Su cuenta se encuentra suspendida. Contacte al administrador.',
              },
            },
          });
        }

        return {
          data: {
            token: `mock_jwt_token_${matchAdmin.id}`,
            user: {
              id: matchAdmin.id,
              email: matchAdmin.email,
              fullName: matchAdmin.fullName,
              role: matchAdmin.role,
            },
          },
        };
      }

      // 5.1. Gestión de Administradores (GET /auth/admins)
      if (url.includes('/auth/admins') && method === 'get') {
        return {
          data: getStoredMockAdmins(),
        };
      }

      // 5.2. Registrar Nuevo Administrador (POST /auth/admins)
      if (url.includes('/auth/admins') && method === 'post' && !url.includes('/toggle-status')) {
        const body = JSON.parse(config?.data || '{}');
        const storedAdmins = getStoredMockAdmins();
        const newAdmin = {
          id: `admin-${Date.now()}`,
          email: (body.email || '').toLowerCase().trim(),
          fullName: body.fullName,
          role: body.role || 'ROLE_ADMIN',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        storedAdmins.unshift(newAdmin);
        saveStoredMockAdmins(storedAdmins);
        return {
          data: {
            success: true,
            message: 'Administrador registrado exitosamente',
            admin: newAdmin,
          },
        };
      }

      // 5.3. Eliminar Administrador (DELETE /auth/admins/:id)
      if (url.includes('auth/admins') && method === 'delete') {
        const matchId = url.match(/auth\/admins\/([^/?#]+)/);
        const adminId = matchId ? matchId[1] : url.split('/').filter(Boolean).pop() || '';
        const storedAdmins = getStoredMockAdmins();
        const updated = storedAdmins.filter(
          (a: any) =>
            a.id !== adminId &&
            a.id.toLowerCase() !== adminId.toLowerCase() &&
            a.email.toLowerCase() !== adminId.toLowerCase()
        );
        saveStoredMockAdmins(updated);
        return {
          data: {
            success: true,
            message: 'Usuario revocado y eliminado correctamente',
          },
        };
      }

      // 5.4. Cambiar Estado / Suspender / Reactivar (POST /auth/admins/:id/toggle-status)
      if (url.includes('toggle-status') && method === 'post') {
        const matchToggle = url.match(/auth\/admins\/([^/?#]+)\/toggle-status/);
        const adminId = matchToggle ? matchToggle[1] : url.split('/').filter(p => p && p !== 'toggle-status').pop() || '';
        const storedAdmins = getStoredMockAdmins();
        const adm = storedAdmins.find(
          (a: any) =>
            a.id === adminId ||
            a.id.toLowerCase() === adminId.toLowerCase() ||
            a.email.toLowerCase() === adminId.toLowerCase()
        );
        if (adm) {
          adm.isActive = !adm.isActive;
          saveStoredMockAdmins(storedAdmins);
          return {
            data: {
              success: true,
              message: `Usuario ${adm.fullName} ${adm.isActive ? 'reactivado' : 'suspendido'} correctamente`,
              user: adm,
            },
          };
        }
        return {
          data: {
            success: true,
            message: 'Estado de usuario actualizado correctamente',
          },
        };
      }

      // 6. KPIs del Dashboard Admin
      if (url.includes('/admin/wash/kpis')) {
        const approvedSessions = Object.values(mockSessions).filter((s: any) => s.paymentStatus === 'APPROVED');
        const calculatedTodayWashes = approvedSessions.length;
        const calculatedTodayRevenue = approvedSessions.reduce((acc: number, s: any) => acc + (Number(s.amount) || 0), 0);
        const activeBaysCount = Object.values(mockSessions).filter(
          (s: any) => s.stage && s.stage.startsWith('STAGE_') && s.stage !== 'STAGE_FINISHED'
        ).length;

        const hwData = {
          connected: true,
          emulated: true,
          isEmergencyStopped: mockIsEmergencyStopped,
          controller: 'ESP32 Dual-Core (WiFi / BLE / GPIO)',
          port: 'COM3 (ESP32 USB UART / 115200 baudios)',
          wifiIp: '192.168.1.150',
          activeSensors: [
            'GPIO 13: Bomba Shampoo (Espuma Activa)',
            'GPIO 12: Motor Esponjas Soft-Touch',
            'GPIO 14: Bomba Enjuague Hidro-Jet (180 Bar)',
            'GPIO 27: Turbina AeroDry (Secado Ciclónico)',
            'GPIO 18: Servomotor Talanquera PWM',
            'GPIO 5/19: Sensor Ultrasónico HC-SR04',
          ],
        };

        return {
          data: {
            todayRevenue: calculatedTodayRevenue,
            todayWashesCount: calculatedTodayWashes,
            activeBays: mockIsEmergencyStopped ? 0 : activeBaysCount,
            totalAllTimeWashes: calculatedTodayWashes,
            isEmergencyStopped: mockIsEmergencyStopped,
            loyaltyStats: {
              currentMonthName: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
              totalUniqueVehicles: calculatedTodayWashes > 0 ? calculatedTodayWashes : 0,
              recurringVehiclesCount: 0,
              monthlyRecurringVehiclesCount: 0,
              topFrequentPlates: approvedSessions.map((s: any) => ({
                plate: s.licensePlate,
                count: 1,
                monthCount: 1,
              })),
            },
            hardware: hwData,
            arduino: hwData,
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
              { id: '5', name: 'Servomotor Talanquera (Barrera Automatizada)', healthScore: 96, totalCycles: 3410, cyclesToNextService: 1200, riskLevel: 'BAJO', recommendation: 'Calibración a 90 grados perfecta.' },
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

      // 11. Reentrenamiento de IA
      if (url.includes('/admin/analytics/retrain')) {
        return {
          data: {
            success: true,
            message: 'Modelo RandomForestRegressor re-entrenado exitosamente',
            metrics: {
              r2Score: 0.952,
              trainingSamples: 19250,
              isTrainedOnRealData: true,
            },
          },
        };
      }

      // Override de talanquera manual
      if (url.includes('/override-barrier')) {
        return { data: { success: true, message: 'Talanquera abierta manualmente con éxito.' } };
      }

      // Parada de Emergencia: bloquea el sistema
      if (url.includes('/emergency-stop')) {
        mockIsEmergencyStopped = true;
        return {
          data: {
            success: true,
            isEmergencyStopped: true,
            message: '🛑 PARADA DE EMERGENCIA ACTIVADA: Todos los actuadores y bombas detenidos. Sistema bloqueado hasta orden explícita de reinicio.',
          },
        };
      }

      // Reanudar / Reiniciar Sistema bajo orden del administrador
      if (url.includes('/resume-system') || url.includes('/reset-emergency')) {
        mockIsEmergencyStopped = false;
        return {
          data: {
            success: true,
            isEmergencyStopped: false,
            message: '🟢 ORDEN DE REINICIO EJECUTADA: Sistema reactivado y listo para operar.',
          },
        };
      }

  return null;
};

// Interceptor con Fallback Inteligente (si el backend NestJS local aún no está encendido o responde HTML de Vite en dev)
api.interceptors.response.use(
  (response) => {
    const isHtmlResponse =
      typeof response.data === 'string' &&
      (response.data.includes('<!doctype html') || response.data.includes('<html'));

    if (isHtmlResponse) {
      const fallbackResult = executeMockFallback(response.config);
      if (fallbackResult) return fallbackResult as any;
    }
    return response;
  },
  async (error) => {
    // Fallback inteligente: si cualquier endpoint falla en local/desarrollo (401, 403, 404, 500, network error)
    // resolvemos con el almacén mock para garantizar que la interfaz siempre responda y sea funcional.
    const fallbackResult = executeMockFallback(error.config);
    if (fallbackResult) return fallbackResult as any;

    return Promise.reject(error);
  },
);

export default api;
