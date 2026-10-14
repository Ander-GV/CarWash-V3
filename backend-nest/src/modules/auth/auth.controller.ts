import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
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
}

// Alias para compatibilidad
export const AuthController = ControladorAutenticacion;
