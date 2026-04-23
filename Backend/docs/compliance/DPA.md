# Data Processing Agreement (DPA) - Contrato de Encargado de Tratamiento

**Última actualización:** [FECHA]

El presente Acuerdo de Procesamiento de Datos (DPA) establece los términos, requisitos y condiciones bajo los cuales **Tempos (Control Horario)** ("Encargado del Tratamiento" o "Proveedor") procesará los datos personales en nombre de la **Empresa Cliente** ("Responsable del Tratamiento"), de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).

## 1. Objeto y Naturaleza del Tratamiento
Este acuerdo tiene como finalidad garantizar el correcto tratamiento de los datos personales requeridos obligatoriamente para cumplir con el **Real Decreto-ley 8/2019** sobre el registro diario de la jornada laboral y el **Art. 34.9 del Estatuto de los Trabajadores**.

- **Naturaleza del tratamiento:** Recopilación, registro, estructuración, conservación, extracción, consulta y supresión de datos de fichajes horarios de empleados.
- **Categoría de datos personales:** Datos identificativos (Nombre, Email), Datos de empleo (Puesto, DNI, UUID de Empleado), y Datos de seguimiento temporal/ubicación (IP, User Agent, Horarios, Geolocalización).
- **Categoría de interesados:** Empleados y colaboradores de la Empresa Cliente.

## 2. Obligaciones del Encargado del Tratamiento (Tempos)
Tempos se compromete de forma vinculante a:
1. Tratar los datos personales **únicamente siguiendo las instrucciones documentadas** del Responsable.
2. Garantizar que las personas autorizadas para tratar datos personales se hayan comprometido a respetar la **confidencialidad**.
3. Tomar todas las medidas de seguridad técnicas y organizativas conforme al **Artículo 32 del RGPD**.
4. No recurrir a otro encargado (Subencargado) sin autorización previa por escrito.
5. Asistir al Responsable, en la medida de lo posible, en la respuesta a las solicitudes de ejercicio de los **derechos ARCO** de los interesados.
6. Notificar al Responsable sin dilación indebida cualquier **violación de seguridad** de los datos personales (Incidente < 24h).
7. Al finalizar la prestación, a elección del Responsable, **suprimir o devolver** todos los datos personales, salvo que la ley exija su conservación.

## 3. Obligaciones del Responsable del Tratamiento (Empresa Cliente)
La Empresa Cliente reconoce que:
1. Posee la base de legitimación necesaria (ej. Ejecución de un contrato laboral u Obligación Legal Estatal) para recabar los datos de sus empleados.
2. Ha informado debidamente a sus empleados sobre la existencia, uso y funcionamiento del sistema Tempos.

## 4. Medidas de Seguridad y Auditoría
Tempos provee:
- Trazabilidad y logs inalterables que demuestran qué usuario y desde qué terminal ha introducido o modificado información.
- Encriptación en tránsito (HTTPS/TLS 1.2+) y en reposo (AES).
- Autenticación segura y autorización segmentada por inquilino (*Multi-tenant Isolation*).

El Responsable tendrá acceso, previa solicitud y justificación, a información suficiente para demostrar el cumplimiento del RGPD, permitiendo que un auditor debidamente autorizado lleve a cabo revisiones limitadas al entorno virtualizado.

## 5. Vigencia
Este DPA estará vigente mientras la Empresa Cliente mantenga una suscripción activa con Tempos o hasta que la totalidad de los datos alojados sean expurgados del sistema.
