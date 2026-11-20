import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import axios from 'axios';

export interface EventoHardware {
  type: 'BARRIER_OPENED' | 'CAR_DETECTED' | 'STAGE_CHANGE' | 'FINISHED' | 'ERROR';
  sessionId?: string;
  stage?: string;
  raw?: string;
  timestamp: string;
}

// Alias para compatibilidad
export type HardwareEvent = EventoHardware;

@Injectable()
export class ServicioHardware implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServicioHardware.name);
  private serialPort: any = null;
  private isConnected = false;
  private isEmulated = true;
  private isEmergencyStopped = false;
  private washTimeouts: NodeJS.Timeout[] = [];
  private connectionMode: 'ESP32_WIFI' | 'ESP32_SERIAL' | 'EMULATED' = 'EMULATED';

  public readonly eventStream$ = new Subject<EventoHardware>();

  async onModuleInit() {
    await this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  public async connect(): Promise<void> {
    const wifiIp = process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP;
    const portName = process.env.ESP32_PORT || process.env.HARDWARE_PORT || 'COM3';
    const baudRate = parseInt(process.env.ESP32_BAUDRATE || '115200', 10);

    // 1. Probar conexión Inalámbrica WiFi con el ESP32
    if (wifiIp) {
      this.logger.log(`[ESP32 IoT] Verificando conexión WiFi en http://${wifiIp}...`);
      try {
        const response = await axios.get(`http://${wifiIp}/status`, { timeout: 2500 });
        if (response.status === 200) {
          this.isConnected = true;
          this.isEmulated = false;
          this.connectionMode = 'ESP32_WIFI';
          this.logger.log(` [ESP32 IoT] Conexión WiFi establecida exitosamente con http://${wifiIp}`);
          return;
        }
      } catch (err: any) {
        this.logger.warn(`[ESP32 IoT] No se pudo contactar el ESP32 en http://${wifiIp} (${err.message}). Probando USB Serial...`);
      }
    }

    // 2. Probar conexión física USB Serial UART (115200 baudios estándar ESP32)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { SerialPort } = require('serialport');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ReadlineParser } = require('@serialport/parser-readline');

      this.serialPort = new SerialPort({
        path: portName,
        baudRate: baudRate,
        autoOpen: false,
      });

      this.serialPort.open((err: any) => {
        if (err) {
          this.logger.warn(`[ESP32 Serial] No se detectó ESP32 en puerto ${portName}. Activando MODO EMULACIÓN.`);
          this.activateEmulation();
          return;
        }

        this.isConnected = true;
        this.isEmulated = false;
        this.connectionMode = 'ESP32_SERIAL';
        this.logger.log(` [ESP32 Serial] Conexión UART establecida en ${portName} a ${baudRate} bauds`);

        const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', (line: string) => this.handleSerialData(line));
      });

      this.serialPort.on('error', (err: any) => {
        this.logger.error(`Error en puerto serial ESP32: ${err.message}`);
        this.activateEmulation();
      });

      this.serialPort.on('close', () => {
        this.logger.warn('Puerto serial ESP32 desconectado. Pasando a emulación...');
        this.activateEmulation();
      });
    } catch {
      this.activateEmulation();
    }
  }

  private activateEmulation() {
    this.isConnected = true;
    this.isEmulated = true;
    this.connectionMode = 'EMULATED';
    this.logger.log(' Modo emulación de Bahía ESP32 activo (simulación virtual de relés, sensores y talanquera).');
  }

  public isStopped(): boolean {
    return this.isEmergencyStopped;
  }

  public async openBarrier(sessionId: string): Promise<boolean> {
    if (this.isEmergencyStopped) {
      this.logger.warn(`[HARDWARE ESP32] Bloqueado: No se puede abrir talanquera mientras el sistema esté en Parada de Emergencia.`);
      return false;
    }

    const wifiIp = process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP;

    if (wifiIp && this.connectionMode === 'ESP32_WIFI') {
      try {
        this.logger.log(`[ESP32 WiFi] Enviando comando /open-barrier a http://${wifiIp}...`);
        await axios.get(`http://${wifiIp}/open-barrier?sessionId=${sessionId}`, { timeout: 3000 });
        return true;
      } catch (err: any) {
        this.logger.warn(`Fallo al enviar comando WiFi a ESP32 (${err.message}). Ejecutando fallback local.`);
      }
    }

    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.write(`CMD:OPEN_BARRIER:${sessionId}\n`);
      return true;
    }

    // Modo simulación
    this.logger.log(`[HARDWARE ESP32] Levantando talanquera de acceso (Sesión: ${sessionId})`);
    const t = setTimeout(() => {
      this.eventStream$.next({
        type: 'BARRIER_OPENED',
        sessionId,
        timestamp: new Date().toISOString(),
      });
    }, 1000);
    this.washTimeouts.push(t);
    return true;
  }

  public async startWashSequence(sessionId: string, plan: string): Promise<boolean> {
    if (this.isEmergencyStopped) {
      this.logger.warn(`[HARDWARE ESP32] Bloqueado: No se puede iniciar lavado mientras el sistema esté en Parada de Emergencia.`);
      return false;
    }

    const wifiIp = process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP;

    if (wifiIp && this.connectionMode === 'ESP32_WIFI') {
      try {
        this.logger.log(`[ESP32 WiFi] Enviando comando /start-wash a http://${wifiIp}...`);
        await axios.get(`http://${wifiIp}/start-wash?sessionId=${sessionId}&plan=${plan}`, { timeout: 3000 });
        return true;
      } catch (err: any) {
        this.logger.warn(`Fallo al enviar comando WiFi a ESP32 (${err.message}). Ejecutando fallback local.`);
      }
    }

    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.write(`CMD:START_WASH:${sessionId}:${plan}\n`);
      return true;
    }

    // Modo simulación
    this.logger.log(`[HARDWARE ESP32] Iniciando secuencia de lavado: ${plan} (Sesión: ${sessionId})`);
    this.simulateWashProgression(sessionId, plan);
    return true;
  }

  public async emergencyStop(): Promise<boolean> {
    this.isEmergencyStopped = true;

    // Cancelar cualquier timeout o temporizador de lavado en curso
    this.washTimeouts.forEach((t) => clearTimeout(t));
    this.washTimeouts = [];

    const wifiIp = process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP;

    if (wifiIp && this.connectionMode === 'ESP32_WIFI') {
      try {
        await axios.get(`http://${wifiIp}/emergency-stop`, { timeout: 3000 });
      } catch (err: any) {
        this.logger.warn(`Fallo al enviar emergency-stop WiFi a ESP32 (${err.message})`);
      }
    }

    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.write('CMD:EMERGENCY_STOP\n');
    }

    this.eventStream$.next({
      type: 'ERROR',
      stage: 'EMERGENCY_STOP',
      timestamp: new Date().toISOString(),
    });

    this.logger.warn('[HARDWARE ESP32] ¡PARADA DE EMERGENCIA ACTIVADA! Todos los relés desenergizados. El sistema permanecerá detenido hasta la orden de reinicio.');
    return true;
  }

  public async resumeSystem(): Promise<boolean> {
    this.isEmergencyStopped = false;

    const wifiIp = process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP;

    if (wifiIp && this.connectionMode === 'ESP32_WIFI') {
      try {
        this.logger.log(`[ESP32 WiFi] Enviando comando de reanudación a http://${wifiIp}...`);
        await axios.get(`http://${wifiIp}/resume`, { timeout: 3000 });
      } catch (err: any) {
        this.logger.warn(`Fallo al enviar resume WiFi a ESP32 (${err.message})`);
      }
    }

    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.write('CMD:RESUME\n');
    }

    this.logger.log('[HARDWARE ESP32] ¡SISTEMA REINICIADO Y REANUDADO POR EL ADMINISTRADOR! Bahía operativa.');
    return true;
  }

  private handleSerialData(line: string) {
    this.logger.debug(`[ESP32 SERIAL RAW]: ${line}`);
    const parts = line.trim().split(':');
    const header = parts[0];

    if (header === 'EVENT_BARRIER_OPENED') {
      this.eventStream$.next({
        type: 'BARRIER_OPENED',
        sessionId: parts[1],
        timestamp: new Date().toISOString(),
      });
    } else if (header === 'EVENT_CAR_DETECTED') {
      this.eventStream$.next({
        type: 'CAR_DETECTED',
        sessionId: parts[1],
        timestamp: new Date().toISOString(),
      });
    } else if (header === 'STAGE_CHANGE') {
      this.eventStream$.next({
        type: 'STAGE_CHANGE',
        stage: parts[1],
        sessionId: parts[2],
        timestamp: new Date().toISOString(),
      });
    } else if (header === 'LOC') {
      this.eventStream$.next({
        type: 'STAGE_CHANGE',
        stage: `LOC_${parts[1]}`,
        raw: parts[2],
        timestamp: new Date().toISOString(),
      });
    } else if (header === 'EVENT_FINISHED') {
      this.eventStream$.next({
        type: 'FINISHED',
        sessionId: parts[1],
        timestamp: new Date().toISOString(),
      });
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      emulated: this.isEmulated,
      isEmergencyStopped: this.isEmergencyStopped,
      controller: 'ESP32 Dual-Core (WiFi / BLE / GPIO)',
      connectionMode: this.connectionMode,
      wifiIp: process.env.ESP32_WIFI_IP || process.env.HARDWARE_WIFI_IP || 'No configurada (usando simulación)',
      serialPort: process.env.ESP32_PORT || process.env.HARDWARE_PORT || 'COM3',
      baudRate: process.env.ESP32_BAUDRATE || '115200',
      activeSensors: [
        'GPIO 13: Bomba Shampoo (Espuma Activa)',
        'GPIO 12: Motor Esponjas Soft-Touch',
        'GPIO 14: Bomba Enjuague Hidro-Jet',
        'GPIO 27: Turbina AeroDry (Secado)',
        'GPIO 18: Servomotor Talanquera PWM',
        'GPIO 5/19: Sensor Ultrasónico Detección Auto',
      ],
    };
  }

  private simulateWashProgression(sessionId: string, plan: string) {
    const stages = [
      { stage: 'STAGE_SHAMPOO', duration: 2000 },
      { stage: 'STAGE_SPONGES', duration: 4500 },
      { stage: 'STAGE_RINSE', duration: 3400 },
      { stage: 'STAGE_FAN_DRYING', duration: 3000 },
      { stage: 'STAGE_FINISHED', duration: 10600 },
    ];

    let accumulatedTime = 500;
    stages.forEach((item) => {
      const t = setTimeout(() => {
        if (this.isEmergencyStopped) return;
        this.eventStream$.next({
          type: item.stage === 'STAGE_FINISHED' ? 'FINISHED' : 'STAGE_CHANGE',
          stage: item.stage,
          sessionId,
          timestamp: new Date().toISOString(),
        });
      }, accumulatedTime);
      this.washTimeouts.push(t);
      accumulatedTime += item.duration;
    });
  }

  private disconnect() {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close();
    }
    this.isConnected = false;
  }
}

// Alias para compatibilidad
export const HardwareService = ServicioHardware;
