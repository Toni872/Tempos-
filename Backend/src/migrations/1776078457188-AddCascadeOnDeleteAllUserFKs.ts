import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeOnDeleteAllUserFKs1776078457188 implements MigrationInterface {
  name = "AddCascadeOnDeleteAllUserFKs1776078457188";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const fks = await queryRunner.query(
      `SELECT
        tc.table_name::text AS table_name,
        tc.constraint_name::text AS constraint_name,
        kcu.column_name::text AS column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_catalog = kcu.table_catalog
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_catalog = ccu.table_catalog
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'uid'`,
    );

    for (const fk of fks) {
      const { table_name, constraint_name, column_name } = fk;
      const tbl = `"${table_name.replace(/"/g, '""')}"`;
      const cstr = `"${constraint_name.replace(/"/g, '""')}"`;
      const col = `"${column_name.replace(/"/g, '""')}"`;

      await queryRunner.query(`ALTER TABLE ${tbl} DROP CONSTRAINT ${cstr}`);
      await queryRunner.query(
        `ALTER TABLE ${tbl} ADD CONSTRAINT ${cstr} FOREIGN KEY (${col}) REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const fks = await queryRunner.query(
      `SELECT
        tc.table_name::text AS table_name,
        tc.constraint_name::text AS constraint_name,
        kcu.column_name::text AS column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_catalog = kcu.table_catalog
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_catalog = ccu.table_catalog
        AND tc.table_schema = ccu.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'uid'`,
    );

    for (const fk of fks) {
      const { table_name, constraint_name, column_name } = fk;
      const tbl = `"${table_name.replace(/"/g, '""')}"`;
      const cstr = `"${constraint_name.replace(/"/g, '""')}"`;
      const col = `"${column_name.replace(/"/g, '""')}"`;

      await queryRunner.query(`ALTER TABLE ${tbl} DROP CONSTRAINT ${cstr}`);
      await queryRunner.query(
        `ALTER TABLE ${tbl} ADD CONSTRAINT ${cstr} FOREIGN KEY (${col}) REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }
}
