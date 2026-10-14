import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SesionLavado } from './entities/wash-session.entity';
import { DtoCrearLavado } from './dto/wash.dto';
import { PlanLavado, FaseLavado, SINGLE_WASH_PRICE_COP, WASHES_FOR_FREE_REWARD } from '../../common/enums/wash-stage.enum';
import { ServicioArduino, EventoArduino } from '../hardware/arduino.service';
import { GatewayLavado } from './wash.gateway';

@Injectable()
export class ServicioLavado implements OnModuleInit {
  private readonly logger = new Logger(ServicioLavado.name);

  constructor(
    @InjectRepository(SesionLavado)
    private readonly washRepo: Repository<SesionLavado>,
    private readonly servicioArduino: ServicioArduino,
    private readonly gatewayLavado: GatewayLavado,
  ) {}

  onModuleInit() {
    this.servicioArduino.eventStream$.subscribe((event: EventoArduino) => {
      this.handleArduinoEvent(event);
    });
  }

  async getPlateLoyaltyInfo(rawPlate: string) {
    const licensePlate = rawPlate.toUpperCase().trim();
    const approvedWashes = await this.washRepo.count({
      where: {
        licensePlate,
        paymentStatus: 'APPROVED',
      },
    });

    const nextWashNumber = approvedWashes + 1;
    const isNextWashFree = (approvedWashes > 0 && approvedWashes % WASHES_FOR_FREE_REWARD === 0);
    const washesUntilNextFree = isNextWashFree ? 0 : (WASHES_FOR_FREE_REWARD - (approvedWashes % WASHES_FOR_FREE_REWARD));

    const lastSession = await this.washRepo.findOne({
      where: { licensePlate, paymentStatus: 'APPROVED' },
      order: { createdAt: 'DESC' },
    });

    return {
      licensePlate,
      totalApprovedWashes: approvedWashes,
      pointsEarned: approvedWashes * 100,
      nextWashNumber,
      washesUntilNextFree,
      isNextWashFree,
      rewardRequirement: WASHES_FOR_FREE_REWARD,
      lastVisitDate: lastSession?.createdAt || null,
    };
  }

