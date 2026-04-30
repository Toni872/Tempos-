import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";

async function fix() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to DB");

    const queryRunner = AppDataSource.createQueryRunner();

    // Lista de migraciones previas que ya existen en el esquema pero no en la tabla metadata
    const history = [
      { timestamp: 1679040000000, name: "CreateUsersTable1679040000000" },
      { timestamp: 1681200000000, name: "CreateCoreDomainTables1681200000000" },
      { timestamp: 1712500000000, name: "CreateTimeEntryTables1712500000000" },
      {
        timestamp: 1712600000000,
        name: "AddUserCompanyIdAndRole1712600000000",
      },
      { timestamp: 1775756365116, name: "SyncVarcharUids1775756365116" },
    ];

    for (const m of history) {
      const exists = await queryRunner.query(
        "SELECT * FROM migrations WHERE name = $1",
        [m.name],
      );
      if (exists.length === 0) {
        await queryRunner.query(
          "INSERT INTO migrations(timestamp, name) VALUES ($1, $2)",
          [m.timestamp, m.name],
        );
        console.log(`✅ Registered: ${m.name}`);
      } else {
        console.log(`ℹ️ Already exists: ${m.name}`);
      }
    }

    await AppDataSource.destroy();
    console.log(
      "\n🚀 DB Migration history synchronized. Now run migration:run.",
    );
  } catch (err) {
    console.error("❌ Error fixing migrations:", err);
  }
}

fix();
