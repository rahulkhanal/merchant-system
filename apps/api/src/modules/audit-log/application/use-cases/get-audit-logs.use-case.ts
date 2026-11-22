import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../domain/audit-log.js';
import { AuditLogRepository } from '../ports/audit-log.repository.port.js';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly repo: AuditLogRepository) {}

  execute(entityId: string): Promise<AuditLog[]> {
    return this.repo.findByEntityId(entityId);
  }
}
