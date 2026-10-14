import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Usuario } from './entities/user.entity';
import { DtoIniciarSesion, DtoRegistro } from './dto/auth.dto';
import { Rol } from '../../common/enums/role.enum';

@Injectable()
export class ServicioAutenticacion {
  constructor(
    @InjectRepository(Usuario)
    private readonly repositorioUsuario: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.repositorioUsuario.findOne({
      where: { email: 'admin@carwash.com' },
    });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('AdminCarWash2026!', 10);
      const admin = this.repositorioUsuario.create({
        email: 'admin@carwash.com',
        fullName: 'Administrador Maestro',
        password: hashedPassword,
        role: Rol.ADMIN,
      });
      await this.repositorioUsuario.save(admin);
      console.log(' [ServicioAutenticacion] Usuario Administrador creado: admin@carwash.com / AdminCarWash2026!');
    }
  }

  async register(registerDto: DtoRegistro) {
    const existing = await this.repositorioUsuario.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.repositorioUsuario.create({
      ...registerDto,
      password: hashedPassword,
      role: registerDto.role || Rol.CLIENT,
    });

    const savedUser = await this.repositorioUsuario.save(user);
    const token = this.generateToken(savedUser);
    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
      },
      token,
    };
  }

  async login(loginDto: DtoIniciarSesion) {
    const user = await this.repositorioUsuario
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginDto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  private generateToken(user: Usuario): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}

// Alias para compatibilidad
export const AuthService = ServicioAutenticacion;
