import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Merchant API')
    .setDescription('Payment Service Provider API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Short-lived access token (15 min). Obtain from /auth/login or /auth/register.' },
      'access-token',
    )
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Long-lived refresh token (7 days). Pass to /auth/refresh to get a new token pair.' },
      'refresh-token',
    )
    .build();

  SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
