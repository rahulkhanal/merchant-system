import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantApplicationRepository } from './application/ports/merchant-application.repository.port.js';
import { KybQueuePort } from './application/ports/kyb-queue.port.js';
import { KybProviderPort } from './application/ports/kyb-provider.port.js';
import { CreateApplicationUseCase } from './application/use-cases/create-application.use-case.js';
import { GetApplicationUseCase } from './application/use-cases/get-application.use-case.js';
import { ListApplicationsUseCase } from './application/use-cases/list-applications.use-case.js';
import { ProcessRiskReviewUseCase } from './application/use-cases/process-risk-review.use-case.js';
import { SubmitApplicationUseCase } from './application/use-cases/submit-application.use-case.js';
import { UpdateApplicationUseCase } from './application/use-cases/update-application.use-case.js';
import { RecordDecisionUseCase } from './application/use-cases/record-decision.use-case.js';
import { AssignReviewerUseCase } from './application/use-cases/assign-reviewer.use-case.js';
import { RetryRiskUseCase } from './application/use-cases/retry-risk.use-case.js';
import { MerchantApplicationEntity } from './infrastructure/entities/merchant-application.entity.js';
import { KybHttpClient } from './infrastructure/http/kyb-http-client.js';
import { ProcessRiskReviewProcessor } from './infrastructure/jobs/process-risk-review.processor.js';
import { StalledReviewSweep } from './infrastructure/jobs/stalled-review.sweep.js';
import { KybBullMQQueue, KYB_QUEUE_NAME } from './infrastructure/queue/kyb.bullmq.queue.js';
import { MerchantApplicationTypeOrmRepository } from './infrastructure/repositories/merchant-application.typeorm.repository.js';
import { FieldEncryptionService } from './infrastructure/services/field-encryption.service.js';
import { MerchantsController } from './presentation/http/merchants.controller.js';
import { IdentityModule } from '../identity/identity.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([MerchantApplicationEntity]),
    BullModule.registerQueue({
      name: KYB_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    IdentityModule,
    AuditLogModule,
  ],
  controllers: [MerchantsController],
  providers: [
    CreateApplicationUseCase,
    GetApplicationUseCase,
    ListApplicationsUseCase,
    UpdateApplicationUseCase,
    SubmitApplicationUseCase,
    ProcessRiskReviewUseCase,
    RecordDecisionUseCase,
    AssignReviewerUseCase,
    RetryRiskUseCase,
    ProcessRiskReviewProcessor,
    StalledReviewSweep,
    FieldEncryptionService,
    { provide: MerchantApplicationRepository, useClass: MerchantApplicationTypeOrmRepository },
    { provide: KybQueuePort, useClass: KybBullMQQueue },
    { provide: KybProviderPort, useClass: KybHttpClient },
  ],
  exports: [MerchantApplicationRepository],
})
export class MerchantApplicationsModule {}
