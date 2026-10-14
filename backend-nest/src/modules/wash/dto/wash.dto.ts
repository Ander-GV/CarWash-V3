import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { WashPlan, WashStage } from '../../../common/enums/wash-stage.enum';

export class CreateWashDto {
  @IsString()
  @IsNotEmpty({ message: 'La placa del vehículo es requerida para el registro y puntos' })
  @Length(3, 10, { message: 'La placa debe tener entre 3 y 10 caracteres' })
  licensePlate: string;

  @IsEnum(WashPlan)
  @IsOptional()
  plan?: WashPlan;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}

export class UpdateWashStageDto {
  @IsEnum(WashStage)
  @IsNotEmpty()
  stage: WashStage;

  @IsOptional()
  @IsString()
  notes?: string;
}
