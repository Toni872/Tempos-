# Tempos API — Backend

Backend Node.js + Express + TypeORM para la API REST de Tempos.

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantarlos servicios (PostgreSQL + API)
docker-compose up -d

# 4. Ejecutar migraciones
npm run migration:run

# 5. Iniciar desarrollo
npm run dev
```

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **ORM:** TypeORM
- **Database:** PostgreSQL (Cloud SQL en producción)
- **Auth:** Firebase Authentication
- **Deployment:** Docker → Google Cloud Run

## Estructura

```text
Backend/
├── src/
│   ├── index.ts              # Entrada principal
│   ├── database.ts           # Configuración TypeORM + DataSource
│   ├── controllers/          # Controladores de rutas
│   │   └── auth.controller.ts
│   ├── entities/             # Entidades de BD
│   │   ├── User.ts
│   │   └── Ficha.ts
│   ├── middleware/           # Middlewares Express
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   └── utils/                # Utilidades
├── migrations/               # TypeORM migrations
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## Variables de entorno

Ver `.env.example`. Crucial en producción:

- `DATABASE_URL`: Conexión a Cloud SQL
- `FIREBASE_PROJECT_ID`: Proyecto de Firebase
- `GOOGLE_APPLICATION_CREDENTIALS`: Path a firebase-key.json (o Secret Manager en GCP)
- `AUTH_RATE_LIMIT_WINDOW_MS`: Ventana del limitador de auth en ms (por defecto 300000 en dev, 900000 en prod)
- `AUTH_RATE_LIMIT_MAX`: Máximo de intentos por ventana en `/api/v1/auth` (por defecto 100 en dev, 25 en prod)
- `DISABLE_AUTH_RATE_LIMIT`: `true` para desactivar rate limit de auth (solo recomendado en testing local)

## Endpoints (FASE 1 Completa ✅)

### Auth

- `POST /api/v1/auth/register` — Registrar usuario (Firebase token requerido)
- `GET /api/v1/auth/me` — Get perfil actual (protegido)
- `PUT /api/v1/auth/profile` — Actualizar perfil (protegido)

### Fichas (Time Tracking)

- `POST /api/v1/fichas` — Crear nueva entrada de tiempo
- `GET /api/v1/fichas` — Listar fichas con filtros (dateRange, status, limit, offset)
- `GET /api/v1/fichas/:id` — Obtener ficha específica
- `PUT /api/v1/fichas/:id` — Actualizar ficha (endTime, status, description, etc.)
- `DELETE /api/v1/fichas/:id` — Archivar ficha (soft delete)
- `GET /api/v1/fichas/stats/daily` — Estadísticas diarias de horas

### General

- `GET /health` — Health check
- `GET /status` — Estado de la API + BD

📖 **Ver [FICHAS_API.md](./FICHAS_API.md) para ejemplos completos de cURL**

## Deploy a Google Cloud Run

### Opcion recomendada: Cloud Build

Se incluye [cloudbuild.yaml](cloudbuild.yaml) para build + push + deploy a Cloud Run.

```bash
# Ejecutar pipeline de Cloud Build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _REGION=europe-west1,_SERVICE_NAME=tempos-api,_FIREBASE_PROJECT_ID=tempos-app,_DATABASE_SECRET=tempos-database-url,_CLOUD_SQL_INSTANCE=PROJECT_ID:REGION:INSTANCE
```

Si todavia no tienes Secret Manager o Cloud SQL conectados, puedes dejar
`_DATABASE_SECRET=REPLACE_ME` y `_CLOUD_SQL_INSTANCE=REPLACE_ME` para desplegar
sin esos flags y completar despues.

### Opcion manual

```bash
# 1. Build imagen
docker build -t gcr.io/tempos-app/api:latest .

# 2. Push a Container Registry
docker push gcr.io/tempos-app/api:latest

# 3. Deploy en Cloud Run
gcloud run deploy tempos-api \
  --image gcr.io/tempos-app/api:latest \
  --platform managed \
  --region europe-west1 \
  --environment-variables DATABASE_URL=$CLOUD_SQL_URL \
  --set-cloudsql-instances PROJECT_ID:REGION:INSTANCE \
  --allow-unauthenticated
```

O usar Cloud Build trigger directamente en GitHub.

## Testing

```bash
# Registrar usuario (con token de Firebase)
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json"

# Get perfil
curl -X GET http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"

# Health check
curl http://localhost:8080/health
```

---

**Proxima fase sugerida:** Integracion Frontend ↔ Backend + Firebase real + tests E2E
