import "dotenv/config";
import dotenv from "dotenv";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function prepare() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  await repo.update({ email: "user@tempos.es" }, { requiresGeolocation: true, role: "employee" });
  console.log("✅ [TEST-PREP] Usuario user@tempos.es ahora es EMPLOYEE y requiere GPS");
  process.exit(0);
}

prepare().catch(err => {
  console.error(err);
  process.exit(1);
});
