
const PrivacyPolicy = () => {
  return (
    <div className="tp-marketing tp-marketing--legal" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="tp-marketing__container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>Política de Privacidad</h1>
        <p className="tp-marketing__last-update" style={{ color: 'var(--t2)', marginBottom: '3rem' }}>Última actualización: 11 de abril de 2026</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>1. Información del Responsable del Tratamiento</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), se informa a los usuarios que el responsable del tratamiento de los datos personales recopilados a través de la aplicación "Tempos" es <strong>Antonio Lloret Sánchez</strong>.
            <br /><br />
            Para cuestiones relacionadas con el tratamiento de datos personales, puede contactar a través del correo electrónico: soporte@tempos.es
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>2. Finalidad del Tratamiento</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            La finalidad principal de Tempos es proveer un servicio de <strong>registro de la jornada laboral</strong> para empresas y profesionales, permitiéndoles cumplir con las obligaciones establecidas en el Real Decreto-ley 8/2019 y el artículo 34.9 del Estatuto de los Trabajadores en España.
            <br /><br />
            Los datos se recogen con los siguientes fines:
          </p>
          <ul style={{ color: 'var(--t1)', lineHeight: '1.6', marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Gestionar el registro horario diario de los trabajadores (entradas, salidas, ausencias y descansos).</li>
            <li>Garantizar la trazabilidad e inmutabilidad de los datos ante posibles inspecciones de la Inspección de Trabajo y Seguridad Social.</li>
            <li>Gestionar las cuentas de usuario y la provisión del servicio SaaS (Software as a Service).</li>
            <li>Enviar notificaciones operativas relacionadas estrictamente con el servicio.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>3. Base Legitimadora</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            Para el tratamiento de datos de los <strong>trabajadores</strong>, la base legal es el <strong>cumplimiento de una obligación legal</strong> por parte del empleador (Art. 6.1.c RGPD), en relación con el artículo 34.9 del Estatuto de los Trabajadores.
            <br /><br />
            En estos casos, Antonio Lloret Sánchez actúa como <strong>Encargado del Tratamiento</strong>, bajo las instrucciones de la empresa cliente, que actúa como Responsable del Tratamiento.
            <br /><br />
            Para el tratamiento de datos de los <strong>clientes/empresas</strong> (datos de contacto, facturación), la base legal es la <strong>ejecución de un contrato</strong> (Art. 6.1.b RGPD).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>4. Conservación de los Datos</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            De acuerdo con la legislación laboral española vigente, los registros de jornada deberán conservarse durante un periodo mínimo de <strong>cuatro (4) años</strong>. Durante este tiempo, los datos permanecerán a disposición de las personas trabajadoras, de sus representantes legales y de la Inspección de Trabajo y Seguridad Social.
            <br /><br />
            Los datos de facturación de clientes se conservarán durante el tiempo necesario para cumplir las obligaciones legales tributarias.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>5. Destinatarios y Transferencias de Datos</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            Los datos personales no serán cedidos a terceros, salvo obligación legal expresa (informes requeridos por la Inspección de Trabajo). Para el alojamiento de la plataforma, se utilizan servicios de infraestructura en la nube (Google Cloud Platform y Supabase) ubicados dentro del Espacio Económico Europeo (EEE), garantizando niveles óptimos de seguridad.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>6. Ejercicio de Derechos</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            Cualquier usuario puede ejercer sus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad u oposición, enviando un correo electrónico a soporte@tempos.es adjuntando prueba de identidad.
            <br /><br />
            En el caso de los trabajadores, puesto que el servicio registra la jornada laboral por imperativo legal, el derecho de supresión u oposición estará limitado por los plazos de retención obligatorios del artículo 34.9 del Estatuto de los Trabajadores. Asimismo, tienen derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>7. Medidas de Seguridad</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            Antonio Lloret Sánchez aplica medidas organizativas y técnicas de seguridad avanzadas. Tempos utiliza cifrado en tránsito (SSL/TLS) y en reposo, un sistema inmutable de auditoría de cambios (Audit Trail) que documenta quién modifica un registro y cuándo, y un aislamiento estricto por tenant (empresa) para impedir fugas de información.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
