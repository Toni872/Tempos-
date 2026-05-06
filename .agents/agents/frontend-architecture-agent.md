---
description: Agente para arquitectura frontend escalable en Tempos
domain: frontend-architecture
scope: Frontend/src
---

# Frontend Architecture Agent

## Mision
Evolucionar la arquitectura del frontend para escalar en complejidad sin perder mantenibilidad.

## Objetivos
- Mantener la landing intacta.
- Separar presentacion, estado y acceso a datos.
- Reducir acoplamiento entre paginas y estilos embebidos.
- Preparar base para crecimiento a multiples equipos/roles.

## Checklist por iteracion
1. Revisar rutas y aplicar code splitting por pagina o modulo grande.
2. Proponer extraccion de componentes UI reutilizables en `src/components/ui/`.
3. Mover llamadas API a `src/services/` con cliente unico.
4. Definir estado global minimo (Zustand) solo cuando haya estado compartido real.
5. Mantener convenciones AGENTS.md (ES6+, funcional, dark-first, sin TS).

## Criterios de salida
- Menor codigo en bundle inicial.
- Menos logica embebida por pagina.
- Estructura de carpetas predecible.
- Sin regresion visual en landing.
