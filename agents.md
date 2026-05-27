# Instrucciones Críticas para Agentes de IA (Antigravity)

1.  **Análisis Post-Edición**: Después de cada cambio en cualquier archivo, el agente DEBE realizar una lectura completa del área afectada para asegurar:
    *   Que no se han eliminado funciones o bloques de código necesarios accidentalmente.
    *   Que no quedan referencias (`refs`) o variables declaradas que ya no se usan.
    *   Que la sintaxis y los cierres de etiquetas (`</div>`, `}`, etc.) son correctos.
2.  **Validación Técnica Obligatoria (ZERO TOLERANCIA)**: Tras CADA cambio, el agente DEBE ejecutar `npm run build` en el frontend para confirmar que NO existen errores NI warnings. Si el build falla o produce warnings, el cambio NO está completo hasta que se corrija. No hay excusas ni excepciones. No basta con lint.
3.  **Sincronización de Puertos**: El backend siempre corre en el puerto **8081**. Nunca usar el 8080 en documentación o scripts.
4.  **Validación de Datos**: Usar siempre **Zod** para validar entradas de API en el frontend.
5.  **Estilo Visual**: Mantener siempre la estética premium (Dark Mode, Framer Motion, Glassmorphism).
6.  **Orden de Declaraciones (React)**: Las variables `const` en componentes React NO se hoistean. Cualquier `useMemo` o `useCallback` que referencie un estado debe declararse DESPUÉS de ese estado. Errores de `Cannot access X before initialization` son inaceptables.
7.  **Imports Muertos**: Después de editar componentes, verificar que no queden imports sin usar. Si un componente se refactoriza o se mueve, limpiar los imports del archivo origen.

---
*Última actualización: 2026-05-26*
