import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsAdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Predicción de demanda y afluencia vehicular (IA Python)
   */
  @Get('predictions')
  async getPredictions() {
    return this.analyticsService.getDemandPredictions();
  }

  /**
   * Mantenimiento predictivo de hardware y bombas
   */
  @Get('maintenance')
  async getMaintenance() {
    return this.analyticsService.getPredictiveMaintenance();
  }

  /**
   * Métricas globales del modelo de Machine Learning
   */
  @Get('overview')
  async getOverview() {
    return this.analyticsService.getAnalyticsOverview();
  }
}
