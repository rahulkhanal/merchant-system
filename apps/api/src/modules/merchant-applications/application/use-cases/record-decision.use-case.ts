import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { AuditLogRepository } from '../../../audit-log/application/ports/audit-log.repository.port.js';
import { MerchantApplication } from '../../domain/merchant-application.js';

type Decision = 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED';

@Injectable()
export class RecordDecisionUseCase {
  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async execute(id: string, actorId: string, decision: Decision, notes?: string): Promise<MerchantApplication> {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundException('Application not found');

    if (app.assignedReviewerId && app.assignedReviewerId !== actorId) {
      throw new ForbiddenException('Only the assigned reviewer may record a decision on this application');
    }

    if (decision === 'APPROVED') app.approve(notes);
    else if (decision === 'REJECTED') app.reject(notes);
    else app.requestInfo(notes);

    const saved = await this.repo.save(app);

    await this.auditLog.create({
      entityId: id,
      entityType: 'MerchantApplication',
      action: decision,
      actorId,
      metadata: { notes: notes ?? null },
    });

    return saved;
  }
}
