import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { PlanLavado, FaseLavado } from '../../../common/enums/wash-stage.enum';

export class DtoCrearLavado {
  @IsString()
  @IsNotEmpty({ message: 'La placa del vehículo es requerida para el registro y puntos' })
  @Length(3, 10, { message: 'La placa debe tener entre 3 y 10 caracteres' })
  licensePlate: string;

  @IsEnum(PlanLavado)
  @IsOptional()
  plan?: PlanLavado;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}

export class DtoActualizarFaseLavado {
  @IsEnum(FaseLavado)
  @IsNotEmpty()
  stage: FaseLavado;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Alias para compatibilidad
export const CreateWashDto = DtoCrearLavado;
export const UpdateWashStageDto = DtoActualizarFaseLavado;
