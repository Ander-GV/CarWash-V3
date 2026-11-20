import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ServicioAnalitica } from './analytics.service';
import { GuardAutenticacionJwt } from '../../common/guards/jwt-auth.guard';
import { GuardRoles } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '../../common/enums/role.enum';

@Controller('admin/analytics')
@UseGuards(GuardAutenticacionJwt, GuardRoles)
@Roles(Rol.ADMIN)
export class ControladorAdminAnalitica {
  constructor(private readonly servicioAnalitica: ServicioAnalitica) {}

  @Get('predictions')
  async getPredictions() {
    return this.servicioAnalitica.getDemandPredictions();
  }

  @Get('maintenance')
  async getMaintenance() {
    return this.servicioAnalitica.getPredictiveMaintenance();
  }

  @Get('overview')
  async getOverview() {
    return this.servicioAnalitica.getAnalyticsOverview();
  }

  @Post('retrain')
  async retrain() {
    return this.servicioAnalitica.retrainModel();
  }
}

// Alias para compatibilidad
export const AnalyticsAdminController = ControladorAdminAnalitica;
