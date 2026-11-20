# Firmware ESP32 - Controlador Automatizado de Bahia IoT

Este directorio contiene el codigo de control para el microcontrolador ESP32 encargado de operar los actuadores de la bahia de autolavado sincronizado con la plataforma en la nube mediante comunicacion serial y WebSockets.

---

## Estructura del Directorio

* `carwash_esp32_controller/carwash_esp32_controller.ino`: Codigo fuente principal para Arduino IDE.
* `README.md`: Documentacion tecnica de pines, tiempos de ciclo y protocolo de comunicacion.

---

## Mapa de Conexiones (Pinout ESP32)

| Componente | Pin ESP32 (GPIO) | Tipo | Nivel Activo / Funcion |
| :--- | :---: | :---: | :--- |
| Bomba 1 (Champu) | GPIO 17 | Salida Digital | Rele 3 (LOW = Activado) |
| Bomba 2 (Enjuague) | GPIO 22 | Salida Digital | Rele 2 (LOW = Activado) |
| Ventilador (Secador) | GPIO 23 | Salida Digital | Rele 1 (LOW = Activado) |
| Motor Esponja 1 | GPIO 32 | Salida Digital | Driver Esponjas (HIGH = ON) |
| Motor Esponja 2 | GPIO 33 | Salida Digital | Referencia Esponja (LOW) |
| Motor Varilla (Avance) | GPIO 14 | Salida Digital / PWM | Puente H L298N (Traccion hacia adelante) |
| Motor Varilla (Reversa) | GPIO 25 | Salida Digital / PWM | Puente H L298N (Retorno a Punto Cero) |
| Comunicacion Serial | UART0 (TX0/RX0) | Serial 115200 | Comunicacion con Gateway Bridge |

---

## Tiempos de Operacion Calibrados

### 1. Ida (Avance hacia el Secador): Total = 11.86 segundos
* Punto 0 a Bomba 1: 700 ms (0.70 s).
* Estacion Champu: 1500 ms (1.50 s) con modulacion de traccion al 50%.
* Trayecto a Esponjas: 2600 ms (2.60 s).
* Estacion Esponjas: 2000 ms (2.00 s) con traccion y frotado al 45%.
* Trayecto a Bomba 2: 1300 ms (1.30 s).
* Estacion Enjuague: 2400 ms (2.40 s).
* Trayecto al Secador: 1360 ms (1.36 s).
* Secado Estatico: 2000 ms (2.00 s).

### 2. Regreso (Retorno a Punto Cero): Total = 10.86 segundos
* Secador a Bomba 2: 500 ms (0.50 s).
* Bomba 2 a Esponjas: 1300 ms (1.30 s).
* Paso bajo Esponjas: 2000 ms (2.00 s).
* Esponjas a Bomba 1: 2600 ms (2.60 s).
* Paso bajo Bomba 1: 1500 ms (1.50 s).
* Bomba 1 a Punto Cero: 560 ms (0.56 s).

---

## Caracteristicas Tecnicas

### 1. Freno Electronico Activo (Dynamic Braking)
Para neutralizar la inercia mecanica del motorreductor al detenerse, se implementa un cortocircuito temporal de 40 ms en ambas salidas del puente H:
```cpp
void frenarVarilla() {
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  delay(40);
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
}
```

### 2. Parada de Emergencia
El firmware evalua el buffer UART cada 10 ms durante los desplazamientos. Al recibir una orden de interrupcion, desenergiza de inmediato todos los actuadores y detiene el carro.

### 3. Protocolo de Telemetria UART
* `STAGE_CHANGE:STAGE_SHAMPOO:<sesionId>`
* `STAGE_CHANGE:STAGE_SPONGES:<sesionId>`
* `STAGE_CHANGE:STAGE_RINSE:<sesionId>`
* `STAGE_CHANGE:STAGE_FAN_DRYING:<sesionId>`
* `STAGE_CHANGE:STAGE_RETURNING:<sesionId>`
* `STAGE_CHANGE:STAGE_FINISHED:<sesionId>`
* `EVENT_FINISHED:<sesionId>`
* `EVENT_STOPPED`

---

## Instrucciones de Compilacion y Carga

1. Conectar la placa ESP32 por cable USB a la computadora.
2. Abrir Arduino IDE.
3. Abrir el archivo `carwash_esp32_controller/carwash_esp32_controller.ino`.
4. Seleccionar la placa DOIT ESP32 DEVKIT V1 y el puerto COM correspondiente.
5. Cargar el programa y configurar el Monitor Serial a 115200 baudios.
