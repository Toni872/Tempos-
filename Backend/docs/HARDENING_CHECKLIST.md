# Tempos - Hardening Operativo Final (Actualizado)

Fecha: 2026-05-16
Proyecto GCP: tempos-project
Region de operaciones: europe-west4

## 1) Secretos y Configuración

- [X] Secret Manager habilitado.
- [X] Secreto creado: tempos-firebase-key-json.
- [X] Version activa cargada desde Backend/firebase-key.json.
- [ ] Secreto DB URL creado (pendiente de definir valor final de producción).
- [X] Claves JSON fuera de Git (gitignore aplicado).
- [X] **Puerto de Backend sincronizado en 8081.**

## 2) Scheduler y Retraining (MLOps)

- [X] Cloud Scheduler habilitado.
- [X] Job creado: tempos-vertex-retrain-daily.
- [X] Cron: `0 3 * * *` (Europe/Madrid).
- [X] Ejecución manual de prueba completada satisfactoriamente.
- [X] Tópico Pub/Sub: tempos-vertex-retrain.
- [X] Consumidor (Cloud Run worker) conectado y operativo.

## 3) Backend y Seguridad

- [X] Docker compose con restart policy activa.
- [X] API healthy en **localhost:8081**.
- [X] Postgres healthy en localhost:5433 (mapeado a 5432 interno).
- [X] **Validación de Datos (Frontend)**: Migración a Zod completada en Auth y Trial.
- [X] **Autenticación**: Endpoint `/me` robustecido devolviendo estado de Trial.
- [X] **Sincronización ESM**: Scripts de mantenimiento actualizados con extensiones `.js`.

## 4) CI/CD y Despliegue

- [X] Workflow CI activo.
- [X] Workflow Vertex creado.
- [ ] Secretos de GitHub cargados en repo (GCP_SA_KEY, etc.).
- [ ] Deploy de producción del frontend a Firebase Hosting.

## 5) Estado de Verificación Actual

- **Conexión API-DB**: OK.
- **Flujo de Trial**: OK (14 días calculados en backend, banner visible en frontend).
- **Seguridad**: Zod schemas activos en formularios críticos.

## 6) Próximos Pasos Prioritarios

1.  Configuración de Secretos en GitHub Actions para despliegue automatizado.
2.  Integración del SDK de Firebase en la App de Android (Kotlin).
3.  Definición de la URL de DB de producción en Secret Manager.

---
*Estado global: ESTABLE / PRE-PRODUCCIÓN*
