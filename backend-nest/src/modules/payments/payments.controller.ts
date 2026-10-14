import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ServicioWompi } from './wompi.service';
import { ServicioLavado } from '../wash/wash.service';

@Controller('payments')
export class ControladorPagos {
  private readonly logger = new Logger(ControladorPagos.name);

  constructor(
    private readonly servicioWompi: ServicioWompi,
    private readonly servicioLavado: ServicioLavado,
  ) {}

  @Post('prepare/:sessionId')
  async prepareWompiCheckout(@Param('sessionId') sessionId: string) {
    const session = await this.servicioLavado.getSessionById(sessionId);
    const redirectUrl = process.env.CLIENT_REDIRECT_URL || `http://localhost:5173/tracker/${session.id}`;

    const config = this.servicioWompi.getCheckoutConfig(
      session.paymentReference,
      Number(session.amount),
      redirectUrl,
    );

    return {
      sessionId: session.id,
      licensePlate: session.licensePlate,
      plan: session.plan,
      amount: Number(session.amount),
      wompiConfig: config,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('wompi-webhook')
  async handleWompiWebhook(
    @Body() payload: any,
    @Headers('x-event-checksum') checksum: string,
  ) {
    this.logger.log(`Webhook recibido de Wompi: ${JSON.stringify(payload?.event)}`);

    const data = payload?.data?.transaction;
    if (!data) {
      return { received: true };
    }

    const reference = data.reference;
    const status = data.status;
    const transactionId = data.id;

    if (status === 'APPROVED') {
      try {
        const session = await this.servicioLavado.getSessionByReference(reference);
        await this.servicioLavado.handlePaymentApproved(session.id, transactionId);
        this.logger.log(` Transacción ${transactionId} APROBADA para referencia ${reference}. Arduino notificado.`);
      } catch (err: any) {
        this.logger.error(`Error procesando sesión tras pago Wompi: ${err.message}`);
      }
    }

    return { received: true, status: 'PROCESSED' };
  }

  @Post('simulate-success/:sessionId')
  async simulatePaymentSuccess(@Param('sessionId') sessionId: string) {
    const mockTransactionId = `SIM-WOMPI-${Date.now()}`;
    const updated = await this.servicioLavado.handlePaymentApproved(sessionId, mockTransactionId);
    return {
      success: true,
      message: 'Pago simulado aprobado exitosamente. Señal enviada a Arduino para abrir talanquera.',
      session: updated,
    };
  }
}

// Alias para compatibilidad
export const PaymentsController = ControladorPagos;
