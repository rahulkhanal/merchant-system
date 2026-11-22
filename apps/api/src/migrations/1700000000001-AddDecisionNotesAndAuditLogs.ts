import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDecisionNotesAndAuditLogs1700000000001 implements MigrationInterface {
  name = 'AddDecisionNotesAndAuditLogs1700000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "merchant_applications"
      ADD COLUMN IF NOT EXISTS "decision_notes" varchar
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "entity_id"   varchar     NOT NULL,
        "entity_type" varchar     NOT NULL,
        "action"      varchar     NOT NULL,
        "actor_id"    varchar     NOT NULL,
        "metadata"    jsonb       NOT NULL DEFAULT '{}',
        "created_at"  timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_audit_logs_entity_id" ON "audit_logs" ("entity_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_logs_entity_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`ALTER TABLE "merchant_applications" DROP COLUMN IF EXISTS "decision_notes"`);
  }
}
