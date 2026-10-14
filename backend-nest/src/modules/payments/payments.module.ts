import { Module, forwardRef } from '@nestjs/common';
import { WompiService } from './wompi.service';
import { PaymentsController } from './payments.controller';
import { WashModule } from '../wash/wash.module';

@Module({
  imports: [forwardRef(() => WashModule)],
  controllers: [PaymentsController],
  providers: [WompiService],
  exports: [WompiService],
})
export class PaymentsModule {}
