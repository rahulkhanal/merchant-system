import { NestFactory } from '@nestjs/core';
import { KybMockModule } from './kyb-mock.module.js';

async function bootstrap() {
  const app = await NestFactory.create(KybMockModule);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
