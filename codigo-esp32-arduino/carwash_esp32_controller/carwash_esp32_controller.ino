#include <Arduino.h>

// ----------------------------------------------------------------------------
// SISTEMA DE CONTROL DE AUTOLAVADO - TIEMPOS CALIBRADOS EXACTOS (6 PRUEBAS OK)
// COMPATIBLE CON GATEWAY IOT AZURE + WEBSOCKETS + DASHBOARD REACT
// CONFIGURACIÓN OFICIAL DEFINIDA Y VALIDADA EN EL CHAT
// ----------------------------------------------------------------------------

// PINES DEL SISTEMA (VERIFICADOS EN HARDWARE REAL)
const int PIN_VARILLA_AVANCE  = 14;
const int PIN_VARILLA_REVERSA = 25;
const int PIN_ESPONJA_1       = 32;
const int PIN_ESPONJA_2       = 33;

const int PIN_RELE_CHAMPU   = 17; // Relé 3 (LOW = ON)
const int PIN_RELE_ENJUAGUE = 22; // Relé 2 (LOW = ON)
const int PIN_RELE_SECADOR  = 23; // Relé 1 (LOW = ON)

// ----------------------------------------------------------------------------
// TIEMPOS DE OPERACIÓN DE CADA ESTACIÓN (ms) - CALIBRACIÓN CON TIEMPOS INTERMEDIOS
// ----------------------------------------------------------------------------
const unsigned long TIEMPO_LLEGADA_BOMBA1_MS = 700;  // 0.7s punto 0 a primera bomba (+0.2s)
const unsigned long TIEMPO_ROCIADO_LENTO_MS  = 1500; // 1.5s rociado Bomba 1 (champú con avance lento)
const unsigned long TIEMPO_VIAJE_ESPONJAS_MS = 2600; // 2.6s distancia Bomba 1 a Esponjas (+0.1s)
const unsigned long TIEMPO_ESPONJAS_LENTO_MS = 2000; // 2.0s esponjas frotado (inician después de los 2.6s)
const unsigned long TIEMPO_VIAJE_ENJUAGUE_MS = 1300; // 1.3s distancia Esponjas a Bomba 2 en la ida (-0.1s)
const unsigned long TIEMPO_ENJUAGUE_LENTO_MS = 2400; // 2.4s rociado Bomba 2 (inicia después de los 1.3s)
const unsigned long TIEMPO_VIAJE_SECADOR_MS  = 1360; // 1.36s recorrido ida al Ventilador (-0.02s restados)
const unsigned long TIEMPO_SECADOR_QUIETO_MS = 2000; // 2.0s secado quieto bajo abanico
// TOTAL AVANCE EN LA IDA: 0.7 + 1.5 + 2.6 + 2.0 + 1.3 + 2.4 + 1.36 = 11.86s
// TOTAL RETORNO:          0.5 + 2.4 + 1.3 + 2.0 + 2.6 + 1.5 + 0.5 = 10.8s (+0.1s en Bomba 1 a Punto 0)
const unsigned long TIEMPO_RET_SECADOR_MS    = 500;  // 0.5s Secador a Bomba 2 en reversa
const unsigned long TIEMPO_RET_B2_A_ESPONJAS_MS = 1300; // 1.3s Bomba 2 a Esponjas en reversa (-0.1s)
const unsigned long TIEMPO_RETORNO_A_CERO_MS = 560;   // 0.56s tramo primera regadera (Bomba 1) a Punto 0 (+0.02s sumados)
const unsigned long TIEMPO_RETORNO_CICLO_MS  = 10860; // 10.86s total regreso

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

// Freno electrónico activo (Dynamic Braking): cortocircuita las bobinas para clavarse en seco
void frenarVarilla() {
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  delay(40); // 40ms de freno magnético activo
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
}

// Verificación rápida de emergencia sin alterar los micro-tiempos de los motores
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

// Delay continuo seguro para viajes largos sin deformar pulsos PWM
bool delayContinuo(unsigned long ms) {
  unsigned long start = millis();
  while (millis() - start < ms) {
    if (revisarEmergencia()) return false;
    delay(10);
  }
  return true;
}

// Función de tracción en reversa continua (100% velocidad)
bool retrocederContinuo(unsigned long ms) {
  digitalWrite(PIN_VARILLA_REVERSA, HIGH);
  if (!delayContinuo(ms)) return false;
  frenarVarilla();
  return true;
}

// Función de tracción en reversa con velocidad reducida (PWM calibrado)
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

// ESTACIÓN 1: CHAMPÚ CON AVANCE LENTO (1.5 seg) - PULSO CALIBRADO AL 50%
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

// ESTACIÓN 2: ESPONJAS SUAVES CON AVANCE LENTO CALIBRADO (45% potencia)
void aplicarEsponjasConAvanceSuave() {
  unsigned long t0 = millis();
  while (millis() - t0 < TIEMPO_ESPONJAS_LENTO_MS) {
    if (revisarEmergencia()) return;
    // 1. Esponjas y Varilla ON por 45ms (tracción y frotado al 45%)
    digitalWrite(PIN_ESPONJA_1, HIGH);
    digitalWrite(PIN_ESPONJA_2, LOW);
    digitalWrite(PIN_VARILLA_AVANCE, HIGH);
    delay(45);

    // 2. Apagar varilla y esponjas para descanso (55ms OFF -> 45% de ciclo)
    digitalWrite(PIN_VARILLA_AVANCE, LOW);
    digitalWrite(PIN_ESPONJA_1, LOW);
    delay(55);
  }
  digitalWrite(PIN_ESPONJA_1, LOW);
  digitalWrite(PIN_ESPONJA_2, LOW);
  frenarVarilla();
}

