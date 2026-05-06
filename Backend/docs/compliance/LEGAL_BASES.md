# Bases Legales para Procesamiento de Datos - Tempos

## Introducción

De acuerdo con el Reglamento General de Protección de Datos (RGPD), el procesamiento de datos personales debe basarse en una de las seis bases legales establecidas en el artículo 6. Este documento establece las bases legales aplicables al procesamiento de datos en Tempos.

## Base Legal Principal: Artículo 6.1.b - Ejecución de un Contrato

### Descripción
El procesamiento de datos personales en Tempos se basa principalmente en el **Artículo 6.1.b del RGPD**, que permite el procesamiento cuando es "necesario para la ejecución de un contrato en el que el interesado es parte o para la aplicación a petición de este de medidas precontractuales".

### Aplicación en Tempos
- **Relación contractual**: Los empleados tienen una relación contractual con sus empleadores que requiere el registro preciso de horas trabajadas.
- **Obligación legal**: La legislación laboral española (Art. 34.9 ET, RDL 8/2019) impone la obligación de registrar jornadas laborales.
- **Necesidad del GPS**: La geolocalización es necesaria para verificar la presencia física en centros de trabajo autorizados.

### Datos Procesados bajo esta Base
- **Datos identificativos**: Nombre, email, ID empleado
- **Datos laborales**: Horarios, fechas de trabajo, ubicación GPS
- **Datos de control horario**: Timestamps, coordenadas geográficas, precisión GPS

## Base Legal Secundaria: Artículo 6.1.c - Cumplimiento de Obligación Legal

### Descripción
Complementariamente, se aplica el **Artículo 6.1.c** para aspectos relacionados con obligaciones legales de registro horario.

### Aplicación en Tempos
- **Registro obligatorio**: Cumplimiento con la legislación española sobre registro de jornada.
- **Auditorías laborales**: Posibilidad de inspecciones por parte de autoridades laborales.
- **Documentación legal**: Conservación de registros por 4 años según normativa.

## Base Legal para Geolocalización: Consentimiento (Artículo 6.1.a)

### Descripción
Para el procesamiento específico de datos de geolocalización, se requiere **consentimiento explícito** del usuario conforme al Artículo 6.1.a.

### Implementación del Consentimiento
- **Consentimiento explícito**: Diálogo claro y específico para GPS.
- **Información proporcionada**: Finalidad, almacenamiento, derechos del interesado.
- **Revocación posible**: Los usuarios pueden revocar consentimiento en cualquier momento.
- **Registro del consentimiento**: Se registra la fecha y hora del consentimiento.

### Información Proporcionada al Usuario
1. **Finalidad**: Verificación de presencia en centros de trabajo autorizados.
2. **Datos recopilados**: Coordenadas GPS con precisión necesaria.
3. **Base legal**: Artículo 6.1.b (contrato laboral) + Artículo 6.1.a (consentimiento).
4. **Almacenamiento**: Datos conservados por 4 años.
5. **Derechos**: Acceso, rectificación, supresión, portabilidad, oposición.

## Base Legal para Datos Sensibles

### Descripción
Los datos de geolocalización pueden considerarse datos sensibles en ciertos contextos. Se aplican medidas adicionales de protección.

### Medidas Implementadas
- **Encriptación**: Datos GPS encriptados en tránsito y reposo.
- **Acceso restringido**: Solo administradores autorizados pueden acceder.
- **Anonimización**: Posibilidad de anonimización para análisis agregados.
- **Auditoría**: Registro completo de accesos a datos GPS.

## Derechos de los Interesados (Artículos 15-22 RGPD)

### Implementación en Tempos
- **Derecho de acceso** (Art. 15): Endpoint `/api/v1/gdpr/access`
- **Derecho de rectificación** (Art. 16): Endpoint `/api/v1/gdpr/rectify`
- **Derecho de supresión** (Art. 17): Endpoint `/api/v1/gdpr/delete`
- **Derecho de portabilidad** (Art. 20): Endpoint `/api/v1/gdpr/export`
- **Derecho de oposición** (Art. 21): Endpoint `/api/v1/gdpr/restrict`

## Responsable del Tratamiento

- **Entidad**: Tempos
- **Contacto DPO**: dpo@tempos.com
- **Dirección**: España (UE)

## Actualización de Bases Legales

Este documento se revisará anualmente o cuando cambien los requisitos legales aplicables.

**Última actualización**: 19 de abril de 2026
**Versión**: 1.0