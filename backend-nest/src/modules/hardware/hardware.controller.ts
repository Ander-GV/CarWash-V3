import { Controller, Post, Body, Get, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ServicioArduino } from './arduino.service';

export interface DtoEventoArduinoWifi {
  type: 'BARRIER_OPENED' | 'CAR_DETECTED' | 'STAGE_CHANGE' | 'FINISHED' | 'ERROR';
  sessionId: string;
  stage?: string;
  hardwareSecret?: string;
}

// Alias para compatibilidad
export type ArduinoWifiEventDto = DtoEventoArduinoWifi;

@Controller('hardware')
export class ControladorHardware {
  private readonly logger = new Logger(ControladorHardware.name);

  constructor(private readonly servicioArduino: ServicioArduino) {}

  @HttpCode(HttpStatus.OK)
  @Post('arduino-event')
  receiveWifiHardwareEvent(@Body() dto: DtoEventoArduinoWifi) {
    this.logger.log(` [ARDUINO VÍA WIFI] Evento recibido: ${dto.type} (Fase: ${dto.stage || 'N/A'}, Sesión: ${dto.sessionId})`);

    this.servicioArduino.eventStream$.next({
      type: dto.type,
      sessionId: dto.sessionId,
      stage: dto.stage,
      timestamp: new Date().toISOString(),
    });

    return { received: true, ack: 'OK', timestamp: new Date().toISOString() };
  }

  @Get('status')
  getHardwareStatus() {
    return this.servicioArduino.getStatus();
  }
}

// Alias para compatibilidad
export const HardwareController = ControladorHardware;
