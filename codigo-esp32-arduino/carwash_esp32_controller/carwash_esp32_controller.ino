#include <Arduino.h>

// ----------------------------------------------------------------------------
// SISTEMA DE CONTROL DE AUTOLAVADO - CONTROLADOR IOT ESP32
// ----------------------------------------------------------------------------

// Pines del sistema
const int PIN_VARILLA_AVANCE  = 14;
const int PIN_VARILLA_REVERSA = 25;
const int PIN_ESPONJA_1       = 32;
const int PIN_ESPONJA_2       = 33;

const int PIN_RELE_CHAMPU   = 17; // Rele 3 (LOW = ON)
const int PIN_RELE_ENJUAGUE = 22; // Rele 2 (LOW = ON)
const int PIN_RELE_SECADOR  = 23; // Rele 1 (LOW = ON)

// Tiempos de operacion (ms)
const unsigned long TIEMPO_LLEGADA_BOMBA1_MS = 700;
const unsigned long TIEMPO_ROCIADO_LENTO_MS  = 1500;
const unsigned long TIEMPO_VIAJE_ESPONJAS_MS = 2600;
const unsigned long TIEMPO_ESPONJAS_LENTO_MS = 2000;
const unsigned long TIEMPO_VIAJE_ENJUAGUE_MS = 1300;
const unsigned long TIEMPO_ENJUAGUE_LENTO_MS = 2400;
const unsigned long TIEMPO_VIAJE_SECADOR_MS  = 1360;
const unsigned long TIEMPO_SECADOR_QUIETO_MS = 2000;

// Tiempos de retorno (ms)
const unsigned long TIEMPO_RET_SECADOR_MS       = 500;
const unsigned long TIEMPO_RET_B2_A_ESPONJAS_MS = 1300;
const unsigned long TIEMPO_RETORNO_A_CERO_MS    = 560;
const unsigned long TIEMPO_RETORNO_CICLO_MS     = 10860;

bool hayParadaEmergencia = false;

void apagarTodo() {
  digitalWrite(PIN_RELE_CHAMPU, HIGH);
  digitalWrite(PIN_RELE_ENJUAGUE, HIGH);
  digitalWrite(PIN_RELE_SECADOR, HIGH);

  digitalWrite(PIN_ESPONJA_1, LOW);
  digitalWrite(PIN_ESPONJA_2, LOW);
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
}

// Freno electronico activo (Dynamic Braking)
void frenarVarilla() {
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  delay(40);
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
}

bool revisarEmergencia() {
  if (hayParadaEmergencia) return true;
  if (Serial.available() > 0) {
    char c = Serial.peek();
    if (c == 'p' || c == 'P' || c == 's' || c == 'S' || c == '!') {
      Serial.read();
      hayParadaEmergencia = true;
      apagarTodo();
      Serial.println("EVENT_STOPPED");
      return true;
    }
    String s = Serial.readStringUntil('\n');
    s.trim();
    if (s.indexOf("STOP") != -1 || s.indexOf("EMERGENCY") != -1 || s.indexOf("PARADA") != -1) {
      hayParadaEmergencia = true;
      apagarTodo();
      Serial.println("EVENT_STOPPED");
      return true;
    }
  }
  return false;
}

bool delayContinuo(unsigned long ms) {
  unsigned long start = millis();
  while (millis() - start < ms) {
    if (revisarEmergencia()) return false;
    delay(10);
  }
  return true;
}

bool retrocederContinuo(unsigned long ms) {
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  if (!delayContinuo(ms)) return false;
  frenarVarilla();
  return true;
}

bool retrocederPulsado(unsigned long duracionMs, int onMs, int offMs) {
  unsigned long t0 = millis();
  while (millis() - t0 < duracionMs) {
    if (revisarEmergencia()) return false;
    digitalWrite(PIN_VARILLA_REVERSA, HIGH);
    delay(onMs);
    digitalWrite(PIN_VARILLA_REVERSA, LOW);
    delay(offMs);
  }
  frenarVarilla();
  return true;
}

