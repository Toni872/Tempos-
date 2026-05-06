# Instrucciones Críticas para Agentes de IA (Antigravity)

1.  **Análisis Post-Edición**: Después de cada cambio en cualquier archivo, el agente DEBE realizar una lectura completa del área afectada para asegurar:
    *   Que no se han eliminado funciones o bloques de código necesarios accidentalmente.
    *   Que no quedan referencias (`refs`) o variables declaradas que ya no se usan.
    *   Que la sintaxis y los cierres de etiquetas (`</div>`, `}`, etc.) son correctos.
2.  **Validación Técnica Obligatoria**: Tras editar un archivo, el agente DEBE ejecutar un comando de validación (ej. `npm run lint`, `npx eslint [archivo]` o un check de tipos) para confirmar que no existen errores ni advertencias (warnings) en rojo. No basta con la lectura visual.
3.  **Sincronización de Puertos**: El backend siempre corre en el puerto **8081**. Nunca usar el 8080 en documentación o scripts.
3.  **Validación de Datos**: Usar siempre **Zod** para validar entradas de API en el frontend.
4.  **Estilo Visual**: Mantener siempre la estética premium (Dark Mode, Framer Motion, Glassmorphism).

---
*Última actualización: 2026-05-05*
