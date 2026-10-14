/**
 * ============================================================================
 * SISTEMA DE AUTOLAVADO INTELIGENTE - CONTROLADOR ARDUINO
 * ============================================================================
 * Hardware Real:
 *  - Servomotor: Talanquera de Entrada (Pin 11)
 *  - Sensor Ultrasónico de Posición: HC-SR04 (Trig Pin 12, Echo Pin 13)
 *  - Relé 1 (Pin 4): Bomba de Agua con Shampoo
 *  - Relé 2 (Pin 5): Motor de Esponjas / Cepillos de frotado
 *  - Relé 3 (Pin 6): Bomba de Agua para Enjuagar
 *  - Relé 4 (Pin 7): Abanico / Turbina de Secado de Aire
 *  - Relé 5 (Pin 9): Semáforo Rojo
 *  - Relé 6 (Pin 10): Semáforo Verde
 *
 * Comunicación Serial UART @ 9600 baud con Backend NestJS
 * ============================================================================
 */

#include <Servo.h>

// Definición de Pines de Actuadores (Lógica invertida de Relés: LOW = ON, HIGH = OFF)
#define RELAY_WATER_SHAMPOO     4   // Relé 1: Agua con Shampoo
#define RELAY_SPONGES_MOTOR     5   // Relé 2: Motor de Esponjas
#define RELAY_WATER_RINSE       6   // Relé 3: Agua para Enjuagar
#define RELAY_DRYING_FAN        7   // Relé 4: Abanico / Turbina de Secado
#define RELAY_STATUS_LIGHT_RED  9   // Semáforo Rojo / Alto
#define RELAY_STATUS_LIGHT_GREEN 10 // Semáforo Verde / Pase adelante

// Servomotor de Talanquera
#define SERVO_BARRIER_PIN       11

// Sensor Ultrasónico de Posicionamiento
#define TRIG_PIN                12
#define ECHO_PIN                13

Servo barrierServo;

String currentSessionId = "";
bool isWashing = false;
unsigned long stageTimer = 0;
int currentStage = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) { ; }

  // Configurar Pines
  pinMode(RELAY_WATER_SHAMPOO, OUTPUT);
  pinMode(RELAY_SPONGES_MOTOR, OUTPUT);
  pinMode(RELAY_WATER_RINSE, OUTPUT);
  pinMode(RELAY_DRYING_FAN, OUTPUT);
  pinMode(RELAY_STATUS_LIGHT_RED, OUTPUT);
  pinMode(RELAY_STATUS_LIGHT_GREEN, OUTPUT);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Inicializar todo apagado
  turnOffAllRelays();
  digitalWrite(RELAY_STATUS_LIGHT_RED, LOW);   // Luz Roja Encendida
  digitalWrite(RELAY_STATUS_LIGHT_GREEN, HIGH);// Luz Verde Apagada

  // Talanquera cerrada a 0 grados
  barrierServo.attach(SERVO_BARRIER_PIN);
  barrierServo.write(0);

  Serial.println("STATUS:ARDUINO_ONLINE:HARDWARE_READY");
}

void loop() {
  // Escuchar comandos seriales desde NestJS
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() > 0) {
      handleSerialCommand(cmd);
    }
  }

  // Secuencia de lavado según la máquina de estados
  if (isWashing) {
    runWashCycle();
  }
}

void handleSerialCommand(String cmd) {
  if (cmd.startsWith("CMD:OPEN_BARRIER:")) {
    currentSessionId = cmd.substring(17);
    openBarrier();
  } 
  else if (cmd.startsWith("CMD:START_WASH:")) {
    // Ejemplo: CMD:START_WASH:sessionId:LAVADO_COMPLETO
    int idx = cmd.indexOf(':', 15);
    currentSessionId = (idx != -1) ? cmd.substring(15, idx) : cmd.substring(15);
    startWashCycle();
  } 
  else if (cmd.equals("CMD:EMERGENCY_STOP")) {
    emergencyStop();
  }
}

