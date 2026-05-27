import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCifAndCompanyDomain1777305600001 implements MigrationInterface {
  name = "AddCifAndCompanyDomain1777305600001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "cif" character varying(12)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "companyDomain" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "companyDomain"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "cif"`);
  }
}
