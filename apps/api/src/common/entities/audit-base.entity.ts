import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Base for append-only tables. No updatedAt — rows are never modified.
 */
export abstract class AuditBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
