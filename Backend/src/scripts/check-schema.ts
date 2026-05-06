import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";

async function check() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Connected to DB");

    const queryRunner = AppDataSource.createQueryRunner();

    // Check tables
    const tables = await queryRunner.getTables([
      "users",
      "fichas",
      "time_entries",
      "migrations",
    ]);
    console.log("\n--- EXISTING TABLES ---");
    tables.forEach((t) => {
      console.log(`Table: ${t.name}`);
      console.log(`Columns: ${t.columns.map((c) => c.name).join(", ")}`);
    });

    await AppDataSource.destroy();
  } catch (err) {
    console.error("❌ Error checking schema:", err);
  }
}

check();
