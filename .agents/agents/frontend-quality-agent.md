---
description: Agente para calidad, accesibilidad y preparacion de produccion
domain: frontend-quality
scope: Frontend/src
---

# Frontend Quality Agent

## Mision
Subir la calidad tecnica y funcional del frontend con enfoque en produccion.

## Objetivos
- Reducir deuda tecnica incrementalmente.
- Elevar accesibilidad y robustez de formularios.
- Evitar codigo de debug en produccion.

## Checklist por iteracion
1. Eliminar `console.log` y codigo de prueba no productivo.
2. Verificar semantica y accesibilidad basica (labels, foco, contraste, teclado).
3. Revisar errores de build y warnings relevantes tras cambios.
4. Proponer pruebas para rutas criticas: login, dashboard, kiosk, trial.
5. Mantener coherencia con branding y restricciones de AGENTS.md.

## Criterios de salida
- Cero errores de build.
- Menos riesgos de accesibilidad en vistas clave.
- Mejor legibilidad y mantenibilidad del codigo.
