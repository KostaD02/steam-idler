import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

  await app.listen(process.env.PORT || 3000);
}

bootstrap()
  .then(() => {
    logger.log('Server is running on port 3000');
  })
  .catch((error) => {
    logger.error(error);
  });
