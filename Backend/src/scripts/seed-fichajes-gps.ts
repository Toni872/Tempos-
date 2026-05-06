import "dotenv/config";
import { AppDataSource } from "../database.js";
import { Ficha } from "../entities/Ficha.js";
import { User } from "../entities/User.js";

async function seedFichajesGPS() {
  await AppDataSource.initialize();
  const fichaRepo = AppDataSource.getRepository(Ficha);
  const userRepo = AppDataSource.getRepository(User);

  // Obtener o crear un usuario de prueba
  let user = await userRepo.findOneBy({ email: "antonio@tempos.es" });
  if (!user) {
    user = userRepo.create({
      uid: "test-user-gps-1",
      email: "antonio@tempos.es",
      displayName: "Antonio (Prueba GPS)",
      companyId: "tempos-demo",
      role: "admin",
      status: "active"
    });
    await userRepo.save(user);
  }

  const today = new Date().toISOString().split('T')[0];

  const testFichas: Partial<Ficha>[] = [
    {
      userId: user.uid,
      date: new Date(today),
      startTime: "08:30",
      description: "Entrada Sede Central",
      status: "draft",
      metadata: { location: "40.4168,-3.7038", deviceId: "iPhone 15 Pro" }
    },
    {
      userId: user.uid,
      date: new Date(today),
      startTime: "10:15",
      description: "Visita Cliente Calle Mayor",
      status: "draft",
      metadata: { location: "40.4175,-3.7055", deviceId: "iPhone 15 Pro" }
    },
    {
      userId: user.uid,
      date: new Date(today),
      startTime: "12:00",
      description: "Reunión Palacio Real",
      status: "draft",
      metadata: { location: "40.4182,-3.7100", deviceId: "iPhone 15 Pro" }
    }
  ];

  for (const data of testFichas) {
    const f = fichaRepo.create(data);
    await fichaRepo.save(f);
  }

  console.log("✅ 3 Fichajes con GPS insertados con éxito para hoy.");
  process.exit(0);
}

seedFichajesGPS().catch(err => {
  console.error("❌ Error seeding GPS data:", err);
  process.exit(1);
});
