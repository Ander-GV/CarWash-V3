import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Rol } from '../../../common/enums/role.enum';

export class DtoIniciarSesion {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener mínimo 6 caracteres' })
  password: string;
}

export class DtoRegistro {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName: string;

  @IsEnum(Rol, { message: 'El rol debe ser ROLE_CLIENT, ROLE_OPERATOR o ROLE_ADMIN' })
  @IsOptional()
  role?: Rol;
}

// Alias para compatibilidad
export const LoginDto = DtoIniciarSesion;
export const RegisterDto = DtoRegistro;
