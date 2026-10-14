import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WashSession } from './entities/wash-session.entity';
import { WashService } from './wash.service';
import { WashGateway } from './wash.gateway';
import { WashClientController } from './wash-client.controller';
import { WashAdminController } from './wash-admin.controller';
import { HardwareModule } from '../hardware/hardware.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WashSession]),
    HardwareModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [WashClientController, WashAdminController],
  providers: [WashService, WashGateway],
  exports: [WashService, WashGateway],
})
export class WashModule {}
