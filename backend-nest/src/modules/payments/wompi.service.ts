import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ServicioWompi {
  private readonly logger = new Logger(ServicioWompi.name);

  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY || 'pub_test_Q5yDA9xoKdePCSC1WrU9AC9V01WA7rOo';
  private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_1234567890abcdef';
  private readonly eventsSecret = process.env.WOMPI_EVENTS_SECRET || 'test_events_secret_123456';

  generateIntegritySignature(reference: string, amountInCop: number, currency = 'COP'): string {
    const amountInCents = Math.round(amountInCop * 100);
    const rawString = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');
    return hash;
  }

  getCheckoutConfig(reference: string, amountInCop: number, redirectUrl: string) {
    const signature = this.generateIntegritySignature(reference, amountInCop);
    const amountInCents = Math.round(amountInCop * 100);

    return {
      publicKey: this.publicKey,
      currency: 'COP',
      amountInCents,
      reference,
      signature: {
        integrity: signature,
      },
      redirectUrl,
    };
  }

  validateWebhookChecksum(properties: any, timestamp: string, receivedChecksum: string): boolean {
    try {
      const concatenatedValues = Object.values(properties || {}).join('');
      const rawString = `${concatenatedValues}${timestamp}${this.eventsSecret}`;
      const calculatedChecksum = crypto.createHash('sha256').update(rawString).digest('hex');
      return calculatedChecksum === receivedChecksum;
    } catch (e: any) {
      this.logger.error(`Error validando checksum Wompi: ${e.message}`);
      return false;
    }
  }
}

// Alias para compatibilidad
export const WompiService = ServicioWompi;
