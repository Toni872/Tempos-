# GitHub Secrets para Tempos

Este archivo documenta los secretos requeridos para workflows sin exponer valores.

## Secrets minimos

- `GCP_SA_KEY`: JSON completo de la cuenta de servicio para CI.

## Secrets recomendados

- `GCP_PROJECT`: `tempos-project`
- `GCS_BUCKET`: `bucket-quickstart_tempos-project`
- `VERTEX_REGION`: `europe-west4`

## Como cargarlos

1. GitHub -> Settings -> Secrets and variables -> Actions.
2. New repository secret.
3. Pegar valor exacto (sin comillas extra).
4. Guardar.

## Verificaciones de seguridad

- No pegar secretos en issues, commits ni PRs.
- Rotar `GCP_SA_KEY` cada 90 dias o ante sospecha.
- Limitar permisos IAM de la SA al minimo necesario.
- Borrar claves antiguas no usadas.

## Rotacion rapida (gcloud)

```powershell
# Crear nueva clave
 gcloud iam service-accounts keys create "new-key.json" --iam-account=tempos-backend-sa@tempos-project.iam.gserviceaccount.com --project=tempos-project

# Ver claves activas
 gcloud iam service-accounts keys list --iam-account=tempos-backend-sa@tempos-project.iam.gserviceaccount.com --project=tempos-project

# Eliminar clave antigua
 gcloud iam service-accounts keys delete KEY_ID --iam-account=tempos-backend-sa@tempos-project.iam.gserviceaccount.com --project=tempos-project
```
