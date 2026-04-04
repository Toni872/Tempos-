/**
 * Cross-tenant integration tests for fichas, absences, documents and reports.
 *
 * These tests verify the security invariants at the authorization layer.
 * DB-level query scoping (JOIN a users.companyId) is tested via the controller
 * helpers; the authorization module tests verify that permission checks
 * correctly enforce tenant isolation and role constraints.
 *
 * NOTE: Tests that require an active AppDataSource (PostgreSQL) are marked
 * with the comment "// requires-db" and need DATABASE_URL set.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessCompanyResource,
  canAccessOwnResource,
  hasPermission,
  isSameCompany,
} from '../security/authorization.js';
import type { AuthContext } from '../middleware/auth.middleware.js';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function ctx(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    uid: 'user-1',
    email: 'user@example.com',
    displayName: 'Test User',
    emailVerified: true,
    role: 'employee',
    companyId: 'tenant-a',
    status: 'active',
    isPrivileged: false,
    ...overrides,
  };
}

// ─── isSameCompany ───────────────────────────────────────────────────────────

test('isSameCompany returns false for different companies', () => {
  assert.equal(isSameCompany(ctx({ companyId: 'tenant-a' }), 'tenant-b'), false);
});

test('isSameCompany returns true for same company', () => {
  assert.equal(isSameCompany(ctx({ companyId: 'tenant-a' }), 'tenant-a'), true);
});

test('isSameCompany returns false for suspended user even if company matches', () => {
  assert.equal(isSameCompany(ctx({ companyId: 'tenant-a', status: 'suspended' }), 'tenant-a'), false);
});

// ─── Fichas — own resource cross-tenant ─────────────────────────────────────

test('employee can access own ficha in same company', () => {
  const auth = ctx({ uid: 'user-42', companyId: 'tenant-a' });
  // Simulates: findScopedFicha found a row → uid matches, companyId matches
  assert.equal(canAccessOwnResource(auth, 'user-42'), true);
  assert.equal(isSameCompany(auth, 'tenant-a'), true);
});

test('employee cannot fabricate access to ficha owned by another user in same company', () => {
  const auth = ctx({ uid: 'user-42', companyId: 'tenant-a' });
  // The ficha belongs to 'user-99' in the same company
  assert.equal(canAccessOwnResource(auth, 'user-99'), false);
});

test('employee from tenant-b cannot access ficha from tenant-a even with valid uid match', () => {
  const auth = ctx({ uid: 'user-1', companyId: 'tenant-b' });
  // The DB query (JOIN users) would return null because companyId differs.
  // We verify this at the guard level: isSameCompany → false
  const fichaCompanyId = 'tenant-a';
  assert.equal(isSameCompany(auth, fichaCompanyId), false);
});

// ─── Absences — list cross-tenant ────────────────────────────────────────────

test('employee cannot list other company absences (no view_company_absences)', () => {
  const auth = ctx({ role: 'employee', companyId: 'tenant-a' });
  assert.equal(hasPermission(auth, 'view_company_absences'), false);
});

test('admin from tenant-a cannot approve absence from tenant-b', () => {
  const auth = ctx({ role: 'admin', isPrivileged: true, companyId: 'tenant-a' });
  const absenceFromTenantB = { companyId: 'tenant-b', ownerUserId: 'user-99' };
  assert.equal(canAccessCompanyResource(auth, absenceFromTenantB, 'approve_absence'), false);
});

test('admin from same tenant can approve absence', () => {
  const auth = ctx({ role: 'admin', isPrivileged: true, companyId: 'tenant-a' });
  const absence = { companyId: 'tenant-a', ownerUserId: 'user-55' };
  assert.equal(canAccessCompanyResource(auth, absence, 'approve_absence'), true);
});

// ─── Documents — scoped access ───────────────────────────────────────────────

test('employee cannot access document belonging to different company', () => {
  const auth = ctx({ uid: 'user-1', companyId: 'tenant-a' });
  // findScopedDocument JOINs users.companyId; simulated here as guard check
  const docCompanyId = 'tenant-b';
  assert.equal(isSameCompany(auth, docCompanyId), false);
});

test('employee can access own document in same company', () => {
  const auth = ctx({ uid: 'user-1', companyId: 'tenant-a' });
  assert.equal(canAccessOwnResource(auth, 'user-1'), true);
  assert.equal(isSameCompany(auth, 'tenant-a'), true);
});

test('suspended employee cannot access documents even in same company', () => {
  const auth = ctx({ uid: 'user-1', companyId: 'tenant-a', status: 'suspended' });
  assert.equal(canAccessOwnResource(auth, 'user-1'), false);
  assert.equal(isSameCompany(auth, 'tenant-a'), false);
});

// ─── Reports — scoped to own company ─────────────────────────────────────────

test('employee reports are scoped: cannot access reports of different company', () => {
  const auth = ctx({ uid: 'user-1', companyId: 'tenant-a' });
  // Reports QueryBuilder enforces: ficha.userId = auth.uid AND user.companyId = auth.companyId
  // If tenant-b user somehow passes auth.uid check, companyId gate blocks it
  const reportOwnerCompany = 'tenant-b';
  assert.equal(isSameCompany(auth, reportOwnerCompany), false);
});

test('auditor from tenant-a cannot read audit logs from tenant-b', () => {
  const auth = ctx({ role: 'auditor', isPrivileged: true, companyId: 'tenant-a' });
  const auditLogFromTenantB = { companyId: 'tenant-b' };
  assert.equal(canAccessCompanyResource(auth, auditLogFromTenantB, 'view_company_audit_logs'), false);
});

test('manager from tenant-a cannot view employees from tenant-b', () => {
  const auth = ctx({ role: 'manager', isPrivileged: true, companyId: 'tenant-a' });
  const employeeFromTenantB = { companyId: 'tenant-b' };
  assert.equal(canAccessCompanyResource(auth, employeeFromTenantB, 'view_employees'), false);
});

test('manager from same tenant can view employees', () => {
  const auth = ctx({ role: 'manager', isPrivileged: true, companyId: 'tenant-a' });
  const employee = { companyId: 'tenant-a' };
  assert.equal(canAccessCompanyResource(auth, employee, 'view_employees'), true);
});

test('manager from tenant-a cannot review ficha correction from tenant-b', () => {
  const auth = ctx({ role: 'manager', isPrivileged: true, companyId: 'tenant-a' });
  const fichaFromTenantB = { companyId: 'tenant-b', ownerUserId: 'user-22' };
  assert.equal(canAccessCompanyResource(auth, fichaFromTenantB, 'review_ficha_correction'), false);
});

test('manager from tenant-a cannot close period for tenant-b resources', () => {
  const auth = ctx({ role: 'manager', isPrivileged: true, companyId: 'tenant-a' });
  const fichaFromTenantB = { companyId: 'tenant-b', ownerUserId: 'user-22' };
  assert.equal(canAccessCompanyResource(auth, fichaFromTenantB, 'close_ficha_period'), false);
});

// ─── Role boundary: auditor ───────────────────────────────────────────────────

test('auditor from same company can view absences but not approve', () => {
  const auth = ctx({ role: 'auditor', isPrivileged: true, companyId: 'tenant-a' });
  assert.equal(hasPermission(auth, 'view_company_absences'), true);
  assert.equal(hasPermission(auth, 'approve_absence'), false);
  assert.equal(hasPermission(auth, 'delete_employee'), false);
});

test('auditor from different company is blocked by isSameCompany guard', () => {
  const auth = ctx({ role: 'auditor', isPrivileged: true, companyId: 'tenant-b' });
  const resource = { companyId: 'tenant-a' };
  assert.equal(canAccessCompanyResource(auth, resource, 'view_employees'), false);
});

// ─── Deleted user ─────────────────────────────────────────────────────────────

test('deleted user loses all access to resources', () => {
  const auth = ctx({ role: 'admin', isPrivileged: true, companyId: 'tenant-a', status: 'deleted' });
  assert.equal(hasPermission(auth, 'view_employees'), false);
  assert.equal(canAccessCompanyResource(auth, { companyId: 'tenant-a' }), false);
  assert.equal(canAccessOwnResource(auth, 'user-1'), false);
});

// ─── Integración DB real (scoping QueryBuilder) ─────────────────────────────

const testWithDb = hasDatabaseUrl ? test : test.skip;

testWithDb('integration: fichas query scoping excludes rows from other tenants', async () => {
  const { AppDataSource } = await import('../database.js');
  const { User } = await import('../entities/User.js');
  const { Ficha } = await import('../entities/Ficha.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);

  const seedId = Date.now().toString();
  const userA = `tenant-a-user-${seedId}`;
  const userB = `tenant-b-user-${seedId}`;

  await userRepo.save(
    userRepo.create({
      uid: userA,
      email: `${userA}@tempos.test`,
      displayName: 'Tenant A User',
      role: 'employee',
      companyId: 'tenant-a',
      status: 'active',
    })
  );

  await userRepo.save(
    userRepo.create({
      uid: userB,
      email: `${userB}@tempos.test`,
      displayName: 'Tenant B User',
      role: 'employee',
      companyId: 'tenant-b',
      status: 'active',
    })
  );

  const [fichaA, fichaB] = await fichaRepo.save([
    fichaRepo.create({
      userId: userA,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '16:00',
      hoursWorked: 8,
      status: 'confirmed',
    }),
    fichaRepo.create({
      userId: userB,
      date: '2026-04-01',
      startTime: '09:00',
      endTime: '17:00',
      hoursWorked: 8,
      status: 'confirmed',
    }),
  ]);

  try {
    const scoped = await fichaRepo
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: userA })
      .andWhere('user.companyId = :companyId', { companyId: 'tenant-a' })
      .getMany();

    assert.equal(scoped.length, 1);
    assert.equal(scoped[0]?.id, fichaA.id);
    assert.notEqual(scoped[0]?.id, fichaB.id);
  } finally {
    await fichaRepo.delete({ id: fichaA.id });
    await fichaRepo.delete({ id: fichaB.id });
    await userRepo.delete({ uid: userA });
    await userRepo.delete({ uid: userB });
  }
});

testWithDb('integration: reports summary query includes only confirmed rows in same tenant', async () => {
  const { AppDataSource } = await import('../database.js');
  const { User } = await import('../entities/User.js');
  const { Ficha } = await import('../entities/Ficha.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const fichaRepo = AppDataSource.getRepository(Ficha);

  const seedId = `${Date.now()}-reports`;
  const userA = `tenant-a-reports-${seedId}`;
  const userB = `tenant-b-reports-${seedId}`;

  await userRepo.save([
    userRepo.create({
      uid: userA,
      email: `${userA}@tempos.test`,
      displayName: 'Tenant A Reports User',
      role: 'employee',
      companyId: 'tenant-a',
      status: 'active',
    }),
    userRepo.create({
      uid: userB,
      email: `${userB}@tempos.test`,
      displayName: 'Tenant B Reports User',
      role: 'employee',
      companyId: 'tenant-b',
      status: 'active',
    }),
  ]);

  const inserted = await fichaRepo.save([
    fichaRepo.create({
      userId: userA,
      date: '2026-04-02',
      startTime: '08:00',
      endTime: '12:00',
      hoursWorked: 4,
      status: 'confirmed',
    }),
    fichaRepo.create({
      userId: userA,
      date: '2026-04-02',
      startTime: '13:00',
      endTime: '17:00',
      hoursWorked: 4,
      status: 'confirmed',
    }),
    fichaRepo.create({
      userId: userA,
      date: '2026-04-03',
      startTime: '09:00',
      endTime: '09:30',
      hoursWorked: 0.5,
      status: 'draft',
    }),
    fichaRepo.create({
      userId: userB,
      date: '2026-04-02',
      startTime: '08:00',
      endTime: '16:00',
      hoursWorked: 8,
      status: 'confirmed',
    }),
  ]);

  try {
    const confirmedRows = await fichaRepo
      .createQueryBuilder('ficha')
      .innerJoin(User, 'user', 'user.uid = ficha.userId')
      .where('ficha.userId = :uid', { uid: userA })
      .andWhere('ficha.status = :status', { status: 'confirmed' })
      .andWhere('user.companyId = :companyId', { companyId: 'tenant-a' })
      .getMany();

    const totalHours = confirmedRows.reduce((acc, row) => acc + (Number(row.hoursWorked) || 0), 0);
    assert.equal(confirmedRows.length, 2);
    assert.equal(totalHours, 8);
  } finally {
    await fichaRepo.delete(inserted.map((row) => row.id));
    await userRepo.delete({ uid: userA });
    await userRepo.delete({ uid: userB });
  }
});

testWithDb('integration: absences query scoping excludes rows from other tenants', async () => {
  const { AppDataSource } = await import('../database.js');
  const { User } = await import('../entities/User.js');
  const { Absence } = await import('../entities/Absence.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const absenceRepo = AppDataSource.getRepository(Absence);
  const seedId = `${Date.now()}-absence-scope`;

  const userA = `tenant-a-absence-${seedId}`;
  const userB = `tenant-b-absence-${seedId}`;

  await userRepo.save([
    userRepo.create({
      uid: userA,
      email: `${userA}@tempos.test`,
      displayName: 'Tenant A Absence User',
      role: 'employee',
      companyId: 'tenant-a',
      status: 'active',
    }),
    userRepo.create({
      uid: userB,
      email: `${userB}@tempos.test`,
      displayName: 'Tenant B Absence User',
      role: 'employee',
      companyId: 'tenant-b',
      status: 'active',
    }),
  ]);

  const inserted = await absenceRepo.save([
    absenceRepo.create({
      userId: userA,
      type: 'vacation',
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-08'),
      status: 'approved',
    }),
    absenceRepo.create({
      userId: userB,
      type: 'vacation',
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-08'),
      status: 'approved',
    }),
  ]);

  try {
    const scopedRows = await absenceRepo
      .createQueryBuilder('absence')
      .innerJoin(User, 'user', 'user.uid = absence.userId')
      .where('user.companyId = :companyId', { companyId: 'tenant-a' })
      .orderBy('absence.createdAt', 'DESC')
      .getMany();

    assert.ok(scopedRows.every((row) => row.userId === userA));
    assert.ok(scopedRows.some((row) => row.id === inserted[0]?.id));
    assert.ok(!scopedRows.some((row) => row.id === inserted[1]?.id));
  } finally {
    await absenceRepo.delete(inserted.map((row) => row.id));
    await userRepo.delete({ uid: userA });
    await userRepo.delete({ uid: userB });
  }
});

testWithDb('integration: documents query scoping excludes rows from other tenants', async () => {
  const { AppDataSource } = await import('../database.js');
  const { User } = await import('../entities/User.js');
  const { Document } = await import('../entities/Document.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);
  const documentRepo = AppDataSource.getRepository(Document);
  const seedId = `${Date.now()}-document-scope`;

  const userA = `tenant-a-document-${seedId}`;
  const userB = `tenant-b-document-${seedId}`;

  await userRepo.save([
    userRepo.create({
      uid: userA,
      email: `${userA}@tempos.test`,
      displayName: 'Tenant A Document User',
      role: 'employee',
      companyId: 'tenant-a',
      status: 'active',
    }),
    userRepo.create({
      uid: userB,
      email: `${userB}@tempos.test`,
      displayName: 'Tenant B Document User',
      role: 'employee',
      companyId: 'tenant-b',
      status: 'active',
    }),
  ]);

  const inserted = await documentRepo.save([
    documentRepo.create({
      userId: userA,
      title: 'Nomina Abril A',
      type: 'nomina',
      status: 'delivered',
      filename: 'nomina-a.pdf',
    }),
    documentRepo.create({
      userId: userB,
      title: 'Nomina Abril B',
      type: 'nomina',
      status: 'delivered',
      filename: 'nomina-b.pdf',
    }),
  ]);

  try {
    const scopedRows = await documentRepo
      .createQueryBuilder('document')
      .innerJoin(User, 'user', 'user.uid = document.userId')
      .where('user.companyId = :companyId', { companyId: 'tenant-a' })
      .orderBy('document.createdAt', 'DESC')
      .getMany();

    assert.ok(scopedRows.every((row) => row.userId === userA));
    assert.ok(scopedRows.some((row) => row.id === inserted[0]?.id));
    assert.ok(!scopedRows.some((row) => row.id === inserted[1]?.id));
  } finally {
    await documentRepo.delete(inserted.map((row) => row.id));
    await userRepo.delete({ uid: userA });
    await userRepo.delete({ uid: userB });
  }
});

testWithDb('integration: audit-log query scoping keeps events inside tenant', async () => {
  const { AppDataSource } = await import('../database.js');
  const { AuditLog } = await import('../entities/AuditLog.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const auditRepo = AppDataSource.getRepository(AuditLog);
  const seedId = `${Date.now()}-audit-scope`;

  const tenantAUser = `tenant-a-user-${seedId}`;
  const tenantBUser = `tenant-b-user-${seedId}`;

  const created = await auditRepo.save([
    auditRepo.create({
      userId: tenantAUser,
      companyId: 'tenant-a',
      action: 'clock_in',
      metadata: { source: 'test' },
    }),
    auditRepo.create({
      userId: tenantBUser,
      companyId: 'tenant-b',
      action: 'clock_in',
      metadata: { source: 'test' },
    }),
  ]);

  try {
    const scopedRows = await auditRepo
      .createQueryBuilder('audit')
      .where('audit.companyId = :companyId', { companyId: 'tenant-a' })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    assert.ok(scopedRows.every((row) => row.companyId === 'tenant-a'));
    assert.ok(scopedRows.some((row) => row.userId === tenantAUser));
    assert.ok(!scopedRows.some((row) => row.userId === tenantBUser));
  } finally {
    await auditRepo.delete(created.map((row) => row.id));
  }
});

testWithDb('integration: audit-log filters by action and user inside tenant', async () => {
  const { AppDataSource } = await import('../database.js');
  const { AuditLog } = await import('../entities/AuditLog.js');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const auditRepo = AppDataSource.getRepository(AuditLog);
  const seedId = `${Date.now()}-audit-filter`;

  const targetUser = `tenant-a-target-${seedId}`;
  const otherUser = `tenant-a-other-${seedId}`;

  const created = await auditRepo.save([
    auditRepo.create({
      userId: targetUser,
      companyId: 'tenant-a',
      action: 'report_export',
      metadata: { source: 'test' },
    }),
    auditRepo.create({
      userId: targetUser,
      companyId: 'tenant-a',
      action: 'clock_in',
      metadata: { source: 'test' },
    }),
    auditRepo.create({
      userId: otherUser,
      companyId: 'tenant-a',
      action: 'report_export',
      metadata: { source: 'test' },
    }),
  ]);

  try {
    const filteredRows = await auditRepo
      .createQueryBuilder('audit')
      .where('audit.companyId = :companyId', { companyId: 'tenant-a' })
      .andWhere('audit.userId = :userId', { userId: targetUser })
      .andWhere('audit.action = :action', { action: 'report_export' })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();

    assert.equal(filteredRows.length, 1);
    assert.equal(filteredRows[0]?.userId, targetUser);
    assert.equal(filteredRows[0]?.action, 'report_export');
  } finally {
    await auditRepo.delete(created.map((row) => row.id));
  }
});
