import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SesionLavado } from './entities/wash-session.entity';
import { ServicioLavado } from './wash.service';
import { GatewayLavado } from './wash.gateway';
import { ControladorClienteLavado } from './wash-client.controller';
import { ControladorAdminLavado } from './wash-admin.controller';
import { ModuloHardware } from '../hardware/hardware.module';
import { ModuloPagos } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SesionLavado]),
    ModuloHardware,
    forwardRef(() => ModuloPagos),
  ],
  controllers: [ControladorClienteLavado, ControladorAdminLavado],
  providers: [ServicioLavado, GatewayLavado],
  exports: [ServicioLavado, GatewayLavado],
})
export class ModuloLavado {}

// Alias para compatibilidad
export const WashModule = ModuloLavado;
