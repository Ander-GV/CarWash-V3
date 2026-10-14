import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './modules/auth/entities/user.entity';
import { WashSession } from './modules/wash/entities/wash-session.entity';

import { AuthModule } from './modules/auth/auth.module';
import { HardwareModule } from './modules/hardware/hardware.module';
import { WashModule } from './modules/wash/wash.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

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
        entities: [User, WashSession],
        synchronize: true, // Automático en desarrollo; usar migraciones en producción
        logging: false,
      }),
    }),
    AuthModule,
    HardwareModule,
    WashModule,
    PaymentsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
