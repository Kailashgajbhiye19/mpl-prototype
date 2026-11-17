import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import * as express from 'express';
import * as process from 'process';
import type { NextFunction, Request, Response } from 'express';
import { getApiBaseUrl } from './config/urls';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') getApiBaseUrl();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // For Caching handle
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders:
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    exposedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Static uploads
  // app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Marketplace Literacy Training System Chhattisgarh API')
    .setDescription(
      'Complete system with Admin, Trainers, Participants, Reports & Dashboard',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('/ml-api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 6062;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api`);
  console.log(`🖼️  Uploads available at: http://localhost:${port}/uploads`);
}
bootstrap().catch((error) => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
