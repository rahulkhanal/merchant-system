import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { AuditLogRepository } from '../../../audit-log/application/ports/audit-log.repository.port.js';
import { KybQueuePort } from '../ports/kyb-queue.port.js';
import { RiskStatus } from '../../domain/risk-status.enum.js';
import { MerchantApplication } from '../../domain/merchant-application.js';

@Injectable()
export class RetryRiskUseCase {
  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly auditLog: AuditLogRepository,
    private readonly kybQueue: KybQueuePort,
  ) {}

  async execute(id: string, actorId: string): Promise<MerchantApplication> {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundException('Application not found');
    if (app.riskStatus !== RiskStatus.FAILED) {
      throw new UnprocessableEntityException('Risk review is not in FAILED state');
    }

    app.riskStatus = RiskStatus.PENDING;
    const saved = await this.repo.save(app);

    await this.kybQueue.enqueue(id);

    await this.auditLog.create({
      entityId: id,
      entityType: 'MerchantApplication',
      action: 'RISK_RETRY',
      actorId,
      metadata: {},
    });

    return saved;
  }
}
