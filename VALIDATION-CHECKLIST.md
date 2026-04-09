# ✅ Checklist de Validación Local — S1 + S2-01

**Fecha**: 2026-04-07  
**Objetivo**: Verificar que compilación, migraciones y endpoints funcionan correctamente

---

## Pre-requisitos

- [ ] PostgreSQL accesible (`psql postgresql://...`)
- [ ] Backend/.env configurado con DATABASE_URL
- [ ] Docker Desktop (opcional, para Postgres local)

---

## Fase 1: Compilación (5 min)

```bash
cd Backend

# 1. Limpiar build anterior
rm -rf dist/

# 2. Compilar TypeScript
npm run build

# ✅ Esperado: Exit code 0, compilación exitosa
```

**Validación**: Ver que `dist/` existe con archivos compilados.

---

## Fase 2: Migraciones (10 min)

```bash
# 3. Cargar DATABASE_URL
export DATABASE_URL="postgresql://user:pass@localhost:5432/tempos_db"

# 4. Verificar conexión
psql $DATABASE_URL -c "SELECT version();"
# ✅ Esperado: PostgreSQL version string

# 5. Ejecutar migración S1
npm run migration:run -- -d dist/database.js
# ✅ Esperado: "Migration CreateTimeEntryTables1712500000000 registered"

# 6. Verificar tablas creadas
psql $DATABASE_URL -c "\dt time_entries;"
# ✅ Esperado: tabla public.time_entries con columnas

psql $DATABASE_URL -c "\dt time_entry_change_logs;"
# ✅ Esperado: tabla public.time_entry_change_logs con columnas

# 7. Verificar índices
psql $DATABASE_URL -c "\di" | grep time_entry
# ✅ Esperado: 6 índices (ficha_type, user_timestamp, etc.)
```

---

## Fase 3: Servidor (5 min)

```bash
# 8. Iniciar backend
npm run dev

# ✅ Esperado en logs:
# - "Server running on http://localhost:8080"
# - "Database connection successful"
# - Ningún ERROR

# En otra terminal:
# 9. Health check
curl http://localhost:8080/health
# ✅ Esperado: {"status": "ok"}
```

---

## Fase 4: Testing Endpoints (15 min)

### Test clockin (crea Ficha + TimeEntry CLOCK_IN)

```bash
# 10. clockin
FICHA_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/fichas/clockin \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}')

echo $FICHA_RESPONSE | jq .

# ✅ Esperado:
# {
#   "message": "Entrada registrada",
#   "ficha": {
#     "id": "UUID",
#     "date": "2026-04-07",
#     "startTime": "HH:MM",
#     "status": "draft"
#   }
# }

# Guardar FICHA_ID para tests posteriores
FICHA_ID=$(echo $FICHA_RESPONSE | jq -r '.ficha.id')
echo "FICHA_ID=$FICHA_ID"
```

### Verificar TimeEntry CLOCK_IN creado

```bash
# 11. Verificar en BD
psql $DATABASE_URL -c "SELECT id, type, timestamp_utc, created_at FROM time_entries WHERE ficha_id = '$FICHA_ID' ORDER BY created_at DESC LIMIT 1;"

# ✅ Esperado:
# - 1 fila
# - type = 'CLOCK_IN'
# - timestamp_utc = NOW() (hace ~1 minuto)
```

### Test clockout (actualiza Ficha + TimeEntry CLOCK_OUT)

```bash
# 12. clockout
curl -X POST http://localhost:8080/api/v1/fichas/clockout \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# ✅ Esperado:
# "message": "Salida registrada",
# "ficha": {
#   "hoursWorked": <decimal>,
#   "status": "confirmed"
# }
```

### Verificar TimeEntry CLOCK_OUT creado

```bash
# 13. Verificar CLOCK_OUT
psql $DATABASE_URL -c "SELECT id, type, timestamp_utc FROM time_entries WHERE ficha_id = '$FICHA_ID' ORDER BY timestamp_utc ASC;"

# ✅ Esperado:
# - 2 filas (CLOCK_IN + CLOCK_OUT)
# - timestamps en orden cronológico
```

### Test audit-trail (GET trazabilidad)

```bash
# 14. Ver audit trail (incluye eventos + cambios)
curl http://localhost:8080/api/v1/fichas/$FICHA_ID/audit-trail \
  -H "Authorization: Bearer test-token" | jq .

# ✅ Esperado estructura:
# {
#   "ficha": {...},
#   "timeEntries": [
#     { id, type: "CLOCK_IN", ... },
#     { id, type: "CLOCK_OUT", ... }
#   ],
#   "changeLog": {},
#   "auditMeta": { ... }
# }
```

