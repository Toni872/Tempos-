import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRRHHAdvancedFields1776078457186 implements MigrationInterface {
    name = 'AddRRHHAdvancedFields1776078457186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "work_centers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "address" character varying(255), "latitude" numeric(10,8), "longitude" numeric(11,8), "radiusMeters" integer NOT NULL DEFAULT '100', "qrToken" character varying(255), "status" character varying NOT NULL DEFAULT 'active', "companyId" character varying NOT NULL DEFAULT 'tempos-demo', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d6d37891a931818212a811cdb2e" UNIQUE ("qrToken"), CONSTRAINT "PK_efd461c689b6b2894c3ab1c930a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "hourlyRate" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "overtimeRate" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "requiresGeolocation" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "requiresQR" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "kioskPin" character varying(10)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "kioskPin"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "requiresQR"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "requiresGeolocation"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "overtimeRate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hourlyRate"`);
        await queryRunner.query(`DROP TABLE "work_centers"`);
    }

}
