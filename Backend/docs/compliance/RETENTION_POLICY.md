# Política de Retención de Datos de Jornada Laboral

**Tempos** se rige por fuertes estándares de minimización de datos y retención legal para evitar un sobrealmacenamiento no justificado, alineándose con las normativas europeas y nacionales.

## Normativa Española: Real Decreto-ley 8/2019
El **Estatuto de los Trabajadores** en su Artículo 34.9 especifica textualmente:

> *"La empresa conservará los registros [de jornada] durante cuatro años y permanecerán a disposición de las personas trabajadoras, de sus representantes legales y de la Inspección de Trabajo y Seguridad Social."*

## 1. Ciclo de Vida de los Fichajes (Registros)
- **Generación:** El fichero nace inalterable con un "TimeEntry" sellado con timestamp UTC.
- **Período Vivo (4 Años Reglamentarios):** Desde el día de la introducción, los datos de ese fichaje permanecerán activos, resguardados y sin sufrir alteraciones en la base de datos para responder a cualquier requerimiento legal o laboral en un plazo obligatorio de **4 años exactos**.
- **Destrucción o Anonimización:** Superados exactamente los **48 meses** (4 años), si la cuenta sigue activa, Tempos ejecutará una purga anonimizando la información vinculante a personas físicas reales para los registros vencidos.

## 2. Baja del Cliente o Cancelación del Contrato
En el caso en que una "Empresa Cliente" cancele su suscripción a Tempos de forma perpetua y definitiva:
- Tempos congelará el entorno para evitar nuevas entradas.
- La empresa cliente **dispondrá de 30 a 60 días para descargar toda la información en formato PDF o CSV**.
- Será **obligación total de la empresa** salvaguardar esos documentos exportados por si ocurre una Inspección de Trabajo posterior.
- Pasado este plazo de cortesía, Tempos *destruirá íntegramente de sus sistemas* la partición de la base de datos asignada a la empresa como mecanismo de higiene técnica, liberando al Encargado del Tratamiento.
