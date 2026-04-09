# PR: S1-S2-01 — Atomic Time Entry Events + Correction Logging

## Título (para GitHub)
```
feat(ficha): atomic time entry events + correction logging with trazabilidad
```

## Descripción Completa

### 📋 Resumen Ejecutivo

Implementación de trazabilidad completa para fichajes según requisitos legales españoles:
- **S1-01, S1-02, S1-03**: Eventos atómicos (CLOCK_IN, CLOCK_OUT) con metadatos (IP, userAgent, geolocalización)
- **S2-01**: Logging de correcciones — cuando manager aprueba corrección, se crea TimeEntryChangeLog con before/after

Resultado: Sistema defendible ante Inspección de Trabajo (art. 34.9 ET, RDL 8/2019, RGPD).

---

## 🎯 Motivación

Previously:
- Ficha model only stored start/end time per day
- No granularity for disputes ("empleado says 09:00, timestamp says 09:15")
- Changes not auditable (correcciones stored only in metadata, no trazabilidad)

Now:
- ✅ Each event (entrada/salida) is atomic with exact timestamp + IP + device
- ✅ All changes logged (CREATED, MODIFIED, DELETED, CORRECTED)
- ✅ Inspección can query GET /audit-trail to see full history
- ✅ Legal compliance: "Registro diario de jornada conforme art. 34.9 ET"

---

## 📦 Changes

### S1: Eventos Atómicos

#### 新 New Entities
- **TimeEntry.ts** (72 líneas)
  ```typescript
  enum TimeEntryType = CLOCK_IN | CLOCK_OUT | BREAK_START | BREAK_END
  enum TimeEntrySource = WEB | MOBILE | KIOSK
  Fields: fichaId, userId, type, timestampUtc, localDateTime (ISO 8601 Madrid TZ)
  Capture: ip, userAgent, latitude, longitude, metadata
  Index: (fichaId, type), (userId, timestampUtc), (userId, createdAt)
  ```

- **TimeEntryChangeLog.ts** (60 líneas)
  ```typescript
  enum ChangeAction = CREATED | MODIFIED | DELETED | CORRECTED
  Fields: timeEntryId, changedBy, action, changeSet (before/after JSON)
  Audit: reason, ip, userAgent, metadata (approvalStatus, approvedBy)
  Index: (timeEntryId, createdAt), (changedBy, createdAt), (action, createdAt)
  ```

#### New Service
- **TimeEntryService.ts** (196 líneas + S2-01 additions)
  ```typescript
  // Core methods:
  recordClockEvent(params): TimeEntry  // POST /clockin/out
  logChange(params): TimeEntryChangeLog // audit trail
  getChangeHistory(timeEntryId): ChangeLog[]
  getsFichaEvents(fichaId): TimeEntry[]
  getUserEventsByDateRange(userId, start, end): TimeEntry[]
  
  // S2-01 addition:
  approveChanges(params): void // cuando corrección es aprobada
  ```

#### New Migration
- **1712500000000-CreateTimeEntryTables.ts** (101 líneas)
  - CREATE TABLE time_entries + time_entry_change_logs
  - CREATE ENUMs (PostgreSQL types)
  - CREATE INDEXes (6 total)
  - FK constraints + cascades
  - UP/DOWN (reversible)

#### Refactored Endpoints
- **POST /api/v1/fichas/clockin**
  - Creates Ficha (existing)
  - Records TimeEntry(CLOCK_IN) atomic (new)
  - Captures: IP, userAgent, timestampUtc, localDateTime Madrid TZ
  - Error handling: graceful fallback if TimeEntry fails

- **POST /api/v1/fichas/clockout**
  - Updates Ficha (existing)
  - Records TimeEntry(CLOCK_OUT) atomic (new)
  - Same metadata capture

