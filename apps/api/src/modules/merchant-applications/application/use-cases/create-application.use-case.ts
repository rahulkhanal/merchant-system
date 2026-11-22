import { Injectable } from '@nestjs/common';
import { MerchantApplication } from '../../domain/merchant-application.js';
import { MerchantApplicationRepository } from '../ports/merchant-application.repository.port.js';
import { AuditLogRepository } from '../../../audit-log/application/ports/audit-log.repository.port.js';

@Injectable()
export class CreateApplicationUseCase {
  constructor(
    private readonly repo: MerchantApplicationRepository,
    private readonly auditLog: AuditLogRepository,
  ) {}

  async execute(actorId: string): Promise<MerchantApplication> {
    const app = await this.repo.create(actorId);
    await this.auditLog.create({
      entityId: app.id,
      entityType: 'MerchantApplication',
      action: 'CREATED',
      actorId,
      metadata: {},
    });
    return app;
  }
}
