import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";
import { Ficha } from "../entities/Ficha.js";
import { TimeEntryType } from "../entities/TimeEntry.js";
import { getTimeEntryService } from "../services/TimeEntryService.js";
import { v4 as uuidv4 } from "uuid";

async function validateTraceability() {
  try {
    await AppDataSource.initialize();
    console.log("🧪 Iniciando Validación de Trazabilidad E2E...");

    const userRepo = AppDataSource.getRepository(User);
    const fichaRepo = AppDataSource.getRepository(Ficha);
    const teService = getTimeEntryService();

    // 1. Crear usuario de prueba
    const testUid = `test-${uuidv4().slice(0, 8)}`;
    const user = userRepo.create({
      uid: testUid,
      email: `${testUid}@tempos.es`,
      displayName: "QA Tester",
      companyId: "tempos-demo",
      role: "employee",
      status: "active",
    });
    await userRepo.save(user);
    console.log("✅ Usuario de prueba creado:", testUid);

    // 2. Simular CLOCK_IN (09:00)
    console.log("🕒 Simulando Entrada (09:00)...");
    const startTime = new Date();
    startTime.setHours(9, 0, 0, 0);

    const ficha = fichaRepo.create({
      userId: testUid,
      date: new Date(),
      startTime: "09:00",
      status: "draft",
    });
    await fichaRepo.save(ficha);

    await teService.recordClockEvent({
      fichaId: ficha.id,
      userId: testUid,
      type: TimeEntryType.CLOCK_IN,
      source: "WEB" as any,
      ip: "127.0.0.1",
      userAgent: "QA-Validator",
      timestampUtc: startTime,
    });

    // 3. Simular Pausa (11:00 - 11:30)
    console.log("☕ Simulando Pausa (11:00 - 11:30)...");
    const breakStart = new Date(startTime);
    breakStart.setHours(11, 0);
    const breakEnd = new Date(startTime);
    breakEnd.setHours(11, 30);

    await teService.recordClockEvent({
      fichaId: ficha.id,
      userId: testUid,
      type: TimeEntryType.BREAK_START,
      source: "WEB" as any,
      ip: "127.0.0.1",
      userAgent: "QA-Validator",
      timestampUtc: breakStart,
    });

    await teService.recordClockEvent({
      fichaId: ficha.id,
      userId: testUid,
      type: TimeEntryType.BREAK_END,
      source: "WEB" as any,
      ip: "127.0.0.1",
      userAgent: "QA-Validator",
      timestampUtc: breakEnd,
    });

    // 4. Simular Salida (18:00)
    console.log("🕒 Simulando Salida (18:00)...");
    const endTime = new Date(startTime);
    endTime.setHours(18, 0);

    await teService.recordClockEvent({
      fichaId: ficha.id,
      userId: testUid,
      type: TimeEntryType.CLOCK_OUT,
      source: "WEB" as any,
      ip: "127.0.0.1",
      userAgent: "QA-Validator",
      timestampUtc: endTime,
    });

    // Actualizar ficha con el cálculo final
    const workedHours = await teService.calculateWorkingHours(ficha.id);
    ficha.endTime = "18:00";
    ficha.hoursWorked = workedHours;
    ficha.status = "confirmed";
    await fichaRepo.save(ficha);

    console.log(`📊 Horas calculadas (esperado 8.5h): ${workedHours}h`);
    if (Math.abs(workedHours - 8.5) < 0.01) {
      console.log("✅ Cálculo de horas con pausas: OK");
    } else {
      console.error("❌ Error en el cálculo de horas.");
    }

    // 5. Simular Solicitud de Corrección
    console.log("📝 Simulando Solicitud de Corrección...");
    await teService.requestCorrections({
      fichaId: ficha.id,
      requestedBy: testUid,
      reason: "Olvidé registrar una tarea extra",
      beforeState: { startTime: "09:00", endTime: "18:00" },
      afterState: { startTime: "09:00", endTime: "19:00" },
      ip: "127.0.0.1",
    });

    // 6. Verificar Audit Trail
    console.log("🔍 Verificando Audit Trail...");
    const events = await teService.getsFichaEvents(ficha.id);
    console.log(`Total eventos registrados: ${events.length} (esperado 4)`);

    if (events.length === 4) {
      console.log("✅ Trazabilidad atómica íntegra.");
    } else {
      console.error("❌ Error en el número de eventos.");
    }

    await AppDataSource.destroy();
    console.log("🏁 Validación finalizada con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la validación:", error);
    process.exit(1);
  }
}

validateTraceability();