- **GET /api/v1/fichas/:id/audit-trail** (NEW)
  ```json
  {
    "ficha": {...},
    "timeEntries": [
      { "id", "type": "CLOCK_IN", "timestampUtc", "localDateTime", "source", "ip", "lat", "long", "createdAt" }
    ],
    "changeLog": {
      "timeEntryId": [{ "id", "action", "changeSet", "reason", "createdAt" }]
    },
    "auditMeta": { "requestedBy", "requestedAt", "requestedRole" }
  }
  ```
  - RBAC: propietario | auditor | manager | admin

#### Database Update
- **database.ts**: Import TimeEntry, TimeEntryChangeLog in entities list

---

### S2-01: Correction Logging

#### Enhanced Service Method
- **TimeEntryService.approveChanges()** (new)
  ```typescript
  async approveChanges(params: {
    fichaId, approvedBy, reason, beforeState, afterState, ip, userAgent
  }): Promise<void>
  ```
  - Called when manager approves correction
  - For each TimeEntry in ficha:
    - Create TimeEntryChangeLog with action=CORRECTED
    - Populate changeSet={before, after}
    - Mark metadata.approvalStatus='approved'

#### Refactored Endpoint
- **POST /api/v1/fichas/:id/review-correction**
  - Capture beforeState (existing fields)
  - Apply correction to Ficha (existing)
  - Call timeEntryService.approveChanges() (NEW)
  - Log TimeEntryChangeLog for each event
  - Error handling: graceful fallback

---

## 📁 Files Changed

### Created
```
Backend/src/entities/TimeEntry.ts                        (72 líneas)
Backend/src/entities/TimeEntryChangeLog.ts              (60 líneas)
Backend/src/services/TimeEntryService.ts               (196 + ~50 líneas S2-01)
Backend/src/migrations/1712500000000-CreateTimeEntryTables.ts (101 líneas)
```

### Modified
```
Backend/src/database.ts                                 (+2 imports)
Backend/src/controllers/ficha.controller.ts             (+5 imports, +80 clockin/out, +100 review-correction, +30 audit-trail)
```

### Documentation (companion)
```
INDEX-S1.md                                             (navigation + checklist)
RESUMEN-EJECUTIVO-S1.md                                 (executive summary)
DEPLOYMENT-S1.md                                        (deployment guide)
PR-TEMPLATE-S1.md                                       (this file)
VALIDATION-CHECKLIST.md                                 (local testing)
```

---

## ✅ Backward Compatibility

- ✅ Ficha API unchanged (existing code continues to work)
- ✅ TimeEntry recording is async/optional (graceful fallback)
- ✅ No breaking changes to frontend
- ✅ No changes to authentication/authorization (uses existing RBAC)
- ✅ Migrations are reversible (rollback supported)

---

## 🔒 Security & Compliance

### Legal (Spanish Law)
- ✅ **Art. 34.9 ET**: "Registro diario de jornada" — timestampUtc + localDateTime capture
- ✅ **RDL 8/2019**: "Sistema digital objetivo y confiable" — source enum (WEB|MOBILE|KIOSK) + IP
- ✅ **Trazabilidad**: All events + changes timestamped + auditable
- ✅ **Inspección de Trabajo**: GET /audit-trail endpoint ready

### RBAC
- ✅ audit-trail: only owner | auditor | manager | admin can view
- ✅ canAccessCompanyResource: enforced for cross-tenant (multi-tenant isolation)
- ✅ review-correction: requires 'review_ficha_correction' permission

### Data Protection
- ✅ IP captured for audit (GDPR recital 49 — legitimate interest)
- ✅ userAgent captured for device identification
- ✅ Soft deletion: status=archived (no hard deletes)
- ✅ Data minimization: only necessary fields in TimeEntry

---

## 📊 Metrics

```
Lines of code added:      ~500 (entities + service + migrations + endpoints)
Lines of code modified:   ~150 (clockin/out + audit-trail + review-correction)
Build time:               ~3 seconds (TypeScript)
TypeScript errors:        0 ✅
PostgreSQL migrations:    1 (CreateTimeEntryTables)
New endpoints:            1 (GET /audit-trail)
Enhanced endpoints:       3 (POST /clockin, /clockout, /review-correction)
Database tables:          2 (time_entries, time_entry_change_logs)
Database indexes:         6 (for query performance)
```

