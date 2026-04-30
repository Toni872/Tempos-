import { AppDataSource } from "../database.js";
import { RetentionService } from "../services/RetentionService.js";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Base de datos conectada para purga GDPR");

    const result = await RetentionService.purgeOldRecords(4); // 4 años según ET
    console.log("📊 Resultado de la purga:", result);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso de purga GDPR:", error);
    process.exit(1);
  }
}

main();