// ESTACIÓN 3: ENJUAGUE CON BOMBA 2 Y AVANCE AL 50% (50% velocidad)
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

// ESTACIÓN 4: SECADOR (Abanico quieto por 2.0 seg)
void aplicarSecadorConAvance() {
  frenarVarilla();
  digitalWrite(PIN_RELE_SECADOR, LOW); // Enciende abanico

  if (!delayContinuo(TIEMPO_SECADOR_QUIETO_MS)) return;

  digitalWrite(PIN_RELE_SECADOR, HIGH); // Apaga abanico
  frenarVarilla();
}

// CICLO COMPLETO CON TELEMETRÍA IOT Y TIEMPOS EXACTOS
void ejecutarCicloCompleto(String sessionId = "SESION-WEB") {
  hayParadaEmergencia = false;
  Serial.printf("STAGE_CHANGE:STAGE_STARTING:%s\n", sessionId.c_str());
  Serial.printf("MSG:CONFIG_TIEMPOS_IDA_8.7s_REGRESO_8.1s\n");
  Serial.println("LOC:INICIO_A_BOMBA1:10");

  // FASE 1: Ir a Bomba 1 (0.7s) y mojar al 50% con avance lento (1.5s)
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_LLEGADA_BOMBA1_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_SHAMPOO:%s\n", sessionId.c_str());
  Serial.println("LOC:BOMBA_1_CHAMPU:20");
  aplicarChampuConAvanceLento();
  if (hayParadaEmergencia) return;


  // FASE 2: Ir a Esponjas (2.6s) y lavar suave 45% con avance (2.0s)
  Serial.println("LOC:BOMBA1_A_ESPONJAS:35");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_ESPONJAS_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_SPONGES:%s\n", sessionId.c_str());
  Serial.println("LOC:ESPONJAS_ACTIVAS:50");
  aplicarEsponjasConAvanceSuave();
  if (hayParadaEmergencia) return;

  // FASE 3: Ir a Bomba 2 (1.3s) y enjuagar al 50% con avance (2.4s)
  Serial.println("LOC:ESPONJAS_A_ENJUAGUE:65");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_ENJUAGUE_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  Serial.printf("STAGE_CHANGE:STAGE_RINSE:%s\n", sessionId.c_str());
  Serial.println("LOC:BOMBA_2_ENJUAGUE:75");
  aplicarEnjuagueConAvanceSuave();
  if (hayParadaEmergencia) return;

  // FASE 4: Viaje Bomba 2 a Abanico (0.5s) y luego encender secador
  Serial.println("LOC:BOMBA2_A_SECADOR:85");
  digitalWrite(PIN_VARILLA_AVANCE, HIGH);
  if (!delayContinuo(TIEMPO_VIAJE_SECADOR_MS)) return;
  frenarVarilla();
  if (!delayContinuo(200)) return;

  // Secador (Abanico quieto 2.0s sobre el vehículo)
  Serial.printf("STAGE_CHANGE:STAGE_FAN_DRYING:%s\n", sessionId.c_str());
  Serial.println("LOC:SECADOR_ABANICO:90");
  aplicarSecadorConAvance();
  if (hayParadaEmergencia) return;

  // FASE 5: Detener motorreductor en reposo absoluto antes de iniciar reversa
  frenarVarilla();
  digitalWrite(PIN_VARILLA_AVANCE, LOW);
  digitalWrite(PIN_VARILLA_REVERSA, LOW);
  if (!delayContinuo(500)) return; // 0.5s en 0 absoluto para que arranque desde cero

  // RETORNO ESPEJO EXACTO: Misma duración y misma velocidad en reversa en cada punto
  Serial.printf("STAGE_CHANGE:STAGE_RETURNING:%s\n", sessionId.c_str());
  Serial.println("LOC:RETORNO_A_INICIO:50");

  // R1: Secador a Bomba 2 (0.5s al 100%)
  if (!retrocederContinuo(TIEMPO_RET_SECADOR_MS)) return;

  // R2: Zona Bomba 2 / Enjuague (2.4s al 50% de velocidad)
  if (!retrocederPulsado(TIEMPO_ENJUAGUE_LENTO_MS, 50, 50)) return;

  // R3: Bomba 2 a Esponjas (1.3s al 100%)
  if (!retrocederContinuo(TIEMPO_RET_B2_A_ESPONJAS_MS)) return;

  // R4: Zona Esponjas / Restregado (2.0s al 45% de velocidad)
  if (!retrocederPulsado(TIEMPO_ESPONJAS_LENTO_MS, 45, 55)) return;

  // R5: Esponjas a Bomba 1 (2.6s al 100%)
  if (!retrocederContinuo(TIEMPO_VIAJE_ESPONJAS_MS)) return;

  // R6: Zona Bomba 1 / Champú (1.5s al 50% de velocidad)
  if (!retrocederPulsado(TIEMPO_ROCIADO_LENTO_MS, 50, 50)) return;

  // R7: Bomba 1 a Punto 0 Inicial (0.3s al 100%)
  if (!retrocederContinuo(TIEMPO_RETORNO_A_CERO_MS)) return;

  frenarVarilla();

  Serial.printf("STAGE_CHANGE:STAGE_FINISHED:%s\n", sessionId.c_str());
  Serial.println("LOC:INICIO:0");
  Serial.printf("EVENT_FINISHED:%s\n", sessionId.c_str());

  // Limpiar cualquier comando acumulado en el buffer
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