void aplicarChampuConAvanceLento() {
  digitalWrite(PIN_RELE_CHAMPU, LOW);

  unsigned long t0 = millis();
  while (millis() - t0 < TIEMPO_ROCIADO_LENTO_MS) {
    if (revisarEmergencia()) return;
    digitalWrite(PIN_VARILLA_AVANCE, HIGH);
    delay(50);
    digitalWrite(PIN_VARILLA_AVANCE, LOW);
    delay(50);
  }
  frenarVarilla();
  digitalWrite(PIN_RELE_CHAMPU, HIGH);
}

void aplicarEsponjasConAvanceSuave() {
  unsigned long t0 = millis();
  while (millis() - t0 < TIEMPO_ESPONJAS_LENTO_MS) {
    if (revisarEmergencia()) return;
    digitalWrite(PIN_ESPONJA_1, HIGH);
    digitalWrite(PIN_ESPONJA_2, LOW);
    digitalWrite(PIN_VARILLA_AVANCE, HIGH);
    delay(45);

    digitalWrite(PIN_VARILLA_AVANCE, LOW);
    digitalWrite(PIN_ESPONJA_1, LOW);
    delay(55);
  }
  digitalWrite(PIN_ESPONJA_1, LOW);
  digitalWrite(PIN_ESPONJA_2, LOW);
  frenarVarilla();
}

void aplicarEnjuagueConAvanceSuave() {
  digitalWrite(PIN_RELE_ENJUAGUE, LOW);

  unsigned long t0 = millis();
  while (millis() - t0 < TIEMPO_ENJUAGUE_LENTO_MS) {
    if (revisarEmergencia()) return;
    digitalWrite(PIN_VARILLA_AVANCE, HIGH);
    delay(50);
    digitalWrite(PIN_VARILLA_AVANCE, LOW);
    delay(50);
  }
  frenarVarilla();
  digitalWrite(PIN_RELE_ENJUAGUE, HIGH);
}

void aplicarSecadorConAvance() {
  frenarVarilla();
  digitalWrite(PIN_RELE_SECADOR, LOW);

  if (!delayContinuo(TIEMPO_SECADOR_QUIETO_MS)) return;

  digitalWrite(PIN_RELE_SECADOR, HIGH);
  frenarVarilla();
}

void ejecutarCicloCompleto(String sessionId = "SESION-WEB") {
  hayParadaEmergencia = false;
  Serial.printf("STAGE_CHANGE:STAGE_STARTING:%s\n", sessionId.c_str());
  Serial.println("LOC:INICIO_A_BOMBA1:10");

  // Fase 1: Desplazamiento y aplicacion de champu
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_LLEGADA_BOMBA1_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_SHAMPOO:%s\n", sessionId.c_str());
  Serial.println("LOC:BOMBA_1_CHAMPU:20");
  aplicarChampuConAvanceLento();
  if (hayParadaEmergencia) return;

  // Fase 2: Desplazamiento y lavado con esponjas
  Serial.println("LOC:BOMBA1_A_ESPONJAS:35");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_ESPONJAS_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_SPONGES:%s\n", sessionId.c_str());
  Serial.println("LOC:ESPONJAS_ACTIVAS:50");
  aplicarEsponjasConAvanceSuave();
  if (hayParadaEmergencia) return;

  // Fase 3: Desplazamiento y enjuague
  Serial.println("LOC:ESPONJAS_A_ENJUAGUE:65");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_ENJUAGUE_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_RINSE:%s\n", sessionId.c_str());
  Serial.println("LOC:BOMBA_2_ENJUAGUE:75");
  aplicarEnjuagueConAvanceSuave();
  if (hayParadaEmergencia) return;

  // Fase 4: Desplazamiento y secado
  Serial.println("LOC:BOMBA2_A_SECADOR:85");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_SECADOR_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_FAN_DRYING:%s\n", sessionId.c_str());
  Serial.println("LOC:SECADOR_ABANICO:90");
  aplicarSecadorConAvance();
  if (hayParadaEmergencia) return;

  // Fase 5: Pausa antes de iniciar reversa
  frenarVarilla();
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
  if (!delayContinuo(500)) return;

  // Retorno a posicion inicial
  Serial.printf("STAGE_CHANGE:STAGE_RETURNING:%s\n", sessionId.c_str());
  Serial.println("LOC:RETORNO_A_INICIO:50");

  if (!retrocederContinuo(TIEMPO_RET_SECADOR_MS)) return;
  if (!retrocederPulsado(TIEMPO_ENJUAGUE_LENTO_MS, 50, 50)) return;
  if (!retrocederContinuo(TIEMPO_RET_B2_A_ESPONJAS_MS)) return;
  if (!retrocederPulsado(TIEMPO_ESPONJAS_LENTO_MS, 45, 55)) return;
  if (!retrocederContinuo(TIEMPO_VIAJE_ESPONJAS_MS)) return;
  if (!retrocederPulsado(TIEMPO_ROCIADO_LENTO_MS, 50, 50)) return;
  if (!retrocederContinuo(TIEMPO_RETORNO_A_CERO_MS)) return;

  frenarVarilla();

  Serial.printf("STAGE_CHANGE:STAGE_FINISHED:%s\n", sessionId.c_str());
  Serial.println("LOC:INICIO:0");
  Serial.printf("EVENT_FINISHED:%s\n", sessionId.c_str());

  while (Serial.available() > 0) Serial.read();
}

