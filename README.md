# AutoWash Prime V3 - Sistema Automatizado IoT

Sistema integral de autolavado inteligente basado en arquitectura limpia, con control de actuadores en Hardware IoT (ESP32), pasarela de pagos Wompi, backend en NestJS y PostgreSQL, microservicio de analitica predictiva en Python (FastAPI y Machine Learning) y frontend en React (Kiosco para clientes y panel administrativo).

---

## Arquitectura General

```text
CarWash V3/
├── backend-nest/                 # API Principal en NestJS, PostgreSQL y WebSockets
│   ├── src/
│   │   ├── common/               # Guards, decoradores y enums compartidos
│   │   ├── modules/
│   │   │   ├── auth/             # Autenticacion JWT y administracion de usuarios
│   │   │   ├── hardware/         # Servicio de integracion IoT y emulador de pruebas
│   │   │   ├── payments/         # Integracion Wompi y firma SHA-256
│   │   │   ├── wash/             # Controladores de lavado (cliente y admin) y WebSockets
│   │   │   └── analytics/        # Orquestacion con el microservicio de analitica
│   │   └── main.ts               # Punto de entrada de la aplicacion
│   └── Dockerfile
│
├── backend-ml-python/            # Microservicio de IA y Analitica Predictiva
│   ├── main.py                   # API FastAPI (/predict/demand, /predict/maintenance)
│   ├── predictor.py              # Algoritmos de Machine Learning (RandomForest y Series de Tiempo)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend-react/               # Aplicacion React y Vite (Kiosco y Dashboard)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── client/           # Kiosco de clientes y visualizador de lavado en vivo
│   │   │   └── admin/            # Panel administrativo y analitica predictiva
│   │   └── shared/               # Componentes y clientes HTTP/WebSocket
│   └── Dockerfile
│
├── codigo-esp32-arduino/         # Firmware para ESP32
│   ├── carwash_esp32_controller/ # Codigo fuente en C++ para Arduino IDE
│   └── README.md                 # Documentacion tecnica de conexion y tiempos calibrados
│
├── gateway-bridge.js             # Puente local serial (COM3) hacia el servidor en la nube
└── docker-compose.yml            # Orquestacion de servicios en Azure
```

---

## Seguridad y Politicas de Acceso

### Rutas de la API (NestJS)
* **Rutas publicas (`/api/client/**`):** Permiten la operacion del kiosco y la consulta de estado de lavado sin requerir credenciales de usuario.
* **Rutas administrativas (`/api/admin/**`):** Protegidas mediante `JwtAuthGuard` y `RolesGuard` con rol estricto `ADMIN`. Solicitudes no autenticadas reciben respuesta `401 Unauthorized` o `403 Forbidden`.

---

## Modulo IoT y Controlador de Bahia

El microcontrolador ESP32 gestiona el desplazamiento mecanico y las estaciones de lavado:

| Componente | Pin ESP32 (GPIO) | Tipo | Nivel Activo / Funcion |
| :--- | :---: | :---: | :--- |
| Bomba 1 (Champu) | GPIO 17 | Salida Digital | Rele 3 (LOW = Activado) |
| Bomba 2 (Enjuague) | GPIO 22 | Salida Digital | Rele 2 (LOW = Activado) |
| Ventilador (Secador) | GPIO 23 | Salida Digital | Rele 1 (LOW = Activado) |
| Motor Esponjas | GPIO 32 / 33 | Salida Digital | Driver puente H (Rotacion de rodillos) |
| Motor Varilla (Traccion) | GPIO 14 / 25 | Salida Digital / PWM | Puente H L298N (Avance y reversa guiada) |

---

## Microservicio de Analitica Predictiva (Python)

El microservicio corre en FastAPI y expone los siguientes endpoints:
* `GET /predict/demand`: Proyeccion de demanda semanal, distribucion horaria e ingresos estimados.
* `GET /predict/maintenance`: Monitoreo de ciclos de operacion y estimacion de vida util restante (RUL) de los componentes fisicos.
* `GET /stats/overview`: Metricas de precision del modelo entrenado (R2 score y error absoluto medio).

---

## Despliegue con Docker

Para iniciar todos los servicios del proyecto:
```bash
docker compose up -d --build
```

Servicios desplegados:
* `carwash_postgres`: Base de datos relacional (puerto 5432).
* `carwash_python_ml`: Microservicio FastAPI de Machine Learning (puerto 8000).
* `carwash_backend_nest`: API principal de NestJS (puerto 3000).
* `carwash_frontend_react`: Servidor web Nginx con el bundle compilado de React (puerto 80).
