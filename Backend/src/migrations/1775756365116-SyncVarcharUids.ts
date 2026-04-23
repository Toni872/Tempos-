import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncVarcharUids1775756365116 implements MigrationInterface {
    name = 'SyncVarcharUids1775756365116'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "absences" DROP CONSTRAINT "FK_51dd37b347f1eb519b1e9a50202"`);
        await queryRunner.query(`ALTER TABLE "fichas" DROP CONSTRAINT "FK_7f365157e3f4670ee17feade3a7"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_d1b452d7f0d45863303b7d30000"`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" DROP CONSTRAINT "FK_d5c8540c38a1182ec3878ddc470"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_6e20ce1edf0678a09f1963f9587"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uid"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "uid" character varying(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_6e20ce1edf0678a09f1963f9587" PRIMARY KEY ("uid")`);
        await queryRunner.query(`DROP INDEX "public"."IDX_07e3c1ab49029545f39a49d4b1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2287a74add1da0fbba30e811ee"`);
        await queryRunner.query(`ALTER TABLE "fichas" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "fichas" ADD "userId" character varying(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "absences" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "absences" ADD "userId" character varying(128) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "userId" character varying(128) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e589da8f9e9326ee0d01a028"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" character varying(128)`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b179edfc496340bb52aa6f4fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8522aa2960a4ac50e9911d55b2"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD "userId" character varying(128) NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_533ebcd27ef0bb6d2590c517e8"`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" DROP COLUMN "changedBy"`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" ADD "changedBy" character varying(128) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_07e3c1ab49029545f39a49d4b1" ON "fichas" ("userId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_2287a74add1da0fbba30e811ee" ON "fichas" ("userId", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_99e589da8f9e9326ee0d01a028" ON "audit_logs" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b179edfc496340bb52aa6f4fa" ON "time_entries" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_8522aa2960a4ac50e9911d55b2" ON "time_entries" ("userId", "timestampUtc") `);
        await queryRunner.query(`CREATE INDEX "IDX_533ebcd27ef0bb6d2590c517e8" ON "time_entry_change_logs" ("changedBy", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "fichas" ADD CONSTRAINT "FK_7f365157e3f4670ee17feade3a7" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "absences" ADD CONSTRAINT "FK_51dd37b347f1eb519b1e9a50202" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_d1b452d7f0d45863303b7d30000" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" ADD CONSTRAINT "FK_d5c8540c38a1182ec3878ddc470" FOREIGN KEY ("changedBy") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" DROP CONSTRAINT "FK_d5c8540c38a1182ec3878ddc470"`);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP CONSTRAINT "FK_d1b452d7f0d45863303b7d30000"`);
        await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975"`);
        await queryRunner.query(`ALTER TABLE "absences" DROP CONSTRAINT "FK_51dd37b347f1eb519b1e9a50202"`);
        await queryRunner.query(`ALTER TABLE "fichas" DROP CONSTRAINT "FK_7f365157e3f4670ee17feade3a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_533ebcd27ef0bb6d2590c517e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8522aa2960a4ac50e9911d55b2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b179edfc496340bb52aa6f4fa"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e589da8f9e9326ee0d01a028"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2287a74add1da0fbba30e811ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_07e3c1ab49029545f39a49d4b1"`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" DROP COLUMN "changedBy"`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" ADD "changedBy" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_533ebcd27ef0bb6d2590c517e8" ON "time_entry_change_logs" ("changedBy", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "time_entries" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_8522aa2960a4ac50e9911d55b2" ON "time_entries" ("userId", "timestampUtc") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b179edfc496340bb52aa6f4fa" ON "time_entries" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_99e589da8f9e9326ee0d01a028" ON "audit_logs" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "documents" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "absences" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "absences" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fichas" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "fichas" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_2287a74add1da0fbba30e811ee" ON "fichas" ("userId", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_07e3c1ab49029545f39a49d4b1" ON "fichas" ("userId", "status") `);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "PK_6e20ce1edf0678a09f1963f9587"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uid"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "uid" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "PK_6e20ce1edf0678a09f1963f9587" PRIMARY KEY ("uid")`);
        await queryRunner.query(`ALTER TABLE "documents" ADD CONSTRAINT "FK_e300b5c2e3fefa9d6f8a3f25975" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entry_change_logs" ADD CONSTRAINT "FK_d5c8540c38a1182ec3878ddc470" FOREIGN KEY ("changedBy") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entries" ADD CONSTRAINT "FK_d1b452d7f0d45863303b7d30000" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fichas" ADD CONSTRAINT "FK_7f365157e3f4670ee17feade3a7" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "absences" ADD CONSTRAINT "FK_51dd37b347f1eb519b1e9a50202" FOREIGN KEY ("userId") REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
