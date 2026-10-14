import { Module } from '@nestjs/common';
import { ServicioAnalitica } from './analytics.service';
import { ControladorAdminAnalitica } from './analytics-admin.controller';

@Module({
  controllers: [ControladorAdminAnalitica],
  providers: [ServicioAnalitica],
  exports: [ServicioAnalitica],
})
export class ModuloAnalitica {}

// Alias para compatibilidad
export const AnalyticsModule = ModuloAnalitica;
