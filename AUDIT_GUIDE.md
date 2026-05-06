# 🧠 Senior Dev Audit Guide
### Stack: FastAPI · React · PostgreSQL · Redis · Celery
> Guía de referencia para mantener proyectos en estado óptimo.  
> Úsala con Claude Code, revisiones de PR o auditorías periódicas.

---

## 1. ARQUITECTURA Y ESTRUCTURA

**Preguntas clave**
- ¿Cada capa (presentación, lógica de negocio, datos) tiene responsabilidades claras y no se mezclan?
- ¿La estructura de carpetas refleja los dominios del negocio, no solo la tecnología?
- ¿Hay dependencias circulares entre módulos?
- ¿El proyecto escala horizontalmente sin cambios de arquitectura mayores?

**Afirmaciones de estado óptimo**
- La lógica de negocio vive en servicios/use cases, no en endpoints ni en modelos ORM.
- Los endpoints de FastAPI son delgados: validan, delegan y devuelven.
- El frontend no tiene lógica de negocio hardcodeada que debería venir del backend.
- Existe un `AGENTS.md` o equivalente que cualquier desarrollador nuevo puede seguir.

---

## 2. BACKEND — FastAPI

**Preguntas clave**
- ¿Todos los endpoints tienen validación de inputs con Pydantic v2?
- ¿Los errores devuelven respuestas consistentes (mismo formato JSON en toda la API)?
- ¿Hay endpoints sin autenticación que deberían estar protegidos?
- ¿Los endpoints asíncronos usan `async/await` correctamente sin bloquear el event loop?
- ¿Las dependencias de FastAPI (`Depends`) se usan para inyectar sesiones de BD, usuarios autenticados, etc.?

**Afirmaciones de estado óptimo**
- Cada endpoint tiene su schema de request y response bien tipado con Pydantic.
- Los errores HTTP (400, 401, 403, 404, 422, 500) están manejados con `HTTPException` o exception handlers globales.
- Las operaciones bloqueantes (I/O, archivos) se ejecutan con `run_in_executor` o son verdaderamente async.
- Los routers están organizados por dominio en `api/v1/endpoints/`, no en un único archivo.
- La versión de la API está en la URL (`/api/v1/...`) desde el inicio.

---

## 3. BASE DE DATOS — PostgreSQL + SQLAlchemy 2.0

**Preguntas clave**
- ¿Hay queries N+1 ocultas en relaciones ORM sin `selectinload` o `joinedload`?
- ¿Las columnas más consultadas en WHERE y JOIN tienen índices definidos?
- ¿Las migraciones (Alembic) están versionadas y son reversibles (`downgrade`)?
- ¿Las transacciones están bien delimitadas? ¿Se hace commit/rollback donde corresponde?
- ¿Los campos sensibles (contraseñas, tokens) nunca se almacenan en texto plano?

**Afirmaciones de estado óptimo**
- Todas las queries críticas tienen `EXPLAIN ANALYZE` revisado al menos una vez.
- Los modelos SQLAlchemy usan tipos nativos de PostgreSQL donde aplica (`UUID`, `JSONB`, `TIMESTAMPTZ`).
- Las migraciones de Alembic nunca modifican datos de producción directamente — hay scripts separados para eso.
- El pool de conexiones está configurado correctamente (`pool_size`, `max_overflow`) según la carga esperada.
- Los soft deletes usan campo `deleted_at TIMESTAMPTZ` en lugar de borrar registros.

---

## 4. CACHÉ Y COLAS — Redis + Celery

**Preguntas clave**
- ¿Redis se usa para caché, sesiones y broker de Celery de forma diferenciada (bases de datos distintas)?
- ¿Las claves de caché tienen TTL definido? ¿Ninguna clave es eterna sin justificación?
- ¿Las tareas de Celery son idempotentes? (ejecutarlas dos veces no rompe nada)
- ¿Hay un mecanismo de retry con backoff exponencial en tareas críticas?
- ¿Los workers de Celery están monitorizados (Flower o equivalente)?

**Afirmaciones de estado óptimo**
- Los patrones de invalidación de caché están documentados y son predecibles.
- Las tareas Celery tienen timeout definido para evitar workers bloqueados indefinidamente.
- Las tareas de larga duración reportan progreso o estado consultable.
- El dead letter queue (cola de tareas fallidas) se revisa periódicamente.
- Redis tiene `maxmemory-policy` configurada para no crashear por memoria llena.

---

## 5. AUTENTICACIÓN Y SEGURIDAD

**Preguntas clave**
- ¿Los JWT tienen tiempo de expiración corto y existe refresh token rotation?
- ¿Los tokens se almacenan en `httpOnly cookies` en el frontend, no en `localStorage`?
- ¿Hay rate limiting en endpoints de login, registro y recuperación de contraseña?
- ¿El backend tiene CORS configurado con orígenes explícitos, no `*`?
- ¿Existe protección CSRF si se usan cookies?
- ¿Las dependencias tienen vulnerabilidades conocidas? (`pip audit`, `npm audit`)

**Afirmaciones de estado óptimo**
- Los secretos están en variables de entorno, nunca en el código o en el repositorio.
- El `.env` está en `.gitignore` y existe un `.env.example` actualizado.
- Los passwords se hashean con bcrypt o Argon2, nunca MD5 o SHA1 sin sal.
- Los logs nunca incluyen tokens, passwords ni datos personales.
- Las rutas protegidas del frontend redirigen al login si no hay sesión válida.

