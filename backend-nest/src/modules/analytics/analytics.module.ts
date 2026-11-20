import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicioAnalitica } from './analytics.service';
import { ControladorAdminAnalitica } from './analytics-admin.controller';
import { SesionLavado } from '../wash/entities/wash-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SesionLavado])],
  controllers: [ControladorAdminAnalitica],
  providers: [ServicioAnalitica],
  exports: [ServicioAnalitica],
})
export class ModuloAnalitica {}

// Alias para compatibilidad
export const AnalyticsModule = ModuloAnalitica;
