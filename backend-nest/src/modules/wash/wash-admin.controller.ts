import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WashService } from './wash.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/wash')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class WashAdminController {
  constructor(private readonly washService: WashService) {}

  /**
   * Panel de control: KPIs y métricas en tiempo real
   */
  @Get('kpis')
  async getKPIs() {
    return this.washService.getAdminKPIs();
  }

  /**
   * Registro de entrada detallado de los lavados (logs, placas, tiempos, montos)
   */
  @Get('logs')
  async getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.washService.getWashLogs(parseInt(limit, 10), parseInt(page, 10));
  }

  /**
   * Acción manual de administrador: Levantar talanquera
   */
  @Post(':id/override-barrier')
  @Roles(Role.ADMIN)
  async overrideBarrier(@Param('id') id: string) {
    return this.washService.adminManualOpenBarrier(id);
  }

  /**
   * Acción manual de seguridad: Parada de emergencia
   */
  @HttpCode(HttpStatus.OK)
  @Post('emergency-stop')
  @Roles(Role.ADMIN)
  async emergencyStop() {
    return this.washService.adminEmergencyStop();
  }
}
