/**
 * ============================================================================
 * SISTEMA DE AUTOLAVADO - CONTROLADOR ARDUINO / ESP32 / ESP8266 VÍA WIFI
 * ============================================================================
 * Este sketch permite que tu Arduino / ESP32 se comunique INALÁMBRICAMENTE
 * con el Backend NestJS a través de tu red WiFi local.
 *
 * Ventajas sobre cable USB:
 *  - Puedes instalar la placa dentro del tablero eléctrico del autolavado a 50m.
 *  - No requiere tener la computadora pegada al Arduino por cable USB.
 *
 * Hardware Soportado:
 *  - ESP32 DevKit (Recomendado $4-5 USD)
 *  - ESP8266 NodeMCU / D1 Mini
 *  - Arduino Uno R4 WiFi / Arduino Uno R3 con módulo ESP-01
 * ============================================================================
 */

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
  #include <ESP8266HTTPClient.h>
  #include <Servo.h>
  ESP8266WebServer server(80);
#elif defined(ESP32)
  #include <WiFi.h>
  #include <WebServer.h>
  #include <HTTPClient.h>
  #include <ESP32Servo.h>
  WebServer server(80);
#else
  // Si usas Arduino Uno R3 clásico con ESP-01 por comandos AT
  #include <SoftwareSerial.h>
  #include <Servo.h>
#endif

// ==========================================
// CONFIGURACIÓN DE TU RED WIFI LOCAL
// ==========================================
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";

// Dirección IP del computador o servidor donde corre NestJS (ej: 192.168.1.50)
const char* NESTJS_SERVER_IP = "http://192.168.1.50:3000/api/hardware/arduino-event";

// Definición de Pines de Relés (Lógica invertida: LOW = Encendido, HIGH = Apagado)
#define RELAY_WATER_SHAMPOO     4   // Relé 1: Agua con Shampoo
#define RELAY_SPONGES_MOTOR     5   // Relé 2: Motor de Esponjas
#define RELAY_WATER_RINSE       6   // Relé 3: Agua para Enjuagar
#define RELAY_DRYING_FAN        7   // Relé 4: Abanico de Secado
#define RELAY_LIGHT_RED         9   // Semáforo Rojo
#define RELAY_LIGHT_GREEN       10  // Semáforo Verde
#define SERVO_BARRIER_PIN       11  // Servomotor Talanquera

Servo barrierServo;

String currentSessionId = "";
bool isWashing = false;
unsigned long stageTimer = 0;
int currentStage = 0;

void setup() {
  Serial.begin(115200);
  delay(500);

  // Configurar Pines
  pinMode(RELAY_WATER_SHAMPOO, OUTPUT);
  pinMode(RELAY_SPONGES_MOTOR, OUTPUT);
  pinMode(RELAY_WATER_RINSE, OUTPUT);
  pinMode(RELAY_DRYING_FAN, OUTPUT);
  pinMode(RELAY_LIGHT_RED, OUTPUT);
  pinMode(RELAY_LIGHT_GREEN, OUTPUT);

  turnOffAllRelays();
  digitalWrite(RELAY_LIGHT_RED, LOW);   // Rojo encendido
  digitalWrite(RELAY_LIGHT_GREEN, HIGH);// Verde apagado

  barrierServo.attach(SERVO_BARRIER_PIN);
  barrierServo.write(0); // Talanquera cerrada

  // Conectar a la red WiFi
  Serial.println("\n[WIFI] Conectando a red WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WIFI] ¡Conexión Exitosa!");
  Serial.print("[WIFI] Dirección IP Asignada al Arduino: ");
  Serial.println(WiFi.localIP());

  // Rutas del Servidor Web embebido en Arduino para recibir órdenes de NestJS
  server.on("/open-barrier", handleOpenBarrier);
  server.on("/start-wash", handleStartWash);
  server.on("/emergency-stop", handleEmergencyStop);
  server.begin();
  Serial.println("[HTTP] Servidor Web de Control activo en puerto 80.");
}

void loop() {
  server.handleClient();

  if (isWashing) {
    runWashCycle();
  }
}