void openBarrier() {
  digitalWrite(RELAY_STATUS_LIGHT_RED, HIGH);
  digitalWrite(RELAY_STATUS_LIGHT_GREEN, LOW); // Verde

  // Elevar brazo talanquera a 90 grados
  for (int pos = 0; pos <= 90; pos += 5) {
    barrierServo.write(pos);
    delay(20);
  }

  Serial.print("EVENT_BARRIER_OPENED:");
  Serial.println(currentSessionId);
}

void startWashCycle() {
  isWashing = true;
  currentStage = 1;
  stageTimer = millis();

  // Cerrar talanquera para seguridad
  barrierServo.write(0);
  digitalWrite(RELAY_STATUS_LIGHT_RED, LOW);
  digitalWrite(RELAY_STATUS_LIGHT_GREEN, HIGH);

  // FASE 1: Agua con Shampoo
  setStageShampoo();
}

void runWashCycle() {
  unsigned long elapsed = millis() - stageTimer;

  switch (currentStage) {
    case 1: // Agua con Shampoo (18 segundos)
      if (elapsed > 18000) {
        setStageSponges();
      }
      break;

    case 2: // Esponjas mecánicas (22 segundos)
      if (elapsed > 22000) {
        setStageRinse();
      }
      break;

    case 3: // Agua para Enjuagar (20 segundos)
      if (elapsed > 20000) {
        setStageFanDrying();
      }
      break;

    case 4: // Abanico de secado (25 segundos)
      if (elapsed > 25000) {
        finishCycle();
      }
      break;
  }
}

// 1. FASE: Agua con Shampoo
void setStageShampoo() {
  currentStage = 1;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_WATER_SHAMPOO, LOW); // Encender bomba agua con shampoo

  Serial.print("STAGE_CHANGE:STAGE_SHAMPOO:");
  Serial.println(currentSessionId);
}

// 2. FASE: Esponjas
void setStageSponges() {
  currentStage = 2;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_SPONGES_MOTOR, LOW); // Encender motor esponjas

  Serial.print("STAGE_CHANGE:STAGE_SPONGES:");
  Serial.println(currentSessionId);
}

// 3. FASE: Agua para Enjuagar
void setStageRinse() {
  currentStage = 3;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_WATER_RINSE, LOW); // Encender agua limpia enjuague

  Serial.print("STAGE_CHANGE:STAGE_RINSE:");
  Serial.println(currentSessionId);
}

// 4. FASE: Abanico de Secado
void setStageFanDrying() {
  currentStage = 4;
  stageTimer = millis();
  turnOffAllRelays();
  digitalWrite(RELAY_DRYING_FAN, LOW); // Encender abanico / turbina secado

  Serial.print("STAGE_CHANGE:STAGE_FAN_DRYING:");
  Serial.println(currentSessionId);
}

// FINALIZADO
void finishCycle() {
  isWashing = false;
  currentStage = 0;
  turnOffAllRelays();

  // Abrir talanquera de salida y semáforo verde
  barrierServo.write(90);
  digitalWrite(RELAY_STATUS_LIGHT_RED, HIGH);
  digitalWrite(RELAY_STATUS_LIGHT_GREEN, LOW);

  Serial.print("EVENT_FINISHED:");
  Serial.println(currentSessionId);
}

void turnOffAllRelays() {
  digitalWrite(RELAY_WATER_SHAMPOO, HIGH);
  digitalWrite(RELAY_SPONGES_MOTOR, HIGH);
  digitalWrite(RELAY_WATER_RINSE, HIGH);
  digitalWrite(RELAY_DRYING_FAN, HIGH);
}

void emergencyStop() {
  isWashing = false;
  currentStage = 0;
  turnOffAllRelays();
  barrierServo.write(0);
  digitalWrite(RELAY_STATUS_LIGHT_RED, LOW);
  digitalWrite(RELAY_STATUS_LIGHT_GREEN, HIGH);
  Serial.println("STATUS:EMERGENCY_STOPPED");
}
