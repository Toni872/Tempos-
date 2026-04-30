import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Ficha } from "../entities/Ficha.js";
import { TimeEntryType, TimeEntrySource } from "../entities/TimeEntry.js";
import { getTimeEntryService } from "../services/TimeEntryService.js";

test("E2E Audit Simulation: Inspección de Trabajo LifeCycle", async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("dummy")) {
    console.log(
      "Skipping E2E audit integration test (require real DB). Set DATABASE_URL to PostgreSQL.",
    );
    return;
  }

  if (!AppDataSource.isInitialized) {
    (AppDataSource.options as any).synchronize = true;
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);
  const service = getTimeEntryService();

  // 1. Damos de alta a un usuario corporativo (Emulando una Empresa)
  const employeeId = randomUUID();
  const user = new User();
  user.uid = employeeId;
  user.email = `audite2e_${Date.now()}@temposlab.com`;
  user.companyId = "tempos-inspection";
  user.role = "employee";
  user.status = "active";
  await userRepo.save(user);

  // 2. Fichaje Normal Web: Clock In y Clock Out en un solo día
  const testDate = new Date("2026-06-15T09:00:00Z");

  const ficha = new Ficha();
  ficha.user = user;
  ficha.userId = user.uid;
  ficha.date = testDate;
  ficha.startTime = "09:00";
  ficha.status = "draft";
  ficha.metadata = { location: "40.4168,-3.7038" }; // Ejemplo Plaza Sol - Madrid
  await fichaRepo.save(ficha);

  // CLOCK IN Atomic Event
  const clockInEntry = await service.recordClockEvent({
    userId: user.uid,
    fichaId: ficha.id,
    type: TimeEntryType.CLOCK_IN,
    source: TimeEntrySource.WEB,
    timestampUtc: new Date("2026-06-15T09:00:10Z"),
    ip: "192.168.1.5",
    latitude: 40.4168,
    longitude: -3.7038,
  });

  assert.ok(
    clockInEntry.id,
    "Debería haber un ID de evento CLOCK_IN inviolable",
  );

  // Cierre jornada
  ficha.endTime = "17:00";
  ficha.hoursWorked = 8.0;
  ficha.status = "confirmed";
  await fichaRepo.save(ficha);

  const clockOutEntry = await service.recordClockEvent({
    userId: user.uid,
    fichaId: ficha.id,
    type: TimeEntryType.CLOCK_OUT,
    source: TimeEntrySource.WEB,
    timestampUtc: new Date("2026-06-15T17:00:20Z"),
    ip: "192.168.1.5",
  });

  assert.ok(
    clockOutEntry.id,
    "Debería haber un ID de evento CLOCK_OUT inviolable",
  );

  // 3. Inspección exige el trazo atómico de esta Ficha:
  const inspectionEvents = await service.getsFichaEvents(ficha.id);
  assert.equal(
    inspectionEvents.length,
    2,
    "Inspección demanda 2 eventos atómicos para una jornada regular Web.",
  );
  assert.equal(inspectionEvents[0].type, TimeEntryType.CLOCK_IN);
  assert.equal(inspectionEvents[1].type, TimeEntryType.CLOCK_OUT);
  assert.ok(
    inspectionEvents[0].latitude,
    "La trazabilidad geolocalizada está presente e inyectada por el API del frontend.",
  );

  await AppDataSource.destroy();
});
