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
import { ServicioLavado } from './wash.service';
import { GuardAutenticacionJwt } from '../../common/guards/jwt-auth.guard';
import { GuardRoles } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Rol } from '../../common/enums/role.enum';

@Controller('admin/wash')
@UseGuards(GuardAutenticacionJwt, GuardRoles)
@Roles(Rol.ADMIN, Rol.OPERATOR)
export class ControladorAdminLavado {
  constructor(private readonly servicioLavado: ServicioLavado) {}

  @Get('kpis')
  async getKPIs() {
    return this.servicioLavado.getAdminKPIs();
  }

  @Get('logs')
  async getLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.servicioLavado.getWashLogs(parseInt(limit, 10), parseInt(page, 10));
  }

  @HttpCode(HttpStatus.OK)
  @Post('start-wash')
  @Roles(Rol.ADMIN, Rol.OPERATOR)
  async startWash() {
    return this.servicioLavado.adminManualStartWash();
  }

  @Post(':id/override-barrier')
  @Roles(Rol.ADMIN)
  async overrideBarrier(@Param('id') id: string) {
    return this.servicioLavado.adminManualOpenBarrier(id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('emergency-stop')
  @Roles(Rol.ADMIN)
  async emergencyStop() {
    return this.servicioLavado.adminEmergencyStop();
  }

  @HttpCode(HttpStatus.OK)
  @Post('resume-system')
  @Roles(Rol.ADMIN)
  async resumeSystem() {
    return this.servicioLavado.adminResumeSystem();
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-emergency')
  @Roles(Rol.ADMIN)
  async resetEmergency() {
    return this.servicioLavado.adminResumeSystem();
  }
}

// Alias para compatibilidad
export const WashAdminController = ControladorAdminLavado;
