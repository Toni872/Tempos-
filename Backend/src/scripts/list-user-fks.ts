import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";

async function listFKs() {
  try {
    await AppDataSource.initialize();

    const sql = `
      SELECT
        tc.table_name::text AS table_name,
        tc.constraint_name::text AS constraint_name,
        kcu.column_name::text AS column_name,
        rc.delete_rule::text AS delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_catalog = kcu.table_catalog
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_catalog = rc.constraint_catalog
        AND tc.table_schema = rc.constraint_schema
      JOIN information_schema.constraint_column_usage ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.constraint_schema = ccu.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'uid'
      ORDER BY tc.table_name;
    `;

    const fks: Array<any> = await AppDataSource.query(sql);

    if (!fks || fks.length === 0) {
      console.log("No se encontraron FKs que referencien users(uid).");
      await AppDataSource.destroy();
      return;
    }

    console.log("FKs encontradas que referencian users(uid):");
    for (const fk of fks) {
      const { table_name, constraint_name, column_name, delete_rule } = fk;
      console.log(`- ${table_name}.${column_name} (${constraint_name}) -> ON DELETE = ${delete_rule}`);
    }

    console.log("\nSugerencias SQL para cambiar a ON DELETE CASCADE (REVISAR y BACKUP previo):\n");
    for (const fk of fks) {
      const { table_name, constraint_name, column_name } = fk;
      const stmt = `ALTER TABLE "${table_name.replace(/"/g, '""')}" DROP CONSTRAINT "${constraint_name.replace(/"/g, '""')}";\nALTER TABLE "${table_name.replace(/"/g, '""')}" ADD CONSTRAINT "${constraint_name.replace(/"/g, '""')}" FOREIGN KEY ("${column_name.replace(/"/g, '""')}") REFERENCES "users"("uid") ON DELETE CASCADE ON UPDATE NO ACTION;`;
      console.log(stmt + "\n");
    }

    await AppDataSource.destroy();
  } catch (err) {
    console.error("Error listando FKs:", err);
    try {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
    } catch {
      // Ignorado intencionalmente
    }
    process.exit(1);
  }
}

listFKs();
