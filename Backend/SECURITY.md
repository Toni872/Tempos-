# Seguridad Backend Tempos

Guia operativa para desarrollo local y CI/CD con foco en secretos, Docker y minimo privilegio.

## 1) Reglas obligatorias

- Nunca subir claves al repositorio.
- Nunca guardar secretos en logs.
- Usar cuentas de servicio dedicadas por entorno (dev, ci, prod).
- Aplicar principio de menor privilegio en IAM.

## 2) Archivos sensibles

No deben versionarse:

- `firebase-key.json`
- `vertex-express-key.json`
- `.env`, `.env.local`, `.env.*.local`

## 3) Credenciales en local (Windows)

Coloca el JSON en `Backend/firebase-key.json` y restringe permisos:

```powershell
cd "C:\Users\Antonio\Desktop\Tempos\Backend"
icacls .\firebase-key.json /inheritance:r
icacls .\firebase-key.json /grant:r "$env:USERDOMAIN\$env:USERNAME:(R)"
icacls .\firebase-key.json /remove "Users" "Authenticated Users"
```

Para ejecutar local fuera de Docker:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\Antonio\Desktop\Tempos\Backend\firebase-key.json"
npm run dev
```

## 4) Docker Desktop seguro

- Activar inicio automatico de Docker Desktop al logon.
- No exponer Docker daemon por TCP.
- Limitar carpetas compartidas a las necesarias.
- Usar `restart: unless-stopped` para resiliencia local.

## 5) Autoarranque del stack al iniciar sesion

Script disponible:

- `Backend/scripts/start.ps1`

Instalador de tarea programada (requiere PowerShell como Administrador):

```powershell
PowerShell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Antonio\Desktop\Tempos\Backend\scripts\install-schtask.ps1"
```

Verificacion:

```powershell
schtasks /Query /TN "TemposStart"
```

## 6) IAM recomendado

Cuenta de servicio backend (`tempos-backend-sa`):

- `roles/storage.objectAdmin` (o `storage.objectCreator` si solo subida)
- `roles/aiplatform.user`

Evitar usar `compute@developer.gserviceaccount.com` como cuenta general con claves.

## 7) CI/CD y secretos

- En GitHub Actions usar `Secrets` (ejemplo: `GCP_SA_KEY`).
- No guardar JSON en workflows ni en variables visibles en logs.
- Rotar claves periodicamente y revocar las no usadas.

## 8) Base de datos y red

- Postgres solo local/privado (no exponer a Internet).
- Contraseñas no por defecto en entornos reales.
- Backups y prueba de restauracion periodica.

## 9) Checklist antes de deploy

- [ ] Ninguna clave en Git.
- [ ] `.gitignore` actualizado.
- [ ] IAM minimo privilegio validado.
- [ ] Secretos en gestor seguro (GitHub Secrets/Secret Manager).
- [ ] Logs sin credenciales.
- [ ] Endpoint de salud OK tras despliegue.
