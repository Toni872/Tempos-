---
description: Workflow unico para endurecer frontend en escalabilidad y calidad
---

# Frontend Hardening Workflow

## Orden recomendado
1. `frontend-architecture-agent`
2. `frontend-performance-agent`
3. `frontend-quality-agent`

## Cadencia
- Ejecutar el flujo por cada bloque grande de cambios.
- Cerrar cada iteracion con `npm run build`.
- Si hay regresiones visuales en la landing, detener y corregir antes de continuar.

## Resultado esperado
- App mas modular.
- Mejor rendimiento percibido.
- Menor deuda tecnica y mejor preparacion para produccion.
