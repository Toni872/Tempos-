import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TimeEntryService } from '../services/TimeEntryService.js';
import { ChangeAction } from '../entities/TimeEntryChangeLog.js';

/**
 * Manual Mock for TypeORM Repository
 */
class MockRepository {
  public data: any[] = [];
  
  create(item: any) { return item; }
  
  async save(item: any) {
    if (!item.id) item.id = randomUUID();
    if (!item.createdAt) item.createdAt = new Date();
    this.data.push(item);
    return item;
  }
  
  async findOne(options: any) {
    if (options?.where?.id) {
      return this.data.find((item) => item.id === options.where.id);
    }
    return this.data[this.data.length - 1];
  }
  
  async find(options: any) {
    return this.data.filter(i => i.timeEntryId === options.where.timeEntryId);
  }
}

test('TimeEntry Service: requestCorrections creates pending logs', async () => {
  const mockTimeEntryRepo = new MockRepository() as any;
  const mockChangeLogRepo = new MockRepository() as any;
  
  const service = new TimeEntryService(mockTimeEntryRepo, mockChangeLogRepo);
  
  // Mock dependencies (private methods)
  (service as any).getsFichaEvents = async () => [{ id: randomUUID() }];
  
  await service.requestCorrections({
    fichaId: randomUUID(),
    requestedBy: randomUUID(),
    reason: 'Forgot to clock in',
    beforeState: { startTime: '09:00' },
    afterState: { startTime: '08:00' },
  });
  
  const logs = mockChangeLogRepo.data;
  assert.equal(logs.length, 1);
  assert.equal(logs[0].action, ChangeAction.CORRECTED);
  assert.equal(logs[0].metadata.approvalStatus, 'pending');
});

test('TimeEntry Service: reviewCorrections updates pending logs to approved', async () => {
  const mockTimeEntryRepo = new MockRepository() as any;
  const mockChangeLogRepo = new MockRepository() as any;
  
  const service = new TimeEntryService(mockTimeEntryRepo, mockChangeLogRepo);
  const entryId = randomUUID();
  
  // 1. Arrange: Have a pending log
  mockChangeLogRepo.data.push({
    id: 'log-1',
    timeEntryId: entryId,
    metadata: { approvalStatus: 'pending' },
    createdAt: new Date()
  });
  
  // Setup mocks
  (service as any).getsFichaEvents = async () => [{ id: entryId }];
  (service as any).getChangeHistory = async () => mockChangeLogRepo.data;

  // 2. Act: Approve
  await service.reviewCorrections({
    fichaId: randomUUID(),
    reviewedBy: randomUUID(),
    decision: 'approved',
    comment: 'All good'
  });
  
  // 3. Assert
  const updatedLog = mockChangeLogRepo.data.find((l: any) => l.id === 'log-1');
  assert.equal(updatedLog.metadata.approvalStatus, 'approved');
});

// --- Integración Real (Requiere Docker PostgreSQL activo en :5433) ---
import { AppDataSource } from '../database.js';
import { User } from '../entities/User.js';
import { Ficha } from '../entities/Ficha.js';
import { TimeEntry, TimeEntryType, TimeEntrySource } from '../entities/TimeEntry.js';
import { getTimeEntryService } from '../services/TimeEntryService.js';

test('Real DB Integration: End-to-end Audit Lifecycle', async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('dummy')) {
    console.log('Skipping real DB integration test (no real DATABASE_URL provided)');
    return;
  }

  if (!AppDataSource.isInitialized) {
    (AppDataSource.options as any).synchronize = true;
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);
  const entryRepo = AppDataSource.getRepository(TimeEntry);

  // 1. Limpieza total de la base de datos antes de la integración.
  await AppDataSource.dropDatabase();
  await AppDataSource.synchronize();

  // 2. Setup: Usuario y Ficha con UUIDs válidos
  const user = new User();
  user.uid = randomUUID(); // Firebase UID simulado como UUID válido
  user.email = 'tester@tempos.com';
  user.companyId = 'tempos-demo';
  user.role = 'employee';
  user.status = 'active';
  await userRepo.save(user);

  const ficha = new Ficha();
  ficha.user = user;
  ficha.userId = user.uid;
  ficha.date = new Date();
  ficha.startTime = '09:00';
  ficha.status = 'confirmed';
  await fichaRepo.save(ficha);

  const entry = new TimeEntry();
  entry.ficha = ficha;
  entry.fichaId = ficha.id;
  entry.user = user;
  entry.userId = user.uid;
  entry.type = TimeEntryType.CLOCK_IN;
  entry.source = TimeEntrySource.WEB;
  entry.timestampUtc = new Date();
  await entryRepo.save(entry);

  const service = getTimeEntryService();

  // 3. Act: Solicitar corrección
  await service.requestCorrections({
    fichaId: ficha.id,
    requestedBy: user.uid,
    reason: 'Corrección de prueba real',
    beforeState: { time: '10:00' },
    afterState: { time: '09:00' }
  });

  // 4. Assert: Verificar traza pendiente
  let history = await service.getChangeHistory(entry.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].metadata?.approvalStatus, 'pending');

  // 5. Act: Aprobar
  await service.reviewCorrections({
    fichaId: ficha.id,
    reviewedBy: randomUUID(),
    decision: 'approved',
    comment: 'Validado satisfactoriamente en BD Real'
  });

  // 6. Assert: Verificar estado final
  history = await service.getChangeHistory(entry.id);
  assert.equal(history[0].metadata?.approvalStatus, 'approved');
  assert.equal(history[0].metadata?.reviewComment, 'Validado satisfactoriamente en BD Real');

  await AppDataSource.destroy();
});
