#  Firmware ESP32 - Controlador Automatizado de Bahía IoT

Este directorio contiene el firmware en C++ para el módulo **ESP32** (NodeMCU-32S, ESP32 DevKit V1 o equivalente) encargado de operar los actuadores, la talanquera de acceso y los sensores de la bahía de lavado.

---

##  Mapa de Pines (GPIO ESP32)

| Componente | Pin ESP32 (GPIO) | Tipo | Función |
| :--- | :--- | :--- | :--- |
| **Relé 1 (Shampoo y Espuma)** | `GPIO 13` | Salida Digital | Inyección de químicos y espuma activa |
| **Relé 2 (Motor Esponjas)** | `GPIO 12` | Salida Digital | Movimiento de rodillos Soft-Touch |
| **Relé 3 (Bomba Enjuague)** | `GPIO 14` | Salida Digital | Bomba hidro-jet de aclarado a 180 Bar |
| **Relé 4 (Turbina AeroDry)** | `GPIO 27` | Salida Digital | Turbina de secado ciclónico |
| **Servomotor Talanquera** | `GPIO 18` | Salida PWM | Apertura (90°) y cierre (0°) de barrera |
| **Sensor HC-SR04 Trigger** | `GPIO 5` | Salida Digital | Pulso sónico de medición de distancia |
| **Sensor HC-SR04 Echo** | `GPIO 19` | Entrada Digital | Recepción de eco para detectar vehículo |
| **LED Indicador de WiFi** | `GPIO 2` | Salida Digital | LED azul (parpadea conectando, fijo conectado) |

---

##  Requisitos de Compilación

1. **Arduino IDE** (v2.0+) o **VS Code + PlatformIO**.
2. **Placa ESP32 en el gestor de tarjetas**:
   - URL de tarjetas adicionales: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tarjeta seleccionada: `DOIT ESP32 DEVKIT V1` o `ESP32 Dev Module`.
3. **Bibliotecas requeridas**:
   - `ESP32Servo` (por Kevin Harrington)
   - `ArduinoJson` (v6 o v7 por Benoît Blanchon)

---

##  Pasos de Instalación y Puesta en Marcha

1. Abre el archivo `esp32/carwash_esp32_controller.ino`.
2. Edita las variables de red en la cabecera:
   ```cpp
   const char* WIFI_SSID     = "TU_RED_WIFI";
   const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";
   const char* BACKEND_EVENT_URL = "http://192.168.1.100:3000/api/hardware/esp32-event";
   ```
3. Conecta tu ESP32 por USB y selecciona el puerto COM correspondiente.
4. Presiona **Subir (Upload)**.
5. Abre el Monitor Serial a **115200 baudios** para ver la IP asignada (ejemplo: `192.168.1.150`).
6. Coloca esa IP en la variable de entorno `ESP32_WIFI_IP` en el archivo `.env` del backend NestJS:
   ```env
   ESP32_WIFI_IP=192.168.1.150
   ```

---

##  Contrato de Comunicación (Endpoints HTTP de la Bahía)

Cuando programes el ESP32 en tu otra aplicación (Arduino IDE, PlatformIO, etc.), solo debes asegurarte de que tu firmware implemente o consuma los siguientes canales de conexión:

### 1. Backend NestJS ➔ ESP32 (Peticiones que esta app envía al ESP32)
El ESP32 debe escuchar en el puerto `80`:
- **`GET /status`**: Retorna el estado en formato JSON (salud de relés, talanquera, WiFi y distancia del sensor).
- **`GET /open-barrier?sessionId=xxx`**: Ordena levantar la talanquera (90°) para dar paso al vehículo.
- **`GET /start-wash?sessionId=xxx&plan=xxx`**: Inicia las etapas de lavado (Shampoo, Rodillos, Enjuague, Secado).
- **`GET /emergency-stop`**: Apaga y desenergiza inmediatamente todos los actuadores y bombas.
- **`GET /resume`**: Rearma el sistema y reanuda la operación por orden explícita del administrador.

---

### 2. ESP32 ➔ Backend NestJS (Webhooks / Notificaciones hacia esta app)
Cuando el ESP32 detecte un evento o avance de fase, puede enviar un `POST` HTTP al backend:
- **URL**: `http://<IP_SERVIDOR>:3000/api/hardware/event` (o `/api/hardware/esp32-event`)
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "type": "CAR_DETECTED",
    "sessionId": "wash-12345",
    "stage": "STAGE_SHAMPOO"
  }
  ```
  *Valores válidos para `type`:* `BARRIER_OPENED`, `CAR_DETECTED`, `STAGE_CHANGE`, `FINISHED`, `ERROR`.

---

##  Respaldo por Cable USB (Serial UART a 115200 Baudios)

Si decides conectar el ESP32 directamente por cable USB a la computadora/servidor:
* **Esta app envía al ESP32:**
  - `CMD:OPEN_BARRIER:{sessionId}\n`
  - `CMD:START_WASH:{sessionId}:{plan}\n`
  - `CMD:EMERGENCY_STOP\n`
  - `CMD:RESUME\n`
* **Tu programa en el ESP32 debe imprimir por Serial:**
  - `EVENT_CAR_DETECTED:{sessionId}\n`
  - `EVENT_BARRIER_OPENED:{sessionId}\n`
  - `STAGE_CHANGE:{stage}:{sessionId}\n`
  - `EVENT_FINISHED:{sessionId}\n`

---

##  Configuración en CarWash V3 (`.env`)

En el archivo `.env` de esta aplicación, solo necesitas configurar cómo te conectarás a tu ESP32:
```env
# Conexión por WiFi (Recomendada):
ESP32_WIFI_IP=192.168.1.150

# Conexión por Cable USB Serial (Alternativa):
ESP32_PORT=COM3
ESP32_BAUDRATE=115200
```
> **Nota de Simulación:** Si el ESP32 aún no está conectado porque lo estás programando en tu otra app, este software activará automáticamente el **Modo Emulación**, permitiéndote probar la web, los pagos y el panel de administración sin trabas.
