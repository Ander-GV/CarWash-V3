import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { WashService } from './wash.service';
import { CreateWashDto } from './dto/wash.dto';
import { WompiService } from '../payments/wompi.service';

@Controller('client/wash')
export class WashClientController {
  constructor(
    private readonly washService: WashService,
    private readonly wompiService: WompiService,
  ) {}

  /**
   * Consultar puntos acumulados y beneficio de fidelidad por placa vehicular
   */
  @Get('loyalty/:plate')
  async getPlateLoyalty(@Param('plate') plate: string) {
    return this.washService.getPlateLoyaltyInfo(plate);
  }

  /**
   * Vista Pública/Kiosco: Crear orden de lavado único y preparar checkout de Wompi
   */
  @Post('initiate')
  async initiateWashSession(@Body() dto: CreateWashDto) {
    const session = await this.washService.createSession(dto);
    const redirectUrl = process.env.CLIENT_REDIRECT_URL || `http://localhost:5173/tracker/${session.id}`;

    // Si fue gratis por fidelidad, no se necesita abrir pasarela Wompi
    if (session.isFreeLoyaltyReward) {
      return {
        success: true,
        sessionId: session.id,
        isFreeReward: true,
        session,
        wompiConfig: null,
      };
    }

    const wompiConfig = this.wompiService.getCheckoutConfig(
      session.paymentReference,
      Number(session.amount),
      redirectUrl,
    );

    return {
      success: true,
      sessionId: session.id,
      isFreeReward: false,
      session,
      wompiConfig,
    };
  }

  /**
   * Vista Pública/Kiosco: Obtener estado en vivo de la fase de lavado
   */
  @Get(':id/status')
  async getLiveStatus(@Param('id') id: string) {
    const session = await this.washService.getSessionById(id);
    return {
      id: session.id,
      licensePlate: session.licensePlate,
      plan: session.plan,
      stage: session.stage,
      paymentStatus: session.paymentStatus,
      isFreeLoyaltyReward: session.isFreeLoyaltyReward,
      entryTime: session.entryTime,
      finishTime: session.finishTime,
    };
  }
}