---

## Fase 5: Testing S2-01 (Correcciones con ChangeLog)

### Test solicitud corrección

```bash
# 15. Empleado solicita corrección
CORRECTION=$(curl -s -X POST http://localhost:8080/api/v1/fichas/$FICHA_ID/request-correction \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Error zona horaria",
    "startTime": "09:00",
    "endTime": "18:30"
  }')

echo $CORRECTION | jq .

# ✅ Esperado:
# "message": "Solicitud de corrección registrada"
# "ficha": { "status": "disputed" }
```

### Test revisión corrección (aprobación)

```bash
# 16. Manager aprueba corrección
REVIEW=$(curl -s -X POST http://localhost:8080/api/v1/fichas/$FICHA_ID/review-correction \
  -H "Authorization: Bearer test-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "approved",
    "comment": "Corrección válida"
  }')

echo $REVIEW | jq .

# ✅ Esperado:
# "message": "Corrección aplicada sobre la ficha"
# "ficha": { "startTime": "09:00", "endTime": "18:30", "status": "confirmed" }
```

### Verificar TimeEntryChangeLog creado (S2-01)

```bash
# 17. Verificar que se grabó el changeLog
psql $DATABASE_URL -c "SELECT id, time_entry_id, action, reason, created_at FROM time_entry_change_logs ORDER BY created_at DESC LIMIT 5;"

# ✅ Esperado:
# - 2 filas (una por cada TimeEntry: CLOCK_IN y CLOCK_OUT)
# - action = 'CORRECTED'
# - reason = 'Corrección válida' (o similar)
```

### Verificar audit-trail actualizado con changeLog

```bash
# 18. Ver audit trail con cambios incluidos
curl http://localhost:8080/api/v1/fichas/$FICHA_ID/audit-trail \
  -H "Authorization: Bearer test-adapter" | jq .changeLog

# ✅ Esperado:
# {
#   "timeEntryId1": [
#     { id, action: "CORRECTED", changeSet: {...}, reason: "...", ... }
#   ],
#   "timeEntryId2": [
#     { id, action: "CORRECTED", changeSet: {...}, reason: "...", ... }
#   ]
# }
```

---

## Fase 6: Validación RBAC

```bash
# 19. Test: employee NO puede ver audit-trail de otro usuario
# (usar token de otro usuario)
curl http://localhost:8080/api/v1/fichas/$FICHA_ID/audit-trail \
  -H "Authorization: Bearer test-token-user-2"

# ✅ Esperado: 404 (ficha no encontrada para ese usuario)

# 20. Test: auditor SI puede ver audit-trail
curl http://localhost:8080/api/v1/fichas/$FICHA_ID/audit-trail \
  -H "Authorization: Bearer test-auditor"

# ✅ Esperado: 200 OK + respuesta completa
```

---

## Rollback (si es necesario)

```bash
# Si algo falla, revertir migración:
npm run migration:revert -- -d dist/database.js

# Verificar que tablas fueron eliminadas:
psql $DATABASE_URL -c "\dt time_entries;" # no debe existir
```

---

## Resumen Checklist

- [ ] npm run build: OK
- [ ] Migraciones ejecutadas: OK
- [ ] Tablas creadas (time_entries, time_entry_change_logs): OK
- [ ] Índices creados (6 total): OK
- [ ] POST /clockin: Ficha + TimeEntry(CLOCK_IN): OK
- [ ] POST /clockout: Ficha + TimeEntry(CLOCK_OUT): OK
- [ ] GET /audit-trail: retorna ficha + eventos: OK
- [ ] POST /request-correction: crea corrección: OK
- [ ] POST /review-correction (approved): applica cambios: OK
- [ ] TimeEntryChangeLog creado: OK
- [ ] Audit-trail muestra changeLog: OK
- [ ] RBAC validado: OK
- [ ] Rollback funciona: OK

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| "DATABASE_URL no definido" | Env var no cargada | `export DATABASE_URL="..."` |
| "Cannot connect to PostgreSQL" | BD no accesible | Verificar conexión, iniciar Postgres |
| "Migration already exists" | Ya fue ejecutada | Ignorar (idempotente), verificar BD |
| "TimeEntry no se crea pero Ficha sí" | TimeEntry error (fallback graceful) | Revisar logs backend, permisos BD |
| "403 en audit-trail" | Permisos insuficientes | Usar token de auditor/manager |
| "changeLog vacío" | S2-01 no grabó cambios | Verificar que corrección fue "approved" |

---

**Próxima fase**: C — Crear PR en GitHub

**Si todo pasa**: Hacer commit y crear PR con template PR-TEMPLATE-S1.md
