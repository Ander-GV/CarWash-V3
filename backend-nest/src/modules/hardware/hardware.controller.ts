import { Controller, Post, Body, Get, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ArduinoService } from './arduino.service';

export interface ArduinoWifiEventDto {
  type: 'BARRIER_OPENED' | 'CAR_DETECTED' | 'STAGE_CHANGE' | 'FINISHED' | 'ERROR';
  sessionId: string;
  stage?: string;
  hardwareSecret?: string;
}

@Controller('hardware')
export class HardwareController {
  private readonly logger = new Logger(HardwareController.name);

  constructor(private readonly arduinoService: ArduinoService) {}

  /**
   * Endpoint receptor de eventos cuando el Arduino se conecta por Módulo WiFi (ESP8266 / ESP32)
   * En lugar de cable serial USB, el Arduino envía un HTTP POST a este endpoint.
   */
  @HttpCode(HttpStatus.OK)
  @Post('arduino-event')
  receiveWifiHardwareEvent(@Body() dto: ArduinoWifiEventDto) {
    this.logger.log(` [ARDUINO VÍA WIFI] Evento recibido: ${dto.type} (Fase: ${dto.stage || 'N/A'}, Sesión: ${dto.sessionId})`);

    this.arduinoService.eventStream$.next({
      type: dto.type,
      sessionId: dto.sessionId,
      stage: dto.stage,
      timestamp: new Date().toISOString(),
    });

    return { received: true, ack: 'OK', timestamp: new Date().toISOString() };
  }

  /**
   * Estado del hardware (tanto puerto Serial como enlace WiFi)
   */
  @Get('status')
  getHardwareStatus() {
    return this.arduinoService.getStatus();
  }
}
