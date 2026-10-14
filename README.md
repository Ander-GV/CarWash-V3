# 🚗 AutoWash Prime V3 - Sistema Automatizado IoT

Sistema integral de autolavado inteligente basado en **Clean Architecture**, con control de actuadores en **Arduino**, pasarela de pagos **Wompi**, backend de alta concurrencia en **NestJS + PostgreSQL**, microservicio de analítica predictiva en **Python (FastAPI + Machine Learning)** y frontend en **React (Kiosco Touch Cliente + Backoffice Admin)**.

---

## 🏛️ Arquitectura General y Separación de Módulos

El proyecto está diseñado bajo principios de Clean Architecture y microservicios modulares para garantizar que el **Módulo del Cliente** y el **Módulo de Administración** operen de manera independiente, desacoplada y segura.

```
CarWash V3/
├── backend-nest/                 # API Principal en NestJS + PostgreSQL + WebSockets
│   ├── src/
│   │   ├── common/               # Guards, Decoradores y Enums Compartidos
│   │   │   ├── decorators/       # @Roles(Role.ADMIN)
│   │   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   │   └── enums/            # Role, WashStage, WashPlan
│   │   ├── modules/
│   │   │   ├── auth/             # Autenticación JWT, Hasheo Bcrypt y Roles
│   │   │   ├── hardware/         # ArduinoService (SerialPort UART + Emulador Fallback)
│   │   │   ├── payments/         # WompiService (Firma SHA-256 + Webhooks)
│   │   │   ├── wash/             # Controladores Separados Cliente y Admin + WebSockets
│   │   │   │   ├── wash-client.controller.ts  # /api/client/wash/** (Público / Kiosco)
│   │   │   │   ├── wash-admin.controller.ts   # /api/admin/wash/** (Protegido ROLE_ADMIN)
│   │   │   │   ├── wash.gateway.ts            # WebSockets (/wash-stream)
│   │   │   │   └── wash.service.ts            # Orquestador del ciclo de vida
│   │   │   └── analytics/        # Proxy y orquestación con Microservicio Python
│   │   └── main.ts               # Helmet, CORS y Prefijo Global /api
│   └── .env.example
│
├── backend-ml-python/            # Microservicio de IA y Analítica Predictiva
│   ├── main.py                   # API FastAPI (/predict/demand, /predict/maintenance)
│   ├── predictor.py              # Algoritmos de Machine Learning (RandomForest & Time Series)
│   └── requirements.txt
│
├── frontend-react/               # Aplicación React + Vite (Kiosco y Dashboard)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── client/           # Módulo Público / Kiosco Touch
│   │   │   │   ├── pages/ClientLanding.tsx     # Landing animada con selector de planes
│   │   │   │   ├── pages/WashLiveTracker.tsx   # Visualizador en vivo de fases (WebSockets)
│   │   │   │   └── components/WompiCheckoutModal.tsx # Checkout Wompi + Sandbox
│   │   │   └── admin/            # Módulo Privado / Backoffice
│   │   │       ├── pages/AdminLogin.tsx        # Login administrativo
│   │   │       ├── pages/AdminDashboard.tsx    # Métricas en tiempo real y control Arduino
│   │   │       ├── pages/WashLogsView.tsx      # Registro y auditoría de entradas
│   │   │       └── pages/PredictiveAnalyticsView.tsx # Visualizador de IA y Mantenimiento IoT
│   │   ├── shared/               # Componentes y Servicios Reutilizables
│   │   │   ├── components/Navbar.tsx
│   │   │   ├── components/ProtectedRoute.tsx
│   │   │   └── services/api.ts & socket.ts
│   │   └── index.css             # Sistema de diseño Neon Glassmorphism
│
└── arduino/
    └── carwash_controller.ino    # Firmware en C++ para Servomotor, Sensor Ultrasónico y Relés
```

---

## 🔒 Seguridad y Protección Estricta de Rutas

### 1. En NestJS (Backend Activo)
Cada controlador y ruta define sus políticas de acceso:
- **Rutas de Cliente (`/api/client/**`):** Son públicas para permitir la interacción en kioscos táctiles o dispositivos móviles de los conductores sin requerir login previo.
- **Rutas de Admin (`/api/admin/**`):** Están blindadas mediante decoradores `@UseGuards(JwtAuthGuard, RolesGuard)` y `@Roles(Role.ADMIN)`. Cualquier intento no autenticado es rechazado con código `401 Unauthorized` o `403 Forbidden`.

