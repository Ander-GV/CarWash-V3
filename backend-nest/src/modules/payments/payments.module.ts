import { Module, forwardRef } from '@nestjs/common';
import { ServicioWompi } from './wompi.service';
import { ControladorPagos } from './payments.controller';
import { ModuloLavado } from '../wash/wash.module';

@Module({
  imports: [forwardRef(() => ModuloLavado)],
  controllers: [ControladorPagos],
  providers: [ServicioWompi],
  exports: [ServicioWompi],
})
export class ModuloPagos {}

// Alias para compatibilidad
export const PaymentsModule = ModuloPagos;
