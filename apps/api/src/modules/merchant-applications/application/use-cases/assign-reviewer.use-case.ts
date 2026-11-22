import { Injectable, NotFoundException } from '@nestjs/common';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { AuditLogRepository } from '../../../audit-log/application/ports/audit-log.repository.port.js';
import { MerchantApplication } from '../../domain/merchant-application.js';

@Injectable()
export class AssignReviewerUseCase {
  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async execute(id: string, reviewerId: string, actorId: string): Promise<MerchantApplication> {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundException('Application not found');

    app.assignedReviewerId = reviewerId;
    const saved = await this.repo.save(app);

    await this.auditLog.create({
      entityId: id,
      entityType: 'MerchantApplication',
      action: 'REVIEWER_ASSIGNED',
      actorId,
      metadata: { reviewerId },
    });

    return saved;
  }
}
