# Tempos - Roadmap Operativo (Ejecucion Determinista)

Este documento define la secuencia fija de ejecucion para operaciones y seguridad.

## Fase 1 - Secret Manager (obligatoria)

Objetivo: sacar secretos de archivos locales y centralizarlos.

Comando:

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\setup_secret_manager.ps1" -ProjectId "tempos-project" -FirebaseKeyPath "C:\Users\Antonio\Desktop\Tempos\Backend\firebase-key.json"
```

Resultado esperado:

- Secreto `tempos-firebase-key-json` creado y versionado.
- Opcional: `tempos-db-url` si se pasa `-DbUrl`.

## Fase 2 - Cloud Scheduler para retraining

Objetivo: ejecutar retraining de Vertex AI con cadencia fija.

Prerequisito:

- Tener un Cloud Build Trigger que ejecute entrenamiento.

Comando:

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\setup_cloud_scheduler.ps1" -ProjectId "tempos-project" -Region "europe-west4" -CloudBuildTriggerId "TU_TRIGGER_ID"
```

Resultado esperado:

- Job `tempos-vertex-retrain-daily` creado.
- Job disparado una vez de prueba.

## Fase 2.1 - Consumidor Pub/Sub de retraining

Objetivo: ejecutar un worker que reciba el evento del scheduler y lance el retraining.

Comando:

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\deploy_retrain_worker.ps1" -ProjectId "tempos-project" -Region "europe-west4"
```

Resultado esperado:

- Servicio Cloud Run `tempos-retrain-worker` desplegado.
- Suscripcion push `tempos-vertex-retrain-sub` creada y conectada.

## Fase 3 - Hardening operativo final

Checklist corto (obligatorio antes de produccion):

- [ ] Claves fuera de Git y en Secret Manager.
- [ ] Roles IAM en minimo privilegio.
- [ ] API backend healthy en local y CI.
- [ ] Workflows CI y Vertex sin secretos en texto plano.
- [ ] Scheduler con trazabilidad (Cloud Logging) y prueba de ejecucion.
- [ ] Rotacion de claves definida (cada 90 dias).

## Fase 3.1 - GitHub Secrets (automatizada)

Objetivo: dejar CI/CD listo para ejecutar workflows sin secretos locales.

Prerequisitos:

- Repo GitHub existente y remoto `origin` configurado.
- `gh auth login` completado.

Comando:

```powershell
npm --prefix "C:\Users\Antonio\Desktop\Tempos\Backend" run github:secrets -- -ProjectId tempos-project
```

Resultado esperado:

- Secrets creados en GitHub: `GCP_SA_KEY`, `GCP_PROJECT`, `GCS_BUCKET`, `VERTEX_REGION`.

## Criterio de cierre

Se considera completado cuando:

1. `setup_secret_manager.ps1` termina en OK.
2. `setup_cloud_scheduler.ps1` termina en OK.
3. La checklist de hardening queda completa.
