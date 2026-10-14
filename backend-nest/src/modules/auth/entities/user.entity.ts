import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rol } from '../../../common/enums/role.enum';

@Entity('users')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 100 })
  fullName: string;

  @Column({
    type: 'enum',
    enum: Rol,
    default: Rol.CLIENT,
  })
  role: Rol;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Alias para compatibilidad
export const User = Usuario;
