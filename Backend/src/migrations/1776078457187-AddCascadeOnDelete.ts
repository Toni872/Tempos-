import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Cambia todas las FK constraints que apuntan a users(uid)
 * de ON DELETE NO ACTION a ON DELETE CASCADE.
 *
 * Usa un enfoque DINÁMICO consultando information_schema para descubrir
 * los nombres reales de las constraints en la base de datos, en vez de
 * hardcodearlos. Esto garantiza que funcione en cualquier entorno
 * (local, producción, staging, etc.) aunque los nombres difieran.
 *
 * Tablas afectadas: fichas, absences, documents, time_entries, time_entry_change_logs.
 */
export class AddCascadeOnDelete1776078457187 implements MigrationInterface {
  name = "AddCascadeOnDelete1776078457187";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Descubrir dinámicamente las FK constraints → users(uid) y recrearlas con CASCADE
    //
    // NOTA: No se usa DO $$ ... $$ porque pg en Windows/ciertos entornos
    // tiene problemas con bloques anónimos. En su lugar, consultamos
    // information_schema desde JavaScript y construimos las sentencias.
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
        AND tc.table_name IN ('fichas','absences','documents','time_entries','time_entry_change_logs')
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'uid'`,
    );

    console.log(
      `🔍 [Migration] Encontradas ${fks.length} FK constraints → users(uid):`,
      fks.map((fk: any) => `${fk.table_name}.${fk.column_name} (${fk.constraint_name})`),
    );

    for (const fk of fks) {
      const { table_name, constraint_name, column_name } = fk;
      // Escapar identificadores para prevenir SQL injection
      const tbl = `"${table_name.replace(/"/g, '""')}"`;
      const col = `"${column_name.replace(/"/g, '""')}"`;
      const cstr = `"${constraint_name.replace(/"/g, '""')}"`;

      await queryRunner.query(
        `ALTER TABLE ${tbl} DROP CONSTRAINT ${cstr}`,
      );
      await queryRunner.query(
        `ALTER TABLE ${tbl} ADD CONSTRAINT ${cstr} FOREIGN KEY (${col}) REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      console.log(
        `  ✅ ${table_name}.${column_name}: ON DELETE CASCADE`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse: restaurar a ON DELETE NO ACTION
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
        AND tc.table_name IN ('fichas','absences','documents','time_entries','time_entry_change_logs')
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'uid'`,
    );

    for (const fk of fks) {
      const { table_name, constraint_name, column_name } = fk;
      const tbl = `"${table_name.replace(/"/g, '""')}"`;
      const col = `"${column_name.replace(/"/g, '""')}"`;
      const cstr = `"${constraint_name.replace(/"/g, '""')}"`;

      await queryRunner.query(
        `ALTER TABLE ${tbl} DROP CONSTRAINT ${cstr}`,
      );
      await queryRunner.query(
        `ALTER TABLE ${tbl} ADD CONSTRAINT ${cstr} FOREIGN KEY (${col}) REFERENCES "users"("uid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }
}
