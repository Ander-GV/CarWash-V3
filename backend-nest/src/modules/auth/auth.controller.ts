import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ServicioAutenticacion } from './auth.service';
import { DtoIniciarSesion, DtoRegistro } from './dto/auth.dto';
import { GuardAutenticacionJwt } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class ControladorAutenticacion {
  constructor(private readonly servicioAutenticacion: ServicioAutenticacion) {}

  @Post('register')
  async register(@Body() registerDto: DtoRegistro) {
    return this.servicioAutenticacion.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: DtoIniciarSesion) {
    return this.servicioAutenticacion.login(loginDto);
  }

  @UseGuards(GuardAutenticacionJwt)
  @Get('profile')
  getProfile(@Req() req: any) {
    return {
      message: 'Perfil autenticado correctamente',
      user: req.user,
    };
  }

  // Endpoints para Gestión y Registro de Administradores
  @UseGuards(GuardAutenticacionJwt)
  @Get('admins')
  async getAdmins() {
    return this.servicioAutenticacion.getAdmins();
  }

  @UseGuards(GuardAutenticacionJwt)
  @Post('admins')
  async registerAdmin(@Body() registerDto: DtoRegistro) {
    return this.servicioAutenticacion.registerAdmin(registerDto);
  }

  @UseGuards(GuardAutenticacionJwt)
  @Delete('admins/:id')
  async deleteAdmin(@Param('id') id: string) {
    return this.servicioAutenticacion.deleteAdmin(id);
  }

  @UseGuards(GuardAutenticacionJwt)
  @Post('admins/:id/toggle-status')
  async toggleAdminStatus(@Param('id') id: string) {
    return this.servicioAutenticacion.toggleUserStatus(id);
  }
}

// Alias para compatibilidad
export const AuthController = ControladorAutenticacion;