void setup() {
  Serial.begin(115200);
  Serial.setTimeout(50);
  delay(500);

  pinMode(PIN_RELE_CHAMPU, OUTPUT);
  pinMode(PIN_RELE_ENJUAGUE, OUTPUT);
  pinMode(PIN_RELE_SECADOR, OUTPUT);

  pinMode(PIN_ESPONJA_1, OUTPUT);
  pinMode(PIN_ESPONJA_2, OUTPUT);
  pinMode(PIN_VARILLA_AVANCE, OUTPUT);
  pinMode(PIN_VARILLA_REVERSA, OUTPUT);

  apagarTodo();
  while (Serial.available() > 0) Serial.read();
  Serial.println("SISTEMA_AUTOLAVADO_LISTO");
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.peek();
    if (c == 'p' || c == 'P' || c == 's' || c == 'S' || c == '!') {
      Serial.read();
      hayParadaEmergencia = true;
      apagarTodo();
      Serial.println("EVENT_STOPPED");
      return;
    }

    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.length() == 0) return;

    if (cmd == "c" || cmd == "C" || cmd.startsWith("CMD:START_WASH")) {
      String sesId = "SESION-WEB";
      int firstColon = cmd.indexOf(':');
      int secondColon = (firstColon != -1) ? cmd.indexOf(':', firstColon + 1) : -1;
      int thirdColon = (secondColon != -1) ? cmd.indexOf(':', secondColon + 1) : -1;

      if (secondColon != -1) {
        if (thirdColon != -1) {
          sesId = cmd.substring(secondColon + 1, thirdColon);
        } else {
          sesId = cmd.substring(secondColon + 1);
        }
      }
      sesId.trim();
      if (sesId.length() == 0) sesId = "LAVADO-MANUAL";

      if (hayParadaEmergencia) {
        Serial.println("BLOQUEADO_POR_EMERGENCIA");
        return;
      }

      while (Serial.available() > 0) Serial.read();
      ejecutarCicloCompleto(sesId);
      while (Serial.available() > 0) Serial.read();
    } else if (cmd.indexOf("STOP") != -1 || cmd.indexOf("EMERGENCY") != -1 || cmd.indexOf("PARADA") != -1) {
      hayParadaEmergencia = true;
      apagarTodo();
      Serial.println("EVENT_STOPPED");
    } else if (cmd == "CMD:RESUME" || cmd == "r" || cmd == "R" || cmd.indexOf("RESUME") != -1) {
      hayParadaEmergencia = false;
      apagarTodo();
      Serial.println("EVENT_RESUMED");
    }
  }
}
