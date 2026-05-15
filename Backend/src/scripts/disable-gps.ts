import "dotenv/config";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

async function cleanup() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  await repo.update({ email: "user@tempos.es" }, { requiresGeolocation: false });
  console.log("✅ [CLEANUP] GPS desactivado para user@tempos.es. Ahora puedes finalizar jornada.");
  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