// -------------------------------------------------------------
// Controladores HTTP (Órdenes recibidas desde NestJS por WiFi)
// -------------------------------------------------------------
void handleOpenBarrier() {
  currentSessionId = server.arg("sessionId");
  Serial.println("[ORDEN] Abrir talanquera para sesión: " + currentSessionId);

  digitalWrite(RELAY_LIGHT_RED, HIGH);
  digitalWrite(RELAY_LIGHT_GREEN, LOW);

  for (int pos = 0; pos <= 90; pos += 5) {
    barrierServo.write(pos);
    delay(20);
  }

  server.send(200, "application/json", "{\"status\":\"BARRIER_OPENED\"}");
  notifyNestJSEvent("BARRIER_OPENED", "");
}

void handleStartWash() {
  currentSessionId = server.arg("sessionId");
  Serial.println("[ORDEN] Iniciar lavado para sesión: " + currentSessionId);

  isWashing = true;
  currentStage = 1;
  stageTimer = millis();

  barrierServo.write(0); // Bajar talanquera
  digitalWrite(RELAY_LIGHT_RED, LOW);
  digitalWrite(RELAY_LIGHT_GREEN, HIGH);

  setStageShampoo();
  server.send(200, "application/json", "{\"status\":\"WASH_STARTED\"}");
}

void handleEmergencyStop() {
  isWashing = false;
  currentStage = 0;
  turnOffAllRelays();
  barrierServo.write(0);
  digitalWrite(RELAY_LIGHT_RED, LOW);
  digitalWrite(RELAY_LIGHT_GREEN, HIGH);
  server.send(200, "application/json", "{\"status\":\"EMERGENCY_STOPPED\"}");
  notifyNestJSEvent("ERROR", "EMERGENCY_STOP_TRIGGERED");
}

// -------------------------------------------------------------
// Máquina de Estados del Autolavado
// -------------------------------------------------------------
void runWashCycle() {
  unsigned long elapsed = millis() - stageTimer;

  switch (currentStage) {
    case 1: // Agua con Shampoo (18 segundos)
      if (elapsed > 18000) {
        setStageSponges();
      }
      break;

    case 2: // Esponjas (22 segundos)
      if (elapsed > 22000) {
        setStageRinse();
      }
      break;

    case 3: // Agua para Enjuagar (20 segundos)
      if (elapsed > 20000) {
        setStageFanDrying();
      }
      break;

    case 4: // Abanico de Secado (25 segundos)
      if (elapsed > 25000) {
        finishCycle();
      }
      break;
  }
}

void setStageShampoo() {
  currentStage = 1;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_WATER_SHAMPOO, LOW);
  notifyNestJSEvent("STAGE_CHANGE", "STAGE_SHAMPOO");
}

void setStageSponges() {
  currentStage = 2;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_SPONGES_MOTOR, LOW);
  notifyNestJSEvent("STAGE_CHANGE", "STAGE_SPONGES");
}

void setStageRinse() {
  currentStage = 3;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_WATER_RINSE, LOW);
  notifyNestJSEvent("STAGE_CHANGE", "STAGE_RINSE");
}

void setStageFanDrying() {
  currentStage = 4;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_DRYING_FAN, LOW);
  notifyNestJSEvent("STAGE_CHANGE", "STAGE_FAN_DRYING");
}

void finishCycle() {
  isWashing = false;
  currentStage = 0;
  turnOffAllRelays();

  barrierServo.write(90); // Talanquera arriba para salida
  digitalWrite(RELAY_LIGHT_RED, HIGH);
  digitalWrite(RELAY_LIGHT_GREEN, LOW);

  notifyNestJSEvent("FINISHED", "STAGE_FINISHED");
}

void turnOffAllRelays() {
  digitalWrite(RELAY_WATER_SHAMPOO, HIGH);
  digitalWrite(RELAY_SPONGES_MOTOR, HIGH);
  digitalWrite(RELAY_WATER_RINSE, HIGH);
  digitalWrite(RELAY_DRYING_FAN, HIGH);
}

// -------------------------------------------------------------
// Notificar eventos de cambio de fase a NestJS por HTTP POST
// -------------------------------------------------------------
void notifyNestJSEvent(String eventType, String stageName) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, NESTJS_SERVER_IP);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"type\":\"" + eventType + "\",\"sessionId\":\"" + currentSessionId + "\",\"stage\":\"" + stageName + "\"}";
    int httpResponseCode = http.POST(jsonPayload);
    Serial.printf("[HTTP NOTIFICACIÓN] Evento: %s -> Respuesta NestJS: %d\n", eventType.c_str(), httpResponseCode);
    http.end();
  }
}
