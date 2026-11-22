import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogRepository } from './application/ports/audit-log.repository.port.js';
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs.use-case.js';
import { AuditLogEntity } from './infrastructure/entities/audit-log.entity.js';
import { AuditLogTypeOrmRepository } from './infrastructure/repositories/audit-log.typeorm.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [
    { provide: AuditLogRepository, useClass: AuditLogTypeOrmRepository },
    GetAuditLogsUseCase,
  ],
  exports: [AuditLogRepository, GetAuditLogsUseCase],
})
export class AuditLogModule {}
