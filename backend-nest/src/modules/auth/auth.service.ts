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

    const supervisorExists = await this.repositorioUsuario.findOne({
      where: { email: 'supervisor@carwash.com' },
    });
    if (!supervisorExists) {
      const hashedPassword = await bcrypt.hash('AdminCarWash2026!', 10);
      const supervisor = this.repositorioUsuario.create({
        email: 'supervisor@carwash.com',
        fullName: 'Ing. Laura Restrepo',
        password: hashedPassword,
        role: Rol.ADMIN,
      });
      await this.repositorioUsuario.save(supervisor);
    }

    const operatorExists = await this.repositorioUsuario.findOne({
      where: { email: 'operador.bahia@carwash.com' },
    });
    if (!operatorExists) {
      const hashedPassword = await bcrypt.hash('AdminCarWash2026!', 10);
      const operator = this.repositorioUsuario.create({
        email: 'operador.bahia@carwash.com',
        fullName: 'Juan Camilo Pérez',
        password: hashedPassword,
        role: Rol.OPERATOR,
      });
      await this.repositorioUsuario.save(operator);
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
      throw new UnauthorizedException('Cuenta no existe. Verifique el correo ingresado.');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Su cuenta se encuentra suspendida. Contacte al administrador.');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas. Contraseña incorrecta.');
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

  async getAdmins() {
    return this.repositorioUsuario.find({
      where: [{ role: Rol.ADMIN }, { role: Rol.OPERATOR }],
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async registerAdmin(registerDto: DtoRegistro) {
    const existing = await this.repositorioUsuario.findOne({
      where: { email: registerDto.email },
    });
    if (existing) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const adminUser = this.repositorioUsuario.create({
      email: registerDto.email,
      fullName: registerDto.fullName,
      password: hashedPassword,
      role: registerDto.role || Rol.ADMIN,
      isActive: true,
    });

    const saved = await this.repositorioUsuario.save(adminUser);
    return {
      success: true,
      message: 'Administrador registrado exitosamente',
      admin: {
        id: saved.id,
        email: saved.email,
        fullName: saved.fullName,
        role: saved.role,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
      },
    };
  }

  async deleteAdmin(id: string) {
    const admin = await this.repositorioUsuario.findOne({ where: { id } });
    if (!admin) {
      throw new ConflictException('Usuario administrador no encontrado');
    }

    if (admin.email === 'admin@carwash.com') {
      throw new ConflictException('No es posible eliminar la cuenta del Administrador Maestro principal');
    }

    await this.repositorioUsuario.remove(admin);
    return {
      success: true,
      message: 'Administrador revocado y eliminado del sistema',
    };
  }

  async toggleUserStatus(id: string) {
    const user = await this.repositorioUsuario.findOne({ where: { id } });
    if (!user) {
      throw new ConflictException('Usuario no encontrado');
    }

    if (user.email === 'admin@carwash.com' && user.isActive) {
      throw new ConflictException('No se puede desactivar la cuenta del Administrador Maestro');
    }

    user.isActive = !user.isActive;
    const updated = await this.repositorioUsuario.save(user);

    return {
      success: true,
      message: `Usuario ${updated.fullName} ${updated.isActive ? 'activado' : 'suspendido'} correctamente`,
      user: {
        id: updated.id,
        email: updated.email,
        fullName: updated.fullName,
        role: updated.role,
        isActive: updated.isActive,
      },
    };
  }
}

// Alias para compatibilidad
export const AuthService = ServicioAutenticacion;
