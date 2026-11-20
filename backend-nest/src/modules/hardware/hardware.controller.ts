import { Controller, Post, Body, Get, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ServicioHardware } from './hardware.service';

export interface DtoEventoHardware {
  type: 'BARRIER_OPENED' | 'CAR_DETECTED' | 'STAGE_CHANGE' | 'FINISHED' | 'ERROR';
  sessionId: string;
  stage?: string;
  hardwareSecret?: string;
}

// Alias para compatibilidad
export type HardwareEventDto = DtoEventoHardware;

@Controller('hardware')
export class ControladorHardware {
  private readonly logger = new Logger(ControladorHardware.name);

  constructor(private readonly servicioHardware: ServicioHardware) {}

  @HttpCode(HttpStatus.OK)
  @Post('event')
  receiveHardwareEvent(@Body() dto: DtoEventoHardware) {
    this.logger.log(` [HARDWARE BAHÍA] Evento recibido: ${dto.type} (Fase: ${dto.stage || 'N/A'}, Sesión: ${dto.sessionId})`);

    this.servicioHardware.eventStream$.next({
      type: dto.type,
      sessionId: dto.sessionId,
      stage: dto.stage,
      timestamp: new Date().toISOString(),
    });

    return { received: true, ack: 'OK', timestamp: new Date().toISOString() };
  }

  // Endpoint específico para peticiones WiFi del módulo ESP32
  @HttpCode(HttpStatus.OK)
  @Post('esp32-event')
  receiveEsp32Event(@Body() dto: DtoEventoHardware) {
    this.logger.log(` [ESP32 VÍA WIFI] Evento emitido por el microcontrolador: ${dto.type} (Sesión: ${dto.sessionId})`);
    return this.receiveHardwareEvent(dto);
  }

  // Alias retrocompatible para integraciones previas
  @HttpCode(HttpStatus.OK)
  @Post('hardware-event')
  receiveHardwareEventLegacy(@Body() dto: DtoEventoHardware) {
    return this.receiveHardwareEvent(dto);
  }

  @Get('status')
  getHardwareStatus() {
    return this.servicioHardware.getStatus();
  }
}

// Alias para compatibilidad
export const HardwareController = ControladorHardware;
