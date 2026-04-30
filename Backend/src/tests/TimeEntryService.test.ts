import "./setup.js";
import { test, describe } from "node:test";
import assert from "node:assert";

// 1. Mock de Repositorio (Simula el comportamiento de TypeORM sin base de datos)
const mockRepo = {
  create: (data: any) => ({ id: "mock-id", ...data }),
  save: async (data: any) => ({
    ...data,
    id: data.id || "new-id",
    createdAt: new Date(),
    metadata: data.metadata || {},
  }),
  createQueryBuilder: () => ({
    where: () => ({
      orderBy: () => ({
        getMany: async () => [],
        limit: () => ({
          getOne: async () => null,
        }),
      }),
      andWhere: () => ({
        andWhere: () => ({
          orderBy: () => ({
            getMany: async () => [],
          }),
        }),
      }),
    }),
  }),
} as any;

// 2. Importar el servicio e inyectar los mocks
import { TimeEntryService } from "../services/TimeEntryService.js";
import { TimeEntryType, TimeEntrySource } from "../entities/TimeEntry.js";
import { ChangeAction } from "../entities/TimeEntryChangeLog.js";

describe("TimeEntryService (Unit Tests)", () => {
  // Inyectamos repositorios mockeados para total aislamiento
  const service = new TimeEntryService(mockRepo, mockRepo);

  test("recordClockEvent: Debe registrar un evento de fichaje con metadatos", async () => {
    const params = {
      userId: "user-1",
      fichaId: "ficha-1",
      type: TimeEntryType.CLOCK_IN,
      source: TimeEntrySource.WEB,
      timestampUtc: new Date(),
      ip: "127.0.0.1",
    };

    const result = await service.recordClockEvent(params);
    assert.strictEqual(result.userId, "user-1");
    assert.strictEqual(result.type, TimeEntryType.CLOCK_IN);
    assert.strictEqual(result.ip, "127.0.0.1");
    assert.ok(result.id, "Debe generar un ID");
  });

  test("logChange: Debe crear un log de cambios con estado pendiente", async () => {
    const params = {
      timeEntryId: "entry-1",
      changedBy: "admin-1",
      action: ChangeAction.CORRECTED,
      changeSet: { before: { hours: 8 }, after: { hours: 9 } },
      reason: "Ajuste manual",
    };

    const result = await service.logChange(params);
    assert.strictEqual(result.timeEntryId, "entry-1");
    assert.strictEqual(result.action, ChangeAction.CORRECTED);
    assert.strictEqual(result.metadata?.approvalStatus, "pending");
  });

  test("requestCorrections: Debe procesar el flujo sin errores", async () => {
    await assert.doesNotReject(async () => {
      await service.requestCorrections({
        fichaId: "ficha-1",
        requestedBy: "user-1",
        reason: "Auditoría interna",
        beforeState: {},
        afterState: {},
      });
    });
  });
});
