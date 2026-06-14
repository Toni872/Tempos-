import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Adds `activatedAt` column to the users table.
 *
 * This column stores the timestamp when an employee activates their account
 * via the employee invitation flow. Nullable — only set on successful activation.
 */
export class AddActivatedAtColumn1790000000000 implements MigrationInterface {
  name = "AddActivatedAtColumn1790000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "activatedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "activatedAt"`,
    );
  }
}
