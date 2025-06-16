import { NestFactory } from '@nestjs/core';
import { Logger, NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

const PORT = process.env.PORT || 2222;

Logger.log('Starting server', 'Bootstrap');

async function bootstrap() {
  const options: Partial<NestApplicationOptions> = {};

  if (process.env.HIDE_LOGS === 'true') {
    options.logger = false;
  }

  if (!process.env.JWT_SECRET) {
    Logger.fatal('JWT_SECRET is required in .env');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, options);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Steam Idler')
    .setDescription('Self-hosted Steam Idler')
    .setVersion('0.0.0')
    .setLicense(
      'MIT',
      'https://github.com/kostad02/steam-idler/blob/main/LICENSE',
    )
    .setContact(
      'Konstantine Datunishvili',
      'https://konstantinedatunishvili.com',
      'konstantine@datunishvili.ge',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  await app.listen(PORT);
}

bootstrap()
  .then(() => {
    Logger.log(`Server is running on port ${PORT}`, 'Bootstrap');
  })
  .catch((error) => {
    Logger.error(error, 'Bootstrap');
  });
