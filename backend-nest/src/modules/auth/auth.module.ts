import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Usuario } from './entities/user.entity';
import { ServicioAutenticacion } from './auth.service';
import { ControladorAutenticacion } from './auth.controller';
import { EstrategiaJwt } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'CARWASH_SUPER_SECURE_JWT_SECRET_2026'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '12h'),
        },
      }),
    }),
  ],
  controllers: [ControladorAutenticacion],
  providers: [ServicioAutenticacion, EstrategiaJwt],
  exports: [ServicioAutenticacion, EstrategiaJwt, PassportModule],
})
export class ModuloAutenticacion {}

// Alias para compatibilidad
export const AuthModule = ModuloAutenticacion;
