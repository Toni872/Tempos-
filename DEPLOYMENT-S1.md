# S1: Deployment Instructions — Atomic Time Entry Events

**Fecha**: 2026-04-07  
**Phase**: S1 (Semana 1 Plan Maestro — Eventos Atómicos)  
**Status**: ✅ Code Complete → Ready for Staging

---

## Pre-requisitos

1. **PostgreSQL local o cloud accesible**
   - Test: `psql postgresql://user:pass@host:port/dbname`

2. **Backend/.env configurado**
   ```env
   NODE_ENV=development  # o production
   DATABASE_URL=postgresql://user:pass@host:5432/tempos_db
   FIREBASE_KEY_JSON=/path/to/firebase-key.json
   # ... resto de secrets
   ```

3. **Migraciones previas ejecutadas**
   - Tablas users ejecutadas
   - Tablas fichas (existente) accesible

---

## Pasos de Deployment

### Fase 1: Verificación Local (5 min)

```bash
cd Backend

# 1. Limpiar build anterior
rm -rf dist/

# 2. Compilar TypeScript
npm run build
# ✅ Esperado: "Compilation complete" sin errores

# 3. Verificar que migraciones están presentes
ls dist/migrations/
# ✅ Esperado: ver 1712500000000-CreateTimeEntryTables.js
```

### Fase 2: Ejecución de Migraciones (5 min)

```bash
# 4. Preparar base de datos
export DATABASE_URL="postgresql://user:pass@localhost:5432/tempos_db"

# 5. Ejecutar migración
npm run migration:run -- -d dist/database.js
# ✅ Esperado: "Migration CreateTimeEntryTables1712500000000 registered"
# ✅ Esperado: "Migrations executed" sin errores

# 6. Verificar tablas creadas
psql $DATABASE_URL -c "\dt time_entries, time_entry_change_logs"
# ✅ Esperado: ver 2 tablas con columnas

# 7. Verificar índices
psql $DATABASE_URL -c "\di" | grep time_entries
# ✅ Esperado: 3 índices (ficha_type, user_timestamp, user_created)
```

### Fase 3: Levantamiento de servidor (5 min)

```bash
# 8. Iniciar backend
npm run dev
# ✅ Esperado: "Server running on http://localhost:8080"
# ✅ Esperado: Database connection successful

# 9. Verificar health
curl http://localhost:8080/health
# ✅ Esperado: {"status": "ok"}
```

### Fase 4: Testing Manual (10 min)

```bash
# 10. Test clockin (crear Ficha + TimeEntry)
curl -X POST http://localhost:8080/api/v1/fichas/clockin \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}'
# ✅ Respuesta: { "message": "Entrada registrada", "ficha": {...} }

# 11. Verificar que TimeEntry se creó
psql $DATABASE_URL -c "SELECT * FROM time_entries ORDER BY created_at DESC LIMIT 1"
# ✅ Esperado: 1 fila con type='CLOCK_IN', timestampUtc=NOW()

# 12. Test clockout (actualizar Ficha + TimeEntry)
curl -X POST http://localhost:8080/api/v1/fichas/clockout \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}'
# ✅ Respuesta: { "message": "Salida registrada", "ficha": {...} }

# 13. Verificar TimeEntry CLOCK_OUT
psql $DATABASE_URL -c "SELECT * FROM time_entries WHERE type='CLOCK_OUT' ORDER BY created_at DESC LIMIT 1"
# ✅ Esperado: 1 fila con type='CLOCK_OUT'

# 14. Test audit-trail (ver trazabilidad)
FICHA_ID="..." # copiar ficha.id del test anterior
curl http://localhost:8080/api/v1/fichas/$FICHA_ID/audit-trail \
  -H "Authorization: Bearer test-token"
# ✅ Respuesta: { "ficha": {...}, "timeEntries": [...], "changeLog": {...} }
```

---

## Rollback (si es necesario)

```bash
# Si algo sale mal, revertir migración:
npm run migration:revert -- -d dist/database.js
# ✅ Esperado: "Migration CreateTimeEntryTables1712500000000 reverted"

# Verificar tablas eliminadas:
psql $DATABASE_URL -c "\dt" | grep time_entries
# ✅ Esperado: (sin salida = tablas eliminadas)
```

---

## Troubleshooting

### Error: "DATABASE_URL no definido"
```bash
# Solución: cargar .env
export DATABASE_URL="postgresql://...."
echo $DATABASE_URL  # verificar que esté cargado
npm run migration:run -- -d dist/database.js
```

### Error: "Migration CreateTimeEntryTables1712500000000 already exists"
```bash
# Solución: la migración ya fue ejecutada (idempotente)
# Verificar que las tablas existen:
psql $DATABASE_URL -c "SELECT COUNT(*) FROM time_entries"
# Si hay error de tabla, alguien hizo rollback parcial
```

### Error: "FK constraint violation"
```bash
# Causa: fichaId referencia a ficha que no existe
# Solución: verificar que fichas tabla sea accesible
psql $DATABASE_URL -c "SELECT COUNT(*) FROM fichas"
# Si no existe, ejecutar migraciones previas primero
```

### TimeEntry no se crea pero Ficha sí
```bash
# Esta es comportamiento esperado (fallback graceful)
# Verificar logs del backend:
# [ERROR] Error registrando TimeEntry CLOCK_IN: ...
# Por ejemplo: permisos insuficientes en time_entries table
# Solución: revisar permisos PostgreSQL user
```

### 403 en audit-trail
```bash
# Causa: usuario no tiene permisos
# - Solo owner, auditor, manager, admin pueden ver
# - Verificar que auth.role esté configurado
# Solución: usar token de admin o manager
```

---

## Validación Post-Deploy

Checklist de confirmación:

- [ ] Build completado sin errores
- [ ] Migraciones ejecutadas exitosamente
- [ ] Servidor levanta sin errores
- [ ] POST /clockin: Ficha creada + TimeEntry(CLOCK_IN) grabada
- [ ] POST /clockout: Ficha actualizada + TimeEntry(CLOCK_OUT) grabada
- [ ] GET /audit-trail: retorna ficha + eventos + cambios
- [ ] RBAC: /audit-trail bloquea users sin permiso (403)
- [ ] Logs: ningún error crítico en stdout
- [ ] BD: tablas time_entries, time_entry_change_logs con datos

---

## Siguiente Paso: S2

Una vez validado S1:

```
S2-01: Trazabilidad de cambios (correcciones, sincronizaciones)
S2-02: Endpoint exportación legal (CSV/PDF)
S2-03: Testing auditoría completa
```

---

**Autor**: GitHub Copilot  
**Validado**: 2026-04-07 (Build: OK, TypeScript: 0 errors)
