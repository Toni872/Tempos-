# PR: S1 — Atomic Time Entry Events (Eventos Atómicos de Fichaje)

## Título de PR (para GitHub)
```
feat(ficha): atomic time entry events for legal compliance (art. 34.9 ET)
```

## Descripción

Implementación de trazabilidad atómica para eventos de fichaje (clockin/clockout) conforme a requisitos legales españoles (Art. 34.9 ET, RDL 8/2019, RGPD).

### Motivación
El modelo anterior de Ficha (inicio/fin diarios) no capturaba la granularidad necesaria para:
- Inspección de Trabajo (art. 34.9 ET): requerir registro de hora exacta
- Trazabilidad: auditar cambios, sincronizaciones, correcciones
- Disputas: demostrar quién hizo qué y cuándo

### Cambios

#### 1. Nuevas Entidades (TypeORM)
- **TimeEntry**: evento atómico (CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END)
  - Campos: fichaId, userId, type enum, timestampUtc, localDateTime (ISO 8601 con TZ)
  - Captura: IP, userAgent, latitude/longitude, metadata custom
  - Índices: (fichaId, type), (userId, timestampUtc), (userId, createdAt)
  
- **TimeEntryChangeLog**: auditoría de cambios/sincronizaciones
  - Campos: timeEntryId, changedBy, action enum (CREATED|MODIFIED|DELETED|CORRECTED)
  - Cambios: before/after JSON, reason (motivo corrección)
  - Metadatos: approvalStatus (pending|approved|rejected)

#### 2. Servicio (TimeEntryService)
```typescript
// Métodos públicos:
- recordClockEvent({userId, fichaId, type, source, ...}): Promise<TimeEntry>
- logChange({timeEntryId, changedBy, action, changeSet, ...}): Promise<TimeEntryChangeLog>
- getChangeHistory(timeEntryId): Promise<TimeEntryChangeLog[]>
- getsFichaEvents(fichaId): Promise<TimeEntry[]>
- getUserEventsByDateRange(userId, startDate, endDate): Promise<TimeEntry[]>
- getLastEventForUser(userId): TimeEntry | null
```

#### 3. Endpoints Refactorizados
- **POST /api/v1/fichas/clockin**
  - ✅ Crea Ficha (existente)
  - ✅ Crea TimeEntry(CLOCK_IN) con metadatos (NUEVO)
  - Fallback graceful si falla TimeEntry

- **POST /api/v1/fichas/clockout**
  - ✅ Actualiza Ficha.endTime + hoursWorked (existente)
  - ✅ Crea TimeEntry(CLOCK_OUT) con metadatos (NUEVO)
  - Fallback graceful si falla TimeEntry

- **GET /api/v1/fichas/:id/audit-trail** (NUEVO)
  - Retorna: ficha + timeEntries + changeLog
  - RBAC: propietario | auditor | manager | admin
  - Formato de respuesta legal-ready para inspección

#### 4. Migraciones
- **1712500000000-CreateTimeEntryTables.ts**
  - Crea enums PostgreSQL: time_entry_type_enum, time_entry_source_enum, change_action_enum
  - Crea tablas: time_entries, time_entry_change_logs
  - Crea índices para queries rápidas (audit, reportes)
  - FK: fichaId → fichas(id) ON DELETE CASCADE
  - FK: userId → users(uid) ON DELETE RESTRICT

#### 5. Base de datos (database.ts)
- Importa TimeEntry, TimeEntryChangeLog en entities
- Carga automáticamente en DataSource

### Archivos Creados
```
Backend/src/entities/TimeEntry.ts              (72 líneas)
Backend/src/entities/TimeEntryChangeLog.ts     (60 líneas)
Backend/src/services/TimeEntryService.ts       (196 líneas)
Backend/src/migrations/1712500000000-*.ts      (101 líneas)
```

### Archivos Modificados
```
Backend/src/database.ts                        (+2 imports)
Backend/src/controllers/ficha.controller.ts    (+5 imports, +80 líneas, 2 endpoints refactored, 1 nuevo)
```

### Backward Compatibility
✅ API existente inalterada (Ficha sigue funcionando igual)
✅ TimeEntry es asíncrono opcional (fallback graceful)
✅ No requiere cambios en frontend

### Testing
- [x] TypeScript compilation: 0 errors
- [x] Build: npm run build OK
- [ ] Unit tests: TimeEntryService (pendiente)
- [ ] Integration tests: clockin/clockout (pendiente)
- [ ] Database migration test (pendiente cuando DATABASE_URL configurado)

### Legal Compliance
- ✅ Art. 34.9 ET: Registro de hora exacta (timestampUtc + localDateTime)
- ✅ RDL 8/2019: Sistema digital objetivo (source: WEB|MOBILE|KIOSK)
- ✅ Trazabilidad: Todos los eventos + cambios timestamped (createdAt)
- ✅ Auditoría Inspección: GET /audit-trail endpoint con RBAC

### Performance Impact
- Tablas nuevas con índices apropiados → queries rápidas
- FK constraints → integridad referencial
- Async event recording → no bloquea respuesta principal
- Fallback graceful → degradation graceful si BD tiene problemas

### Rollback Plan
- Revert migración: `npm run migration:revert`
- Rollback código: `git revert {commit-hash}`
- Ficha seguirá funcionando (TimeEntry es aditivo)

### Checklist (antes de merge)
- [ ] Code review by Backend Lead
- [ ] Legal review: compliance art. 34.9 ET + RGPD
- [ ] .env DATABASE_URL configurado para tests
- [ ] npm run build sin errores
- [ ] npm run migration:run exitosa
- [ ] CI/CD pipeline green
- [ ] Testing local: clockin/clockout → TimeEntry creado
- [ ] Testing local: GET /audit-trail → datos correctos

### Relacionado
- Cierra: #153 (Trazabilidad fichajes)
- Depende de: Base de datos PostgreSQL con migrations ejecutadas
- Próximas: S2-01 (Trazabilidad cambios Ficha), S3-01 (RGPD docs)

---

## Instrucciones para Revisor

1. **Verificar entidades**: TimeEntry.ts y TimeEntryChangeLog.ts siguen patrón TypeORM existente
2. **Verificar servicio**: TimeEntryService sigue patrón inyección dependencias (singleton)
3. **Verificar migración**: CREATE TABLE, FK, indexes, DROP (rollback) sintaxis correcta
4. **Verificar endpoints**: clockin/clockout capturan metadata, auth-trail valida permisos
5. **Verificar compilación**: `npm run build` sin errores

## Notas del Desarrollo

- Zona horaria: `Europe/Madrid` capturada vía `getMadridDateTimeParts()`
- localDateTime: ISO 8601 con +02:00 (formato legal España)
- Fallback graceful: si TimeEntry falla, Ficha se crea igual (auditoría en logs)
- RBAC audit-trail: solo owner|auditor|manager|admin pueden ver

---

**Autor**: GitHub Copilot  
**Fecha**: 2026-04-07  
**Sprint**: S1 (Semana 1 Plan Maestro)
