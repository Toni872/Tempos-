# Tempos - Arquitectura Técnica

## Resumen del Sistema
Tempos es una plataforma de control horario con un enfoque premium. Utiliza una arquitectura desacoplada con un Backend en Node.js y un Frontend en React, con integración nativa para dispositivos móviles mediante Capacitor (Android/iOS).

## Backend (Node.js + Express + TypeScript)
- **Puerto**: 8081.
- **Base de Datos**: PostgreSQL 16 (TypeORM).
- **Autenticación**: 
  - Basada en Firebase Auth.
  - El backend valida el token de Firebase mediante el `auth.middleware.ts`.
  - El endpoint `GET /api/v1/auth/me` es la fuente de verdad para el estado del usuario.
- **Lógica de Suscripción (Trial)**:
  - Los nuevos usuarios reciben 14 días de prueba automáticamente.
  - Campos clave en la entidad `User`: `isTrial`, `trialExpiresAt`.
  - El middleware calcula `isTrialExpired` en tiempo real comparando con la fecha actual.

## Frontend (React + Vite)
- **Validación**: Uso obligatorio de **Zod** para todos los formularios que interactúan con la API.
- **Comunicación**: `lib/api.js` centraliza todas las llamadas mediante `fetch`.
- **Estado Global**: Se intenta mantener el estado cerca de donde se usa o mediante hooks como `useDashboardData`.
- **UI/UX**: 
  - Diseño "Dark-First".
  - Componentes premium con Framer Motion para transiciones suaves.
  - Banner dinámico de Trial en `DashboardShell.jsx`.

## Infraestructura (GCP)
- **App Hosting**: Firebase Hosting.
- **API Hosting**: Cloud Run (Dockerized).
- **Secretos**: Google Secret Manager (`tempos-firebase-key-json`).
- **Tareas Programadas**: Cloud Scheduler lanza un job diario de retraining de IA mediante Pub/Sub.

## Flujo de Desarrollo (Reglas de Oro)
1. Los archivos `.ts` de scripts de backend deben importar archivos locales usando la extensión `.js` (ej: `import { ... } from './db.js'`).
2. No se suben claves ni secretos al repositorio (uso de `.env` y Secret Manager).
3. Todo cambio en el frontend debe ser validado con `npm run lint` o equivalente antes de darlo por finalizado.
