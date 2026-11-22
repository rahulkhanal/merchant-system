import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entity_id', type: 'varchar' })
  entityId!: string;

  @Column({ name: 'entity_type', type: 'varchar' })
  entityType!: string;

  @Column({ type: 'varchar' })
  action!: string;

  @Column({ name: 'actor_id', type: 'varchar' })
  actorId!: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
