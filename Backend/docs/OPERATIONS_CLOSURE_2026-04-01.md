# Tempos - Cierre Operativo

Fecha de cierre: 2026-04-01
Alcance: backend local, seguridad base, GCP secretos, scheduler de retraining, consumidor Cloud Run.

## 1) Resumen ejecutivo

El roadmap operativo definido para Tempos ha quedado ejecutado de forma secuencial y verificable:

1. Secret Manager configurado y secreto Firebase versionado.
2. Cloud Scheduler de retraining creado y habilitado.
3. Flujo Scheduler -> Pub/Sub -> Cloud Run worker desplegado y respondiendo correctamente.
4. Backend local estable con contenedores saludables.
5. CI/CD endurecido para no tolerar fallos silenciosos.

## 2) Evidencias de estado

### GCP Secret Manager
- Secreto: `tempos-firebase-key-json`.
- Estado: creado y con version activa.

### Cloud Scheduler
- Job: `tempos-vertex-retrain-daily`.
- Region: `europe-west4`.
- Cron: `0 3 * * *`.
- Estado: `ENABLED`.

### Pub/Sub
- Topic: `tempos-vertex-retrain`.
- Suscripcion push: `tempos-vertex-retrain-sub`.

### Cloud Run worker
- Servicio: `tempos-retrain-worker`.
- Revision valida: `tempos-retrain-worker-00004-7vd`.
- Verificacion de requests recientes: HTTP 200.

### Backend local
- API: `http://localhost:8080/health` -> OK.
- Postgres Docker: healthy.
- API Docker: healthy.

## 3) Seguridad aplicada

- Claves sensibles fuera de Git en `.gitignore`.
- Cuenta de servicio dedicada para backend/retraining.
- Scheduler y worker separados del backend de negocio.
- Quota project de ADC alineado a `tempos-project`.
- Documentacion de seguridad y hardening actualizada.

## 4) Pendientes manuales (reales y acotados)

1. Autenticar GitHub CLI (`gh auth login`) y crear remoto GitHub (repo local ya inicializado).
2. Cargar secretos en GitHub Actions del repo:
   - `GCP_SA_KEY`
   - `GCP_PROJECT`
   - `GCS_BUCKET`
   - `VERTEX_REGION`
3. Completar secreto de DB URL de produccion en Secret Manager (`tempos-db-url`).
4. Definir politica de rotacion de claves (90 dias) y responsable.
5. Si se desea estrictamente tarea programada Windows (`schtasks`), ejecutar con privilegios admin. Actualmente el autoarranque funcional esta cubierto por Startup + Docker restart policy.

## 5) Mantenimiento operativo

## Semanal
- Revisar salud del backend y logs de errores.
- Revisar ejecuciones del Scheduler.
- Revisar errores 5xx del worker de retraining.

## Mensual
- Revisar IAM y reducir privilegios no usados.
- Auditar secretos y versiones activas.
- Verificar costos de Vertex/Cloud Run/Scheduler.

## Trimestral
- Rotar claves de cuentas de servicio.
- Revisar roadmap IA y calidad de datos de entrenamiento.
- Ejecutar prueba de recuperacion operativa documentada.

## 6) Comandos de verificacion rapida

```powershell
gcloud secrets list --project tempos-project --filter="name~tempos"
gcloud scheduler jobs list --location europe-west4 --project tempos-project
gcloud run services describe tempos-retrain-worker --project tempos-project --region europe-west4 --format="yaml(status.url,status.conditions)"
Invoke-RestMethod http://localhost:8080/health
```

## 7) Criterio de continuidad

La plataforma queda en estado operativo controlado.
Siguiente bloque recomendado: integrar dataset/feature pipeline para entrenamiento real (sustituir placeholder del custom job por pipeline de entrenamiento de Tempos).
