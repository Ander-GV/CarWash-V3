# 🚗 Firmware ESP32 - Controlador Automatizado de Bahía IoT (CarWash V3)

Este directorio contiene el código oficial y calibrado para el microcontrolador **ESP32** (NodeMCU-32S / DOIT ESP32 DevKit V1), encargado de operar de manera milimétrica la maqueta física de autolavado inteligente conectada a la nube de **Azure** mediante WebSockets.

---

## 📂 Estructura de esta Carpeta

* **`carwash_esp32_controller/carwash_esp32_controller.ino`**: Archivo fuente oficial de Arduino con calibración de tiempos y control de actuadores.
* **`README.md`**: Guía técnica, tabla de conexiones físicas, tiempos calibrados y protocolo de comunicación.

---

## 📌 Mapa de Conexiones Físicas (Pinout ESP32)

| Componente Físico | Pin ESP32 (GPIO) | Tipo | Nivel Activo / Función |
| :--- | :---: | :---: | :--- |
| **Bomba 1 (Champú)** | `GPIO 17` | Salida Digital | Relé 3 (LOW = Activado) |
| **Bomba 2 (Enjuague)** | `GPIO 22` | Salida Digital | Relé 2 (LOW = Activado) |
| **Turbina / Ventilador (Secador)** | `GPIO 23` | Salida Digital | Relé 1 (LOW = Activado) |
| **Motor Esponja 1** | `GPIO 32` | Salida Digital | Puente H / Driver Esponjas (HIGH = ON) |
| **Motor Esponja 2** | `GPIO 33` | Salida Digital | Retorno / Referencia Esponja (LOW) |
| **Motor Varilla (Avance)** | `GPIO 14` | Salida PWM / Dig. | Puente H L298N (Tracción hacia adelante) |
| **Motor Varilla (Reversa)** | `GPIO 25` | Salida PWM / Dig. | Puente H L298N (Retorno a Punto Cero) |
| **Comunicación Serial USB** | `UART0 (TX0/RX0)` | Serial 115200 | Comunicación con Gateway Bridge / Azure |

---

## ⏱️ Tiempos de Operación Calibrados (Fase por Fase)

La máquina cuenta con una calibración milimétrica para sincronizar el arrastre mecánico con el rociado químico y el secado térmico:

### 1. Ida (Avance hacia el Secador): Total = 11.86 segundos
1. **Punto 0 a Bomba 1:** `700 ms` (0.70 s) a velocidad crucero.
2. **Estación Champú:** `1500 ms` (1.50 s) con micro-pulsos al 50% de potencia para empapar uniformemente.
3. **Trayecto a Esponjas:** `2600 ms` (2.60 s) de viaje.
4. **Estación Esponjas:** `2000 ms` (2.00 s) con tracción suave (45% potencia) y frotado de rodillos.
5. **Trayecto a Bomba 2:** `1300 ms` (1.30 s) de viaje.
6. **Estación Enjuague:** `2400 ms` (2.40 s) de rociado continuo de agua limpia.
7. **Trayecto al Secador:** `1360 ms` (1.36 s) avance preciso bajo la campana del abanico.
8. **Secado Estático:** `2000 ms` (2.00 s) vehículo quieto con turbina a máxima potencia.

### 2. Regreso (Retorno Guiado a Punto Cero): Total = 10.86 segundos
* **Secador a Bomba 2:** `500 ms` (0.50 s) en reversa continua.
* **Bomba 2 a Esponjas:** `1300 ms` (1.30 s) en reversa continua.
* **Paso bajo Esponjas:** `2000 ms` (2.00 s) en reversa guiada.
* **Esponjas a Bomba 1:** `2600 ms` (2.60 s) en reversa continua.
* **Paso bajo Bomba 1:** `1500 ms` (1.50 s) en reversa guiada.
* **Bomba 1 a Punto Cero (Origen):** `560 ms` (0.56 s) clavado exacto en el punto inicial.

---

## 🛡️ Características Avanzadas de Ingeniería

### 1. Freno Dinámico Activo (Dynamic Braking)
Para contrarrestar la inercia del carro y evitar que se desplace por inercia al cortar la energía, el firmware implementa un cortocircuito momentáneo controlado (40 ms) en las bobinas del puente H:
```cpp
void frenarVarilla() {
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  delay(40); // Freno magnético inmediato
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
}
```

### 2. Parada de Emergencia No Bloqueante
Durante todas las fases de avance y retroceso, el microcontrolador muestrea el buffer UART cada 10 milisegundos (`revisarEmergencia()`). Si el operador presiona "Parada de Emergencia" en el Dashboard Web de React o envía una señal de interrupción, el sistema corta instantáneamente los relés y clava los motores.

### 3. Protocolo de Telemetría Serial
El firmware emite eventos en tiempo real legibles por el backend de NestJS y el cliente Web:
* `EVENT_STAGE:CHAMPU:<sesionId>`
* `EVENT_STAGE:ESPONJAS:<sesionId>`
* `EVENT_STAGE:ENJUAGUE:<sesionId>`
* `EVENT_STAGE:SECADO:<sesionId>`
* `EVENT_FINISHED:<sesionId>`
* `EVENT_STOPPED`

---

## 🚀 Cómo abrir y compilar en Arduino IDE

1. Conecta el ESP32 a tu computadora mediante un cable USB.
2. Abre **Arduino IDE**.
3. Ve a `Archivo` -> `Abrir...` y selecciona:
   `codigo-esp32-arduino/carwash_esp32_controller/carwash_esp32_controller.ino`
4. En **Herramientas**:
   * Placa: **DOIT ESP32 DEVKIT V1** (o ESP32 Dev Module).
   * Velocidad de subida: **921600** (o 115200).
   * Puerto: **COM3** (o el puerto detectado por tu PC).
5. Haz clic en **Subir (Upload)**.
6. Abre el **Monitor Serie** a **115200 baudios** para monitorear los eventos en vivo.