---

## 6. FRONTEND — React 18 + Vite 5

**Preguntas clave**
- ¿Las rutas del dashboard usan `React.lazy()` + `Suspense` para code splitting?
- ¿El estado global (Zustand) solo contiene lo que realmente necesita ser global?
- ¿Los efectos secundarios en `useEffect` tienen cleanup function donde aplica?
- ¿Hay re-renders innecesarios por falta de `useMemo`, `useCallback` o memoización?
- ¿Los formularios manejan correctamente los estados: loading, error, success?

**Afirmaciones de estado óptimo**
- Cero `console.log` en producción — solo en modo `development`.
- Los componentes tienen error boundaries en secciones críticas.
- Las llamadas API están centralizadas en `services/`, no dispersas en componentes.
- Los hooks personalizados en `hooks/` tienen un único propósito y son reutilizables.
- Las imágenes y assets están optimizados (WebP, lazy loading, tamaños correctos).

---

## 7. SISTEMA DE DISEÑO Y CSS

**Preguntas clave**
- ¿Hay colores o fuentes hardcodeados fuera del sistema de variables CSS?
- ¿Hay conflictos de especificidad entre TailwindCSS y CSS-in-JS?
- ¿Los breakpoints son consistentes en toda la app?
- ¿Las animaciones respetan `prefers-reduced-motion`?

**Afirmaciones de estado óptimo**
- Todos los colores de marca se referencian via variables CSS, nunca con valores directos.
- El sistema dark-first es consistente: ningún componente nuevo rompe el tema oscuro.
- Las fuentes se cargan con `font-display: swap` y tienen `preload` en el HTML.
- El Cumulative Layout Shift (CLS) es < 0.1 medido con Lighthouse.

---

## 8. RENDIMIENTO Y BUILD

**Preguntas clave**
- ¿El bundle de producción está analizado? (`vite-bundle-visualizer` o similar)
- ¿Hay dependencias pesadas que podrían importarse de forma lazy o sustituirse?
- ¿Los chunks están bien separados (vendor, app, páginas)?
- ¿El backend tiene profiling activado en staging para detectar endpoints lentos?

**Afirmaciones de estado óptimo**
- El bundle principal (initial JS) es < 200KB gzipped.
- Las imágenes críticas del above-the-fold tienen `loading="eager"` y las demás `lazy`.
- La API responde el P95 de requests en < 200ms para endpoints de lectura común.
- El backend tiene middleware de logging de tiempo de respuesta por endpoint.

---

## 9. TESTING

**Preguntas clave**
- ¿Los endpoints críticos tienen tests de integración con base de datos de test?
- ¿Hay tests para los casos límite: usuario no autorizado, datos inválidos, BD caída?
- ¿Los componentes React tienen tests de comportamiento, no de implementación?
- ¿El coverage no es una métrica de vanidad? (calidad > cantidad)

**Afirmaciones de estado óptimo**
- Los tests de FastAPI usan `TestClient` con una BD PostgreSQL de test (no mocks de BD).
- Las tareas Celery se testean de forma síncrona con `CELERY_TASK_ALWAYS_EAGER=True`.
- Los tests corren en CI en cada PR y un fallo bloquea el merge.
- Hay al menos un test E2E para el flujo crítico del negocio (registro → fichaje → reporte).

---

## 10. OPERACIONES Y PRODUCCIÓN

**Preguntas clave**
- ¿Hay health checks en `/health` o `/ping` para el balanceador de carga?
- ¿Los logs estructurados (JSON) van a un sistema centralizado?
- ¿Existe un runbook para los incidentes más probables?
- ¿Las migraciones de BD se ejecutan automáticamente en deploy o manualmente?

**Afirmaciones de estado óptimo**
- El servidor EU/ES está elegido y documentado (cumplimiento RGPD y RD 8/2019).
- Las variables de entorno de producción nunca coinciden con las de desarrollo.
- Hay alertas configuradas para: error rate > 1%, latencia P95 > 500ms, disco > 80%.
- El proceso de rollback de un deploy está documentado y testado.

---

## 🔁 FLUJO DE AUDITORÍA RECOMENDADO

```
Semanal  → Secciones 2, 3, 6 (backend, BD, frontend)
Mensual  → Secciones 5, 8, 9 (seguridad, rendimiento, testing)
Por PR   → Secciones 1, 7    (arquitectura, diseño)
Pre-deploy → Secciones 10    (operaciones)
```

---

## 📋 PROMPT MAESTRO PARA CLAUDE CODE

```
Audita el proyecto completo siguiendo estas prioridades:
1. Seguridad: secretos expuestos, endpoints sin auth, datos sensibles en logs
2. Correctitud: queries N+1, transacciones sin cerrar, tareas Celery no idempotentes
3. Rendimiento: bundle size, queries sin índice, bloqueos en async
4. Deuda técnica: violaciones de convenciones, console.logs, TODO sin ticket

No modifiques nada. Solo genera un informe priorizado con: problema, ubicación exacta y solución recomendada.
```

---

*Actualizar esta guía cuando cambie el stack o se añadan nuevas capas al sistema.*
