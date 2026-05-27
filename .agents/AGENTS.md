# AGENTS.md — Tempos Project

## Descripción
**Tempos** es un SaaS de control horario legal para pymes y autónomos en España (RD 8/2019). Stack actual: **Node.js (Express) + React + PostgreSQL**.

## Stack Tecnológico

### Frontend
- **Framework**: React 18 + Vite 7
- **Estilos**: TailwindCSS 3.x + Vanilla CSS (Aesthetics Premium)
- **Validación**: Zod (Obligatorio para entradas de API)
- **Router**: React Router DOM 6
- **Animaciones**: Framer Motion
- **Firebase**: Autenticación y Hosting

### Backend
- **Framework**: Node.js + Express
- **Lenguaje**: TypeScript (compilado a ESM)
- **ORM**: TypeORM + PostgreSQL
- **Auth**: Firebase Admin SDK + JWT Middleware
- **Puerto**: 8081 (Sincronización obligatoria)
- **Validación**: Zod (Schemas compartidos o espejo)

## Estructura del Proyecto

```
Tempos/
├── .agents/
│   ├── AGENTS.md                ← Este archivo (Fuente de verdad)
│   └── workflows/               ← dev.md, build.md, hardening.md
├── Frontend/                    ← React + Vite
│   ├── src/
│   │   ├── components/          ← UI Premium (Glassmorphism, Dark Mode)
│   │   ├── pages/               ← AuthPage, DashboardPage, TrialPage (Zod enabled)
│   │   ├── hooks/               ← useDashboardData, useAuth
│   │   └── lib/api.js           ← Cliente API centralizado
├── Backend/                     ← Node.js + Express
│   ├── src/
│   │   ├── controllers/         ← Lógica de negocio (auth.controller, etc.)
│   │   ├── middleware/          ← auth.middleware, request-context
│   │   ├── models/              ← Entidades TypeORM (User con Trial logic)
│   │   ├── scripts/             ← Mantenimiento (ESM compatible, .js imports)
│   │   └── index.ts             ← Punto de entrada (Puerto 8081)
└── docs/                        ← Documentación técnica y legal
```

## Reglas de Código Críticas (AGENTS.md) — ZERO TOLERANCIA

1. **Análisis Post-Edición**: Después de cada cambio, lectura completa del área afectada para asegurar integridad.
2. **Build Obligatorio (ZERO TOLERANCIA)**: Tras CADA cambio, ejecutar `npm run build` en el frontend. NO se aceptan errores NI warnings. Si el build falla, el cambio no está completo. No hay excepciones.
3. **Sincronización de Puertos**: El backend SIEMPRE corre en el puerto **8081**.
4. **Validación de Datos**: Usar SIEMPRE **Zod** para validar entradas de API en el frontend.
5. **Estilo Visual Premium**: Mantener Dark Mode, Framer Motion, Glassmorphism y estética de alto nivel.
6. **ESM Compatibility**: En el Backend, los imports de archivos locales deben incluir la extensión `.js` para compatibilidad con el entorno de ejecución Node.js (ESM).
7. **Orden de Declaraciones (React)**: Las `const` en componentes React NO se hoistean. Estados declarados después de useMemo/useCallback que los referencian causan `ReferenceError`. Mantener orden descendente: estados primero, derivados después.
8. **Imports sin usar**: Después de refactorizar componentes, verificar y limpiar imports muertos. Cero imports fantasmas.

## Gestión de Periodo de Prueba (Trial)
- Duración: 14 días desde el registro.
- Campos en User: `isTrial`, `trialExpiresAt`, `isTrialExpired`.
- Banner visible en Dashboard si `isTrial && !isTrialExpired`.

---
*Última actualización: 2026-05-16*
