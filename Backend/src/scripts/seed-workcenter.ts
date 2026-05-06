import "dotenv/config";
import { AppDataSource } from "../database.js";
import { WorkCenter } from "../entities/WorkCenter.js";

async function seedWorkCenter() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(WorkCenter);

  const existing = await repo.findOneBy({ name: "Sede Central (Madrid)" });
  if (existing) {
    console.log("✅ La sede ya existe.");
    process.exit(0);
  }

  const center = repo.create({
    name: "Sede Central (Madrid)",
    address: "Puerta del Sol, Madrid",
    latitude: 40.4168,
    longitude: -3.7038,
    radiusMeters: 500,
    companyId: "tempos-demo",
    status: "active"
  });

  await repo.save(center);
  console.log("🚀 Sede Central creada con éxito (Madrid, Puerta del Sol)");
  process.exit(0);
}

seedWorkCenter().catch(err => {
  console.error("❌ Error seeding work center:", err);
  process.exit(1);
});
