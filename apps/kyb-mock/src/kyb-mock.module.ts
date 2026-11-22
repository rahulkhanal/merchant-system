import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiKeyGuard } from './guard/api-key.guard.js';
import { KybChecksController } from './kyb-checks.controller.js';
import { KybChecksService } from './kyb-checks.service.js';

@Module({
  imports: [ThrottlerModule.forRoot({ throttlers: [{ limit: 10, ttl: 60000 }] })],
  controllers: [KybChecksController],
  providers: [KybChecksService, ApiKeyGuard],
})
export class KybMockModule {}