  async createSession(dto: DtoCrearLavado): Promise<SesionLavado> {
    const cleanPlate = dto.licensePlate.toUpperCase().trim();
    const loyalty = await this.getPlateLoyaltyInfo(cleanPlate);

    let amount = SINGLE_WASH_PRICE_COP;
    let isFreeReward = false;

    if (loyalty.isNextWashFree) {
      amount = 0;
      isFreeReward = true;
      this.logger.log(` ¡Premio de fidelidad aplicado para placa ${cleanPlate}! Lavado GRATIS.`);
    }

    const paymentReference = `CW-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const session = this.washRepo.create({
      licensePlate: cleanPlate,
      clientPhone: dto.clientPhone,
      plan: PlanLavado.FULL_WASH,
      amount,
      stage: isFreeReward ? FaseLavado.PAYMENT_CONFIRMED : FaseLavado.PENDING_PAYMENT,
      paymentStatus: isFreeReward ? 'APPROVED' : 'PENDING',
      paymentReference,
      pointsEarned: 100,
      isFreeLoyaltyReward: isFreeReward,
      totalPlateWashesSoFar: loyalty.totalApprovedWashes + 1,
      entryTime: isFreeReward ? new Date() : null,
    });

    const saved = await this.washRepo.save(session);
    this.logger.log(`Nueva orden de lavado creada: ${saved.id} (Placa: ${cleanPlate}, Monto: ${amount} COP)`);

    if (isFreeReward) {
      setTimeout(async () => {
        this.gatewayLavado.broadcastStageChange(saved.id, FaseLavado.PAYMENT_CONFIRMED);
        await this.servicioArduino.openBarrier(saved.id);
        this.gatewayLavado.broadcastBarrierOpened(saved.id);
        setTimeout(async () => {
          await this.servicioArduino.startWashSequence(saved.id, PlanLavado.FULL_WASH);
        }, 2000);
      }, 500);
    }

    return saved;
  }

  async getSessionById(id: string): Promise<SesionLavado> {
    const session = await this.washRepo.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Sesión ${id} no encontrada`);
    }
    return session;
  }

  async getSessionByReference(reference: string): Promise<SesionLavado> {
    const session = await this.washRepo.findOne({ where: { paymentReference: reference } });
    if (!session) {
      throw new NotFoundException(`Sesión con referencia ${reference} no encontrada`);
    }
    return session;
  }

  async handlePaymentApproved(sessionId: string, transactionId: string): Promise<SesionLavado> {
    const session = await this.getSessionById(sessionId);
    session.paymentStatus = 'APPROVED';
    session.wompiTransactionId = transactionId;
    session.stage = FaseLavado.PAYMENT_CONFIRMED;
    session.entryTime = new Date();

    const updated = await this.washRepo.save(session);
    this.logger.log(` Pago Wompi Aprobado para ${session.licensePlate}. Abriendo talanquera con Arduino.`);

    this.gatewayLavado.broadcastStageChange(session.id, FaseLavado.PAYMENT_CONFIRMED);
    await this.servicioArduino.openBarrier(session.id);
    this.gatewayLavado.broadcastBarrierOpened(session.id);

    setTimeout(async () => {
      await this.servicioArduino.startWashSequence(session.id, session.plan);
    }, 2000);

    return updated;
  }

  private async handleArduinoEvent(event: EventoArduino) {
    if (!event.sessionId) return;

    try {
      const session = await this.washRepo.findOne({ where: { id: event.sessionId } });
      if (!session) return;

      if (event.type === 'BARRIER_OPENED') {
        session.stage = FaseLavado.BARRIER_OPENED;
        await this.washRepo.save(session);
        this.gatewayLavado.broadcastStageChange(session.id, FaseLavado.BARRIER_OPENED);
      } else if (event.type === 'CAR_DETECTED') {
        session.stage = FaseLavado.VEHICLE_POSITIONED;
        await this.washRepo.save(session);
        this.gatewayLavado.broadcastStageChange(session.id, FaseLavado.VEHICLE_POSITIONED);
      } else if (event.type === 'STAGE_CHANGE' && event.stage) {
        session.stage = event.stage as FaseLavado;
        await this.washRepo.save(session);
        this.gatewayLavado.broadcastStageChange(session.id, session.stage);
      } else if (event.type === 'FINISHED') {
        session.stage = FaseLavado.STAGE_FINISHED;
        session.finishTime = new Date();
        await this.washRepo.save(session);
        this.gatewayLavado.broadcastStageChange(session.id, FaseLavado.STAGE_FINISHED);
      }
    } catch (err: any) {
      this.logger.error(`Error evento Arduino: ${err.message}`);
    }
  }

  async getWashLogs(limit = 20, page = 1) {
    const [items, total] = await this.washRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAdminKPIs() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWashes = await this.washRepo.find({
      where: {
        createdAt: Between(todayStart, todayEnd),
        paymentStatus: 'APPROVED',
      },
    });

    const totalTodayRevenue = todayWashes.reduce((acc, w) => acc + Number(w.amount), 0);
    const activeWashes = await this.washRepo.count({
      where: [
        { stage: FaseLavado.STAGE_SHAMPOO },
        { stage: FaseLavado.STAGE_SPONGES },
        { stage: FaseLavado.STAGE_RINSE },
        { stage: FaseLavado.STAGE_FAN_DRYING },
        { stage: FaseLavado.BARRIER_OPENED },
      ],
    });

    const totalAllTime = await this.washRepo.count();

    const uniquePlatesRaw = await this.washRepo
      .createQueryBuilder('wash')
      .select('wash.licensePlate', 'plate')
      .addSelect('COUNT(wash.id)', 'count')
      .where('wash.paymentStatus = :status', { status: 'APPROVED' })
      .groupBy('wash.licensePlate')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const recurringVehiclesCount = uniquePlatesRaw.filter(p => parseInt(p.count, 10) > 1).length;

    return {
      todayRevenue: totalTodayRevenue,
      todayWashesCount: todayWashes.length,
      activeBays: activeWashes,
      totalAllTimeWashes: totalAllTime,
      loyaltyStats: {
        totalUniqueVehicles: uniquePlatesRaw.length,
        recurringVehiclesCount,
        topFrequentPlates: uniquePlatesRaw,
      },
      arduino: this.servicioArduino.getStatus(),
    };
  }

  async adminManualOpenBarrier(sessionId: string) {
    await this.servicioArduino.openBarrier(sessionId);
    this.gatewayLavado.broadcastBarrierOpened(sessionId);
    return { success: true, message: 'Talanquera abierta manualmente' };
  }

  async adminEmergencyStop() {
    await this.servicioArduino.emergencyStop();
    return { success: true, message: 'Parada de emergencia ejecutada en Arduino' };
  }
}

// Alias para compatibilidad
export const WashService = ServicioLavado;
