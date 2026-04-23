# Playbook: Simulación de Inspección de Trabajo

Esta guía está diseñada para los *Administradores o Responsables de RRHH* de empresas clientes. El objetivo es saber reaccionar instantáneamente y con aplomo cuando un Inspector Laboral (ITSS) se presenta o requiere telemáticamente un extracto del registro de jornada.

## Escenario
**Requerimiento del Inspector:** "Demuéstreme el registro horario del empleado X a fecha del lunes pasado y la jornada general de este departamento".

### Paso 1: Exportación Inmediata (Panel Informes)
Tempos está pensado para un volcado un-click. 
1. Loguéate al panel y muévete directamente a la pestaña **Informes**.
2. Dale a **Exportar Auditoría PDF**. Esto es crucial porque los inspectores a menudo desean un soporte estático ("congelado en el tiempo"), inalterable y sellado en el momento actual para que no les sirvas un Excel manipulable horas después.
3. Descarga el CSV secundario, llamado `Exportar Auditoria CSV`, y envíalo en adjunto al inspector para que puedan pasarlo por sus macros automáticas del MTIN si lo desean.

### Paso 2: Mostrar el Audit-Log ante Interrogatorios ("Por qué este señor de baja aparece trabajando ayer")
Si el inspector, al revisar la base bruta de Tempos detecta una anomalía y pide explicaciones sobre por qué hay modificaciones en horas pasadas para un grupo de trabajadores que, según contrato, estaban en remoto o ausentes.

1. Abre directamente **el panel administrativo de esa persona y enséñale el Historial Inalterable (Audit-Trail)**.
2. Tempos guarda una línea inmutable cuando hubo correcciones (Ej: "Olvidó fichar por la mañana").
3. Todo cambio mostrará la **latitud, longitud, dirección IP, usuario que lo revisó y el motivo legal adjunto al momento de corregir**.

### Paso 3: Retención de Ex-empleados ("Quiero ver la jornada de la chica a la que despidieron el año pasado")
El inspector pide información a tres (3) años vista. El RDL 8/2019 te obliga a guardarlo durante cuatro (4).
1. En Tempos un empleado jamás se "borra", sino que se **Archiva o Desactiva** (`Status: Deleted` en Tempos DB, que en realidad es un `Soft-Delete`).
2. Así que vete tranquilamente al filtro de Fechas de Hace 3 años, busca por UID o Correo Antiguo y dale al botón de exportar la base histórica de ese trabajador que fue dado de baja de alta empresa. Sus datos de hace 3 años no han sido vulnerados.

## Consejos Finales:
- Una gran parte de lidiar con inspecciones es **la diligencia y velocidad** de acceder al dato. Tardar "horas" en generar en Excel el archivo hace presumir al inspector que estás inventándotelo (Falsedad Documental). Un click ante él despeja sus sospechas y reduce masivamente la vía punitiva.
