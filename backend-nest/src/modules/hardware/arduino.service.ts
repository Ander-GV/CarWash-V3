import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface EventoArduino {
  type: 'BARRIER_OPENED' | 'CAR_DETECTED' | 'STAGE_CHANGE' | 'FINISHED' | 'ERROR';
  sessionId?: string;
  stage?: string;
  raw?: string;
  timestamp: string;
}

// Alias para compatibilidad
export type ArduinoEvent = EventoArduino;

@Injectable()
export class ServicioArduino implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServicioArduino.name);
  private serialPort: any = null;
  private isConnected = false;
  private isEmulated = false;

  public readonly eventStream$ = new Subject<EventoArduino>();

  async onModuleInit() {
    await this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  public async connect(): Promise<void> {
    const portName = process.env.ARDUINO_PORT || 'COM3';
    const baudRate = parseInt(process.env.ARDUINO_BAUDRATE || '9600', 10);

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
          this.logger.warn(` No se detectó hardware físico en ${portName}. Activando MODO EMULACIÓN ARDUINO.`);
          this.activateEmulation();
          return;
        }

        this.isConnected = true;
        this.isEmulated = false;
        this.logger.log(` Conexión Serial establecida con Arduino en ${portName} a ${baudRate} bauds`);

        const parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', (line: string) => this.handleIncomingData(line));
      });

      this.serialPort.on('error', (err: any) => {
        this.logger.error(`Error en puerto serial Arduino: ${err.message}`);
        this.activateEmulation();
      });

      this.serialPort.on('close', () => {
        this.logger.warn('Puerto serial cerrado. Pasando a emulación...');
        this.isConnected = false;
      });
    } catch (e: any) {
      this.logger.warn(`Controlador SerialPort no disponible (${e.message}). Activando MODO EMULACIÓN ARDUINO.`);
      this.activateEmulation();
    }
  }

  private activateEmulation() {
    this.isConnected = true;
    this.isEmulated = true;
    this.logger.log(' Modo emulación de Hardware Arduino listo. Simula sensores, barrera y relés de lavado.');
  }

  private handleIncomingData(line: string) {
    this.logger.debug(`[ARDUINO RAW]: ${line}`);
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
    } else if (header === 'EVENT_FINISHED') {
      this.eventStream$.next({
        type: 'FINISHED',
        sessionId: parts[1],
        timestamp: new Date().toISOString(),
      });
    }
  }

  public async openBarrier(sessionId: string): Promise<boolean> {
    const wifiIp = process.env.ARDUINO_WIFI_IP;
    if (wifiIp) {
      this.sendWifiCommand(`${wifiIp}/open-barrier?sessionId=${sessionId}`);
      return true;
    }

    const command = `CMD:OPEN_BARRIER:${sessionId}\n`;
    return this.sendCommand(command, () => {
      setTimeout(() => {
        this.eventStream$.next({
          type: 'BARRIER_OPENED',
          sessionId,
          timestamp: new Date().toISOString(),
        });
      }, 1000);
    });
  }

  public async startWashSequence(sessionId: string, plan: string): Promise<boolean> {
    const wifiIp = process.env.ARDUINO_WIFI_IP;
    if (wifiIp) {
      this.sendWifiCommand(`${wifiIp}/start-wash?sessionId=${sessionId}&plan=${plan}`);
      return true;
    }

    const command = `CMD:START_WASH:${sessionId}:${plan}\n`;
    return this.sendCommand(command, () => {
      this.simulateWashProgression(sessionId, plan);
    });
  }

  public async emergencyStop(): Promise<boolean> {
    const wifiIp = process.env.ARDUINO_WIFI_IP;
    if (wifiIp) {
      this.sendWifiCommand(`${wifiIp}/emergency-stop`);
      return true;
    }
    return this.sendCommand('CMD:EMERGENCY_STOP\n');
  }

  private async sendWifiCommand(url: string) {
    try {
      this.logger.log(`Enviando comando inalámbrico WiFi a Arduino: http://${url}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const axios = require('axios');
      await axios.get(`http://${url}`, { timeout: 3000 });
    } catch (e: any) {
      this.logger.warn(`Arduino WiFi en ${url} no respondió (${e.message}). Fallback a emulación.`);
    }
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      emulated: this.isEmulated,
      port: process.env.ARDUINO_PORT || 'COM3',
      baudRate: process.env.ARDUINO_BAUDRATE || '9600',
      activeSensors: ['Bomba Shampoo', 'Motor Esponjas', 'Bomba Enjuague', 'Abanico', 'Servo Talanquera'],
    };
  }

  private sendCommand(command: string, emulationCallback?: () => void): boolean {
    this.logger.log(`Enviando a Arduino: ${command.trim()}`);
    if (this.isEmulated || !this.serialPort || !this.serialPort.isOpen) {
      if (emulationCallback) emulationCallback();
      return true;
    }

    this.serialPort.write(command, (err: any) => {
      if (err) {
        this.logger.error(`Fallo enviando comando a Arduino: ${err.message}`);
        return false;
      }
    });
    return true;
  }

  private simulateWashProgression(sessionId: string, plan: string) {
    const stages = [
      { stage: 'STAGE_SHAMPOO', duration: 4000 },
      { stage: 'STAGE_SPONGES', duration: 5000 },
      { stage: 'STAGE_RINSE', duration: 4500 },
      { stage: 'STAGE_FAN_DRYING', duration: 5000 },
      { stage: 'STAGE_FINISHED', duration: 1000 },
    ];

    let accumulatedTime = 1500;
    stages.forEach((item) => {
      setTimeout(() => {
        this.eventStream$.next({
          type: item.stage === 'STAGE_FINISHED' ? 'FINISHED' : 'STAGE_CHANGE',
          stage: item.stage,
          sessionId,
          timestamp: new Date().toISOString(),
        });
      }, accumulatedTime);
      accumulatedTime += item.duration;
    });
  }

  private disconnect() {
    if (this.serialPort && this.serialPort.isOpen) {
      this.serialPort.close();
    }
  }
}

// Alias para compatibilidad
export const ArduinoService = ServicioArduino;
