# Tempos - Hardening Operativo Final

Fecha: 2026-04-01
Proyecto GCP: tempos-project
Region de operaciones: europe-west4

## 1) Secretos

- [X] Secret Manager habilitado.
- [X] Secreto creado: tempos-firebase-key-json.
- [X] Version activa cargada desde Backend/firebase-key.json.
- [ ] Secreto DB URL creado (pendiente de definir valor final de produccion).
- [X] Claves JSON fuera de Git (gitignore aplicado).

## 2) Scheduler de retraining

- [X] Cloud Scheduler habilitado.
- [X] Job creado: tempos-vertex-retrain-daily.
- [X] Cron: `0 3 * * *` (Europe/Madrid).
- [X] Ejecucion manual de prueba completada.
- [X] Topico Pub/Sub: tempos-vertex-retrain.
- [X] Consumidor conectado al topico (Cloud Run/Function/Worker) para lanzar entrenamiento real.

## 3) Backend y runtime

- [X] Docker compose con restart policy activa.
- [X] API healthy en localhost:8080.
- [X] Postgres healthy en localhost:5433.
- [X] Healthcheck de contenedor API robustecido.

## 4) CI/CD

- [X] Workflow CI activo y estricto (sin ignore de fallos).
- [X] Workflow Vertex creado.
- [ ] Secretos de GitHub cargados en repo:
  - GCP_SA_KEY
  - GCP_PROJECT
  - GCS_BUCKET
  - VERTEX_REGION

Comando operativo (una vez exista repo y origin):

```powershell
npm --prefix "C:\Users\Antonio\Desktop\Tempos\Backend" run github:secrets -- -ProjectId tempos-project
```

Si aun no existe repo remoto GitHub, secuencia minima:

```powershell
npm --prefix "C:\Users\Antonio\Desktop\Tempos\Backend" run github:bootstrap -- -RepoName Tempos -Visibility private
npm --prefix "C:\Users\Antonio\Desktop\Tempos\Backend" run github:secrets -- -ProjectId tempos-project
```

## 5) IAM y seguridad

- [X] Cuenta dedicada creada: tempos-backend-sa.
- [X] Roles base asignados (storage + aiplatform user).
- [ ] Revisar reduccion adicional de privilegios para prod.
- [ ] Programar rotacion de claves (cada 90 dias).

## 6) Cierre operativo

Estado global actual: EN CURSO

Criterios para marcar COMPLETADO:

1. Cargar secretos en GitHub Actions.
2. Completar secreto de DB URL para entorno objetivo.
3. Confirmar una ejecucion completa de retraining extremo a extremo.

Estado de verificacion actual:

- Scheduler -> Pub/Sub -> Cloud Run worker: OK (HTTP 200 en revision `tempos-retrain-worker-00005-q64`).

## 7) Comandos de verificacion usados

```powershell
gcloud secrets list --project tempos-project --filter="name~tempos"
gcloud scheduler jobs list --location europe-west4 --project tempos-project
gcloud pubsub topics list --project tempos-project --filter="name:tempos-vertex-retrain"
Invoke-RestMethod http://localhost:8080/health
```
