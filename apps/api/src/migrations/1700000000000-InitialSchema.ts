import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('SALES', 'REVIEWER', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "merchant_applications_status_enum"
          AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','INFO_REQUESTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "merchant_applications_risk_status_enum"
          AS ENUM ('PENDING','APPROVED','FLAGGED','REJECTED','FAILED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"            uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt"     timestamptz NOT NULL DEFAULT now(),
        "updatedAt"     timestamptz NOT NULL DEFAULT now(),
        "email"         varchar     NOT NULL,
        "password_hash" varchar     NOT NULL,
        "role"          "users_role_enum" NOT NULL,
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "merchant_applications" (
        "id"                   uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt"            timestamptz NOT NULL DEFAULT now(),
        "updatedAt"            timestamptz NOT NULL DEFAULT now(),
        "created_by_id"        uuid        NOT NULL,
        "assigned_reviewer_id" uuid,
        "status"               "merchant_applications_status_enum" NOT NULL DEFAULT 'DRAFT',
        "risk_status"          "merchant_applications_risk_status_enum",
        "submission_count"     integer     NOT NULL DEFAULT 0,
        "business_name"        varchar,
        "legal_business_name"  varchar,
        "business_type"        varchar,
        "country"              varchar,
        "mcc"                  varchar,
        "monthly_volume"       numeric,
        "owner_info"           jsonb,
        "bank_account_number"  varchar,
        "routing_number"       varchar,
        "risk_score"           numeric,
        "risk_reasons"         text[],
        "risk_reference"       varchar,
        "risk_checked_at"      timestamptz,
        "submitted_at"         timestamptz,
        "decided_at"           timestamptz,
        "version"              integer     NOT NULL DEFAULT 1,
        CONSTRAINT "PK_09b9df0877db73b8a232c8c7ed4" PRIMARY KEY ("id"),
        CONSTRAINT "FK_2da4df0ec53929a13cb78d8496a"
          FOREIGN KEY ("created_by_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_7da78a3bb9e76995dba067b83ed"
          FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "merchant_applications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "merchant_applications_risk_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "merchant_applications_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
