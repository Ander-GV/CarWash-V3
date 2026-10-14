import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ServicioLavado } from './wash.service';
import { DtoCrearLavado } from './dto/wash.dto';
import { ServicioWompi } from '../payments/wompi.service';

@Controller('client/wash')
export class ControladorClienteLavado {
  constructor(
    private readonly servicioLavado: ServicioLavado,
    private readonly servicioWompi: ServicioWompi,
  ) {}

  @Get('loyalty/:plate')
  async getPlateLoyalty(@Param('plate') plate: string) {
    return this.servicioLavado.getPlateLoyaltyInfo(plate);
  }

  @Post('initiate')
  async initiateWashSession(@Body() dto: DtoCrearLavado) {
    const session = await this.servicioLavado.createSession(dto);
    const redirectUrl = process.env.CLIENT_REDIRECT_URL || `http://localhost:5173/tracker/${session.id}`;

    if (session.isFreeLoyaltyReward) {
      return {
        success: true,
        sessionId: session.id,
        isFreeReward: true,
        session,
        wompiConfig: null,
      };
    }

    const wompiConfig = this.servicioWompi.getCheckoutConfig(
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

  @Get(':id/status')
  async getLiveStatus(@Param('id') id: string) {
    const session = await this.servicioLavado.getSessionById(id);
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

// Alias para compatibilidad
export const WashClientController = ControladorClienteLavado;
