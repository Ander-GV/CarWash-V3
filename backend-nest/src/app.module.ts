import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Usuario } from './modules/auth/entities/user.entity';
import { SesionLavado } from './modules/wash/entities/wash-session.entity';

import { ModuloAutenticacion } from './modules/auth/auth.module';
import { ModuloHardware } from './modules/hardware/hardware.module';
import { ModuloLavado } from './modules/wash/wash.module';
import { ModuloPagos } from './modules/payments/payments.module';
import { ModuloAnalitica } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'carwash_db'),
        entities: [Usuario, SesionLavado],
        synchronize: true,
        logging: false,
      }),
    }),
    ModuloAutenticacion,
    ModuloHardware,
    ModuloLavado,
    ModuloPagos,
    ModuloAnalitica,
  ],
})
export class ModuloPrincipal {}

// Alias para compatibilidad
export const AppModule = ModuloPrincipal;
