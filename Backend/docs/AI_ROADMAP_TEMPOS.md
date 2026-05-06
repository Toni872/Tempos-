# Tempos - Roadmap IA Ejecutable

Fecha: 2026-04-01
Base de analisis: stack Tempos + capacidades de gentle-ai-main

## Objetivo

Integrar IA en Tempos de forma incremental, con entregables verificables, sin romper operacion ni seguridad.

## Fase A - Datos y trazabilidad (fundacion)

Duracion estimada: 1 semana

Entregables:
1. Definicion de dataset para fichajes y ausencias.
2. Pipeline de exportacion a GCS estable.
3. Esquema de features versionado.
4. Criterios de calidad de datos (nulos, duplicados, drift basico).

Criterio de salida:
- Dataset reproducible en GCS listo para entrenamiento.

## Fase B - Deteccion de anomalias (primer caso de negocio)

Duracion estimada: 1-2 semanas

Entregables:
1. Modelo baseline en Vertex AI para detectar fichajes atipicos.
2. Endpoint interno en backend para inferencia (modo shadow inicialmente).
3. Tablero de precision basica y falsos positivos.

Criterio de salida:
- Modelo con metrica acordada y latencia aceptable.

## Fase C - Prediccion de ausencias

Duracion estimada: 1-2 semanas

Entregables:
1. Modelo de clasificacion de riesgo de ausencia.
2. Feature store simple (o tabla consolidada de features).
3. Reporte semanal de rendimiento del modelo.

Criterio de salida:
- Prediccion util para operacion RRHH sin sobrealertas.

## Fase D - Operacion MLOps

Duracion estimada: 1 semana

Entregables:
1. Retraining programado (ya iniciado con Scheduler + Worker).
2. Monitoreo de errores y drift.
3. Procedimiento de rollback de modelo.
4. Playbook de incidentes IA.

Criterio de salida:
- Flujo de entrenamiento y despliegue controlado de extremo a extremo.

## Fase E - Asistente operativo (opcional)

Duracion estimada: 1-2 semanas

Entregables:
1. Asistente interno para consultas de fichajes e incidencias.
2. Controles de seguridad y trazabilidad de prompts/respuestas.
3. Politica de uso y límites por rol.

Criterio de salida:
- Asistente util y seguro para soporte operativo.

## Integracion con gentle-ai-main (enfoque)

1. Usar disciplina SDD por fases para cada feature IA.
2. Aplicar verificacion y checklist de calidad antes de merge.
3. Mantener artefactos de decision y operacion en docs de repo.
4. Medir cada fase con KPI tecnico y KPI de negocio.

## KPI minimos sugeridos

- Tecnicos:
  - Latencia inferencia p95.
  - Tasa de error del servicio IA.
  - Exito de jobs de retraining.
- Negocio:
  - Reduccion de incidencias no detectadas.
  - Precision de alertas operativas.
  - Tiempo de respuesta de gestion RRHH.

## Riesgos y mitigaciones

1. Datos incompletos -> validaciones de calidad previas al entrenamiento.
2. Sobrealerta de anomalias -> umbrales calibrados y modo shadow inicial.
3. Coste de entrenamiento -> cron de retraining y ventanas de ejecucion controladas.
4. Deriva de modelo -> monitoreo y rollback operativo.

## Secuencia de ejecucion recomendada (sin bifurcar)

1. Completar pendientes manuales de hardening.
2. Ejecutar Fase A.
3. Ejecutar Fase B en modo shadow.
4. Pasar a Fase C solo tras estabilizar Fase B.
5. Consolidar Fase D antes de ampliar funcionalidades.
