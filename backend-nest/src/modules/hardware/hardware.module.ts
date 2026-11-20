import { Module } from '@nestjs/common';
import { ServicioHardware } from './hardware.service';
import { ControladorHardware } from './hardware.controller';

@Module({
  controllers: [ControladorHardware],
  providers: [ServicioHardware],
  exports: [ServicioHardware],
})
export class ModuloHardware {}

// Alias para compatibilidad
export const HardwareModule = ModuloHardware;
