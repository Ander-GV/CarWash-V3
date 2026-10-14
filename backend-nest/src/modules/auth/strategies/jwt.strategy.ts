import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/user.entity';

@Injectable()
export class EstrategiaJwt extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private repositorioUsuario: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'CARWASH_SUPER_SECURE_JWT_SECRET_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.repositorioUsuario.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token inválido o usuario inactivo');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}

// Alias para compatibilidad
export const JwtStrategy = EstrategiaJwt;
