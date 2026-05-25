import "reflect-metadata";
import "dotenv/config";
import { AppDataSource } from "../database.js";

async function applyMigrations() {
  try {
    console.log("Conectando a la base de datos y ejecutando migraciones pendientes...");
    await AppDataSource.initialize();
    const applied = await AppDataSource.runMigrations();
    if (!applied || applied.length === 0) {
      console.log("No hay migraciones pendientes.");
    } else {
      console.log(`Migraciones aplicadas: ${applied.map((m) => m.name).join(", ")}`);
    }
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error("Error aplicando migraciones:", err);
    try {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
    } catch {
      // Ignorado intencionalmente
    }
    process.exit(1);
  }
}

applyMigrations();
