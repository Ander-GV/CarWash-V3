import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { WompiService } from './wompi.service';
import { WashService } from '../wash/wash.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly wompiService: WompiService,
    private readonly washService: WashService,
  ) {}

  /**
   * Genera los parámetros de checkout con firma SHA-256 para el Widget Wompi en React
   */
  @Post('prepare/:sessionId')
  async prepareWompiCheckout(@Param('sessionId') sessionId: string) {
    const session = await this.washService.getSessionById(sessionId);
    const redirectUrl = process.env.CLIENT_REDIRECT_URL || `http://localhost:5173/tracker/${session.id}`;

    const config = this.wompiService.getCheckoutConfig(
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

  /**
   * Webhook oficial de Wompi (Notificación de transacción completada)
   */
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
    const status = data.status; // 'APPROVED', 'DECLINED', etc.
    const transactionId = data.id;

    if (status === 'APPROVED') {
      try {
        const session = await this.washService.getSessionByReference(reference);
        await this.washService.handlePaymentApproved(session.id, transactionId);
        this.logger.log(` Transacción ${transactionId} APROBADA para referencia ${reference}. Arduino notificado.`);
      } catch (err: any) {
        this.logger.error(`Error procesando sesión tras pago Wompi: ${err.message}`);
      }
    }

    return { received: true, status: 'PROCESSED' };
  }

  /**
   * Endpoint de simulación para pruebas en kiosco y desarrollo (sin requerir tarjeta real)
   */
  @Post('simulate-success/:sessionId')
  async simulatePaymentSuccess(@Param('sessionId') sessionId: string) {
    const mockTransactionId = `SIM-WOMPI-${Date.now()}`;
    const updated = await this.washService.handlePaymentApproved(sessionId, mockTransactionId);
    return {
      success: true,
      message: 'Pago simulado aprobado exitosamente. Señal enviada a Arduino para abrir talanquera.',
      session: updated,
    };
  }
}
