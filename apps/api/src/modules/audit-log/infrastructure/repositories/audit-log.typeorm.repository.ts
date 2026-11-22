import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../domain/audit-log.js';
import { AuditLogRepository } from '../../application/ports/audit-log.repository.port.js';
import { AuditLogEntity } from '../entities/audit-log.entity.js';

@Injectable()
export class AuditLogTypeOrmRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repo: Repository<AuditLogEntity>,
  ) {}

  async create(params: {
    entityId: string;
    entityType: string;
    action: string;
    actorId: string;
    metadata: Record<string, unknown>;
  }): Promise<AuditLog> {
    const entity = this.repo.create(params);
    return this.toDomain(await this.repo.save(entity));
  }

  async findByEntityId(entityId: string): Promise<AuditLog[]> {
    const entities = await this.repo.findBy({ entityId });
    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: AuditLogEntity): AuditLog {
    return AuditLog.reconstitute({
      id: entity.id,
      entityId: entity.entityId,
      entityType: entity.entityType,
      action: entity.action,
      actorId: entity.actorId,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    });
  }
}
