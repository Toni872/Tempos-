# Frontend Best Practices y Stack Recomendado (Tempos)

Fecha: 2026-03-22
Alcance: Frontend React (fase actual)

## Fuentes consultadas
- React docs (`lazy`, `Suspense`)
- Vite docs (`features`, `build`)
- Tailwind v3 docs (`optimizing for production`)
- MDN (`lazy loading`)

## Stack recomendado (frontend-only)

### Mantener ahora
- React 18 + Vite 5
- React Router DOM 6
- TailwindCSS 3

### Añadir en siguiente fase (escalabilidad)
1. Estado remoto:
- TanStack Query para cache, retries y sincronizacion de datos API.

2. Estado cliente compartido:
- Zustand para estado UI/global liviano (session UI, filtros, preferencias).

3. Capa API:
- `src/services/httpClient.js` (fetch o axios) con interceptores, timeout, manejo de errores y refresh token.

4. Validacion de formularios:
- React Hook Form + Zod (validaciones consistentes login/register/trial).

5. Calidad y testing:
- ESLint + Prettier.
- Vitest + Testing Library (unit/component).
- Playwright (flujos E2E criticos).

## Practicas clave para este proyecto
1. Code splitting por rutas y modulos pesados.
2. Mantener landing aislada y sin simplificaciones.
3. Evitar `console.log` en produccion.
4. Mover logica de negocio fuera de paginas a hooks/services.
5. Mantener rutas y componentes con carga perezosa y fallbacks de UX.
6. Revisar accesibilidad base en formularios y navegacion por teclado.

## Hallazgos del estado actual
- Router principal ya tiene lazy loading base en rutas no-landing.
- `DashboardPage` sigue siendo el chunk mas grande del frontend; conviene dividir en componentes y lazy internos.
- Build actual compila correctamente en produccion.

## Siguiente iteracion sugerida
1. Extraer componentes del dashboard (`StatsCards`, `ClockPanel`, `TeamTable`, `ChartsSection`).
2. Introducir `services/` + contratos de API mockables.
3. Integrar TanStack Query para datos de dashboard y fichajes.
4. Agregar test E2E basico: login -> dashboard -> clock in/out.
