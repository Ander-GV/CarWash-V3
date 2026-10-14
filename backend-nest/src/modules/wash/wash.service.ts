import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WashSession } from './entities/wash-session.entity';
import { CreateWashDto } from './dto/wash.dto';
import { WashPlan, WashStage, SINGLE_WASH_PRICE_COP, WASHES_FOR_FREE_REWARD } from '../../common/enums/wash-stage.enum';
import { ArduinoService, ArduinoEvent } from '../hardware/arduino.service';
import { WashGateway } from './wash.gateway';

@Injectable()
export class WashService implements OnModuleInit {
  private readonly logger = new Logger(WashService.name);

  constructor(
    @InjectRepository(WashSession)
    private readonly washRepo: Repository<WashSession>,
    private readonly arduinoService: ArduinoService,
    private readonly washGateway: WashGateway,
  ) {}

  onModuleInit() {
    this.arduinoService.eventStream$.subscribe((event: ArduinoEvent) => {
      this.handleArduinoEvent(event);
    });
  }

  /**
   * Consultar estatus de fidelización y puntos por placa vehicular
   */
  async getPlateLoyaltyInfo(rawPlate: string) {
    const licensePlate = rawPlate.toUpperCase().trim();
    const approvedWashes = await this.washRepo.count({
      where: {
        licensePlate,
        paymentStatus: 'APPROVED',
      },
    });

    const nextWashNumber = approvedWashes + 1;
    // Cada 6to lavado es gratis (5 lavados acumulados previos)
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

  /**
   * Crear nueva sesión de lavado único con acumulación de puntos
   */
  async createSession(dto: CreateWashDto): Promise<WashSession> {
    const cleanPlate = dto.licensePlate.toUpperCase().trim();
    const loyalty = await this.getPlateLoyaltyInfo(cleanPlate);

    // Si le corresponde el lavado gratis por fidelidad, el monto es 0 COP
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
      plan: WashPlan.FULL_WASH,
      amount,
      stage: isFreeReward ? WashStage.PAYMENT_CONFIRMED : WashStage.PENDING_PAYMENT,
      paymentStatus: isFreeReward ? 'APPROVED' : 'PENDING',
      paymentReference,
      pointsEarned: 100,
      isFreeLoyaltyReward: isFreeReward,
      totalPlateWashesSoFar: loyalty.totalApprovedWashes + 1,
      entryTime: isFreeReward ? new Date() : null,
    });

    const saved = await this.washRepo.save(session);
    this.logger.log(`Nueva orden de lavado creada: ${saved.id} (Placa: ${cleanPlate}, Monto: ${amount} COP)`);

    // Si fue gratis por fidelidad, disparar directamente al Arduino sin requerir pago
    if (isFreeReward) {
      setTimeout(async () => {
        this.washGateway.broadcastStageChange(saved.id, WashStage.PAYMENT_CONFIRMED);
        await this.arduinoService.openBarrier(saved.id);
        this.washGateway.broadcastBarrierOpened(saved.id);
        setTimeout(async () => {
          await this.arduinoService.startWashSequence(saved.id, WashPlan.FULL_WASH);
        }, 2000);
      }, 500);
    }

    return saved;
  }

  async getSessionById(id: string): Promise<WashSession> {
    const session = await this.washRepo.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException(`Sesión ${id} no encontrada`);
    }
    return session;
  }

  async getSessionByReference(reference: string): Promise<WashSession> {
    const session = await this.washRepo.findOne({ where: { paymentReference: reference } });
    if (!session) {
      throw new NotFoundException(`Sesión con referencia ${reference} no encontrada`);
    }
    return session;
  }

  /**
   * Procesar aprobación de pago Wompi
   */
  async handlePaymentApproved(sessionId: string, transactionId: string): Promise<WashSession> {
    const session = await this.getSessionById(sessionId);
    session.paymentStatus = 'APPROVED';
    session.wompiTransactionId = transactionId;
    session.stage = WashStage.PAYMENT_CONFIRMED;
    session.entryTime = new Date();

    const updated = await this.washRepo.save(session);
    this.logger.log(` Pago Wompi Aprobado para ${session.licensePlate}. Abriendo talanquera con Arduino.`);

    this.washGateway.broadcastStageChange(session.id, WashStage.PAYMENT_CONFIRMED);
    await this.arduinoService.openBarrier(session.id);
    this.washGateway.broadcastBarrierOpened(session.id);

    // Iniciar el ciclo de lavado en Arduino
    setTimeout(async () => {
      await this.arduinoService.startWashSequence(session.id, session.plan);
    }, 2000);

    return updated;
  }

  private async handleArduinoEvent(event: ArduinoEvent) {
    if (!event.sessionId) return;

    try {
      const session = await this.washRepo.findOne({ where: { id: event.sessionId } });
      if (!session) return;

      if (event.type === 'BARRIER_OPENED') {
        session.stage = WashStage.BARRIER_OPENED;
        await this.washRepo.save(session);
        this.washGateway.broadcastStageChange(session.id, WashStage.BARRIER_OPENED);
      } else if (event.type === 'CAR_DETECTED') {
        session.stage = WashStage.VEHICLE_POSITIONED;
        await this.washRepo.save(session);
        this.washGateway.broadcastStageChange(session.id, WashStage.VEHICLE_POSITIONED);
      } else if (event.type === 'STAGE_CHANGE' && event.stage) {
        session.stage = event.stage as WashStage;
        await this.washRepo.save(session);
        this.washGateway.broadcastStageChange(session.id, session.stage);
      } else if (event.type === 'FINISHED') {
        session.stage = WashStage.STAGE_FINISHED;
        session.finishTime = new Date();
        await this.washRepo.save(session);
        this.washGateway.broadcastStageChange(session.id, WashStage.STAGE_FINISHED);
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
        { stage: WashStage.STAGE_SHAMPOO },
        { stage: WashStage.STAGE_SPONGES },
        { stage: WashStage.STAGE_RINSE },
        { stage: WashStage.STAGE_FAN_DRYING },
        { stage: WashStage.BARRIER_OPENED },
      ],
    });

    const totalAllTime = await this.washRepo.count();

    // Análisis de fidelización y recurrencia de vehículos para el Admin
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
      arduino: this.arduinoService.getStatus(),
    };
  }

  async adminManualOpenBarrier(sessionId: string) {
    await this.arduinoService.openBarrier(sessionId);
    this.washGateway.broadcastBarrierOpened(sessionId);
    return { success: true, message: 'Talanquera abierta manualmente' };
  }

  async adminEmergencyStop() {
    await this.arduinoService.emergencyStop();
    return { success: true, message: 'Parada de emergencia ejecutada en Arduino' };
  }
}
