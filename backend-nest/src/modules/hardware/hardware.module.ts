import { Module } from '@nestjs/common';
import { ArduinoService } from './arduino.service';
import { HardwareController } from './hardware.controller';

@Module({
  controllers: [HardwareController],
  providers: [ArduinoService],
  exports: [ArduinoService],
})
export class HardwareModule {}
