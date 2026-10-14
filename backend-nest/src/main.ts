import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { ModuloPrincipal } from './app.module';

async function bootstrap() {
  const logger = new Logger('CarWashBootstrap');
  const app = await NestFactory.create(ModuloPrincipal);

  // 1. Capa de Seguridad HTTP con Helmet
  app.use(helmet());

  // 2. Configuración de CORS segura para Frontend React (Kiosco y Admin)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Validación y sanitización global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Prefijo Global para la API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(` CAR WASH V3 BACKEND OPERACIONAL EN: http://localhost:${port}/api`);
  logger.log(` Módulo Cliente (Público):  http://localhost:${port}/api/client/wash`);
  logger.log(` Módulo Admin (Protegido): http://localhost:${port}/api/admin/wash`);
  logger.log(` WebSockets en tiempo real: ws://localhost:${port}/wash-stream`);
  logger.log(` Webhooks Wompi listos en: http://localhost:${port}/api/payments/wompi-webhook`);
  logger.log(`====================================================`);
}
bootstrap();
