import "dotenv/config";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Ficha } from "../entities/Ficha.js";
import { Absence } from "../entities/Absence.js";
import { WorkCenter } from "../entities/WorkCenter.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);
  const absenceRepo = AppDataSource.getRepository(Absence);
  const workCenterRepo = AppDataSource.getRepository(WorkCenter);

  // Usuarios de ejemplo
  const users = [
    {
      uid: uuidv4(),
      email: "alice@example.com",
      displayName: "Alice",
      emailVerified: true,
      status: "active",
      role: "admin",
    },
    {
      uid: uuidv4(),
      email: "bob@example.com",
      displayName: "Bob",
      emailVerified: true,
      status: "active",
      role: "user",
    },
    {
      uid: uuidv4(),
      email: "carol@example.com",
      displayName: "Carol",
      emailVerified: false,
      status: "active",
      role: "user",
    },
  ];

  for (const u of users) {
    const exists = await userRepo.findOneBy({ email: u.email });
    if (!exists) await userRepo.save(userRepo.create(u as any));
  }

  // Centro de trabajo de ejemplo
  const workCenterExists = await workCenterRepo.findOneBy({
    name: "Oficina Central",
  });
  if (!workCenterExists) {
    await workCenterRepo.save(
      workCenterRepo.create({
        name: "Oficina Central",
        address: "Calle Gran Vía, 1, Madrid",
        latitude: 40.4168,
        longitude: -3.7038,
        radiusMeters: 200,
        status: "active",
        companyId: "tempos-demo",
      } as any),
    );
  }

  const alice = await userRepo.findOneBy({ email: "alice@example.com" });
  if (alice) {
    const fichas = [
      {
        userId: alice.uid,
        date: new Date("2026-03-30"),
        startTime: "09:00",
        endTime: "17:00",
        hoursWorked: 8.0,
        description: "Trabajo",
        status: "confirmed",
        metadata: { location: "40.4168,-3.7038" },
      },
      {
        userId: alice.uid,
        date: new Date("2026-03-31"),
        startTime: "09:15",
        endTime: "17:05",
        hoursWorked: 7.83,
        description: "Trabajo",
        status: "confirmed",
        metadata: { location: "40.4169,-3.7039" },
      },
    ];
    for (const f of fichas) {
      await fichaRepo.save(fichaRepo.create(f as any));
    }
  }

  const bob = await userRepo.findOneBy({ email: "bob@example.com" });
  if (bob) {
    await absenceRepo.save(
      absenceRepo.create({
        userId: bob.uid,
        type: "vacation",
        startDate: new Date("2026-04-10"),
        endDate: new Date("2026-04-14"),
        status: "approved",
        reason: "Vacaciones",
      } as any),
    );
  }

  console.log("Seed completed");
  await AppDataSource.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
