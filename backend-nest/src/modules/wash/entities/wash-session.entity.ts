import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WashPlan, WashStage } from '../../../common/enums/wash-stage.enum';

@Entity('wash_sessions')
export class WashSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 15, default: 'SIN-PLACA' })
  licensePlate: string;

  @Column({ length: 30, nullable: true })
  clientPhone: string;

  @Column({
    type: 'enum',
    enum: WashPlan,
    default: WashPlan.FULL_WASH,
  })
  plan: WashPlan;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 20000 })
  amount: number;

  @Column({
    type: 'enum',
    enum: WashStage,
    default: WashStage.PENDING_PAYMENT,
  })
  stage: WashStage;

  @Column({ length: 20, default: 'PENDING' })
  paymentStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED';

  @Column({ unique: true, length: 100 })
  paymentReference: string;

  @Column({ length: 100, nullable: true })
  wompiTransactionId: string;

  // Sistema de Puntos y Fidelización por Placa
  @Column({ default: 100 })
  pointsEarned: number;

  @Column({ default: false })
  isFreeLoyaltyReward: boolean;

  @Column({ default: 1 })
  totalPlateWashesSoFar: number;

  @Column({ type: 'timestamp', nullable: true })
  entryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