```typescript
// Ejemplo de controlador protegido en backend-nest
@Controller('admin/wash')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WashAdminController { ... }
```

### 2. Equivalente en Spring Boot (`SecurityFilterChain`)
En caso de implementar o migrar a Spring Boot en Java, la configuración de seguridad equivalente solicitada es:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Rutas públicas del Kiosco de Clientes y Webhooks de Pagos
                .requestMatchers("/api/client/**", "/api/payments/wompi-webhook").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                // Rutas estrictamente restringidas a Administradores
                .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                // Cualquier otra solicitud requiere autenticación
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

---

## 🔌 Conexión de Hardware: Arduino + NestJS

El firmware del Arduino (`arduino/carwash_controller.ino`) gestiona la barrera y la bancada de relés mediante comunicación serial UART bidireccional a 9600 baudios:

| Dispositivo / Actuador | Pin Arduino | Función |
| :--- | :--- | :--- |
| **Servomotor Talanquera** | `D11` | Levanta barrera de entrada al recibir pago Wompi |
| **Sensor Ultrasónico HC-SR04** | `TRIG D12 / ECHO D13` | Detección de vehículo en posición de bahía |
| **Bomba Alta Presión** | `Relé D4` | Prelavado y Enjuague a 200 Bar |
| **Inyector Espuma Activa** | `Relé D5` | Dosificación de químico desengrasante |
| **Electroválvula Enjuague** | `Relé D6` | Agua desionizada sin minerales |
| **Dosificador Cera** | `Relé D7` | Aplicación de cera nanotecnológica brillo espejo |
| **Turbinas de Secado Turbo** | `Relé D8` | Turbinas de aire a 180 km/h |

### Protocolo Serial UART:
- **NestJS -> Arduino:**
  - `CMD:OPEN_BARRIER:{sessionId}\n` (Abre talanquera)
  - `CMD:START_WASH:{sessionId}:{plan}\n` (Arranca secuencia)
  - `CMD:EMERGENCY_STOP\n` (Corta relés inmediatamente)
- **Arduino -> NestJS:**
  - `EVENT_BARRIER_OPENED:{sessionId}`
  - `STAGE_CHANGE:{stage}:{sessionId}`
  - `EVENT_FINISHED:{sessionId}`

> **Modo Emulación Automático:** Si el Arduino físico no está conectado al puerto COM3, el servicio `ArduinoService` activa automáticamente el modo de emulación para permitir pruebas y desarrollo sin que la aplicación se detenga.

---

## 💳 Integración con Pasarela de Pagos Wompi

1. **Cálculo de Firma de Integridad:** Se calcula el hash criptográfico SHA-256 requerido por Wompi:
   $$\text{Signature} = \text{SHA256}(\text{referencia} + \text{montoEnCentavos} + \text{moneda} + \text{integritySecret})$$
2. **Webhook Seguro:** El endpoint `POST /api/payments/wompi-webhook` recibe el evento de aprobación de la transacción, verifica el identificador y dispara de inmediato la orden al Arduino.
3. **Simulador Sandbox Integrado:** La interfaz incluye un botón para aprobar pagos de prueba inmediatamente en el kiosco sin necesidad de tarjetas reales.

---

## 🧠 Microservicio Python: Modelo Predictivo e IA

El microservicio en Python (`backend-ml-python/main.py`) corre en el puerto `8000` con FastAPI y ofrece:
- **`/predict/demand`**: Pronostica la afluencia vehicular para los siguientes 7 días e identifica las horas pico (ej. 11:00 AM - 1:00 PM).
- **`/predict/maintenance`**: Telemetría de desgaste preventivo (horas de operación de la bomba triplex, vibración en mm/s, ciclos restantes antes del próximo mantenimiento).
- **`/stats/overview`**: Precisión estadística del modelo ($R^2 > 93.8\%$).

---

## 🚀 Guía de Puesta en Marcha

### 1. Iniciar Microservicio Python
```bash
cd backend-ml-python
pip install -r requirements.txt
python main.py
```

### 2. Iniciar Backend NestJS
```bash
cd backend-nest
npm install
npm run start:dev
```
*Credenciales de Administrador creadas automáticamente:*
- **Usuario:** `admin@carwash.com`
- **Contraseña:** `AdminCarWash2026!`

### 3. Iniciar Frontend React (Kiosco y Dashboard)
```bash
cd frontend-react
npm install
npm run dev
```
Abre en tu navegador `http://localhost:5173`.
