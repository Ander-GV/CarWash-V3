import { Module } from '@nestjs/common';
import { ServicioArduino } from './arduino.service';
import { ControladorHardware } from './hardware.controller';

@Module({
  controllers: [ControladorHardware],
  providers: [ServicioArduino],
  exports: [ServicioArduino],
})
export class ModuloHardware {}

// Alias para compatibilidad
export const HardwareModule = ModuloHardware;
