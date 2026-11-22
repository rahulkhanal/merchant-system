import { AuditLog } from '../../domain/audit-log.js';

export abstract class AuditLogRepository {
  abstract create(params: {
    entityId: string;
    entityType: string;
    action: string;
    actorId: string;
    metadata: Record<string, unknown>;
  }): Promise<AuditLog>;
  abstract findByEntityId(entityId: string): Promise<AuditLog[]>;
}
