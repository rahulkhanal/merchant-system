import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserEntity } from './modules/identity/infrastructure/entities/user.entity.js';
import { MerchantApplicationEntity } from './modules/merchant-applications/infrastructure/entities/merchant-application.entity.js';
import { AuditLogEntity } from './modules/audit-log/infrastructure/entities/audit-log.entity.js';
import { InitialSchema1700000000000 } from './migrations/1700000000000-InitialSchema.js';
import { AddDecisionNotesAndAuditLogs1700000000001 } from './migrations/1700000000001-AddDecisionNotesAndAuditLogs.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DB_HOST'],
  port: Number(process.env['DB_PORT']),
  username: process.env['DB_USER'],
  password: process.env['DB_PASS'],
  database: process.env['DB_NAME'],
  entities: [UserEntity, MerchantApplicationEntity, AuditLogEntity],
  migrations: [InitialSchema1700000000000, AddDecisionNotesAndAuditLogs1700000000001],
  synchronize: false,
});