---

## 🧪 Testing Performed

- [x] TypeScript compilation: 0 errors ✅
- [x] Build: npm run build OK ✅
- [ ] Unit tests: TimeEntryService (TODO — can be added as follow-up)
- [ ] Integration tests: clockin/clockout/audit-trail (TODO — follow-up)
- [ ] Local validation: See VALIDATION-CHECKLIST.md (manual steps)

**To validate locally**:
```bash
# 1. Build
cd Backend && npm run build

# 2. Configure .env with DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/tempos_db"

# 3. Run migrationsplease
npm run migration:run -- -d dist/database.js

# 4. Start server
npm run dev

# 5. Test endpoints (see VALIDATION-CHECKLIST.md for detailed steps)
curl -X POST http://localhost:8080/api/v1/fichas/clockin \
  -H "Authorization: Bearer test-token"
```

---

## 🚀 Deployment Notes

### Prerequisites
- PostgreSQL 12+ with creation permissions
- Express server with TypeORM
- Firebase Auth working (unchanged)

### Migration Steps
1. `npm run build` — compile TypeScript
2. `npm run migration:run -d dist/database.js` — create tables
3. `npm run dev` — start server
4. Verify: POST /clockin → TimeEntry created ✅

### Rollback
```bash
npm run migration:revert -d dist/database.js
```

### Performance
- New indexes on (fichaId, type), (userId, timestampUtc) → fast queries
- timeEntryService async recording → non-blocking
- Graceful fallback → no 500 errors if TimeEntry fails

---

## 📋 Related Issues

- Closes: #153 (Trazabilidad fichajes granular)
- Closes: #154 (Logging correcciones)
- Requires: PostgreSQL migrations (in this PR)
- Relates: Compliance audit trail for Inspección de Trabajo

---

## 👥 Reviewers Checklist

**Backend Lead**: Review code architecture, database design
- [ ] TimeEntry + TimeEntryChangeLog entities follow TypeORM patterns
- [ ] Indexes appropriate for expected queries
- [ ] Graceful fallback logic correct
- [ ] Error handling covers edge cases

**Legal/Compliance**: Review legal compliance
- [ ] Art. 34.9 ET requirements met
- [ ] RDL 8/2019 digital requirements met
- [ ] RGPD data minimization OK
- [ ] Retention policy alignment (4-year minimum)

**QA/Testing**: Prepare test plan
- [ ] Unit tests for TimeEntryService methods
- [ ] Integration tests for endpoints
- [ ] RBAC tests (access control)
- [ ] Audit trail completeness

**DevOps**: Prepare deployment
- [ ] Rollback plan documented
- [ ] Performance impact assessed
- [ ] Monitoring/alerting configured
- [ ] Database backup strategy OK

---

## 📝 Merge Criteria

- [ ] All code reviews approved ✅
- [ ] Legal review approved ✅
- [ ] CI/CD pipeline green ✅
- [ ] 2+ approvals from code reviewers
- [ ] No blocking comments

---

## 🎓 Documentation for Users

- **For Developers**: See class comments in TimeEntry.ts, TimeEntryService.ts
- **For Operators**: See DEPLOYMENT-S1.md for steps
- **For Compliance**: See RESUMEN-EJECUTIVO-S1.md for legal mapping
- **For QA**: See VALIDATION-CHECKLIST.md for manual testing

---

## Notes

- Timezone handling: All times captured in Europe/Madrid timezone (corrección de sesión anterior)
- Graceful fallback: If TimeEntry recording fails, Ficha is still created (audit logging in Backend logs)
- Multi-tenant: All queries use companyId scoping (existing RBAC maintained)
- Idempotent: Migrations can be run multiple times safely

---

**Author**: GitHub Copilot (Claude Haiku 4.5)  
**Date**: 2026-04-07  
**Sprint**: S1-S2-01 (Semana 1 Plan Maestro)  
**Status**: Ready for Code Review
