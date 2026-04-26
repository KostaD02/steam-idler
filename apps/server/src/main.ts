import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const globalPrefix = 'api';
  const logger = new Logger(bootstrap.name);
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  const config = new DocumentBuilder()
    .setTitle('Steam Idler')
    .setDescription('The Steam Idler API description')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const swaggerPath = `${globalPrefix}/swagger`;
  SwaggerModule.setup(swaggerPath, app, documentFactory, {
    jsonDocumentUrl: `${swaggerPath}/json`,
  });

  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `Swagger docs is available on: http://localhost:${port}/${swaggerPath}`,
  );
}

bootstrap();
