const PrivacyPolicy = () => {
  return (
    <div className="tp-marketing tp-marketing--legal" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="tp-marketing__container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>Política de Privacidad</h1>
        <p className="tp-marketing__last-update" style={{ color: 'var(--t2)', marginBottom: '3rem' }}>Última actualización: 11 de abril de 2026</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>1. Información del Responsable del Tratamiento</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), se informa que la marca comercial <strong>Script 9</strong>, de la cual es titular <strong>Antonio Lloret Sánchez</strong>, es la entidad proveedora de la plataforma "Tempos".
            <br /><br />
            Para cuestiones relacionadas con el tratamiento de datos personales, puede contactar con nuestro departamento legal a través del correo electrónico: <strong>legal@script-9.com</strong>
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>2. Finalidad del Tratamiento</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            La finalidad principal de Tempos es proveer un servicio de <strong>registro de la jornada laboral</strong> para empresas y profesionales, gestionado por la tecnología de Script 9, permitiéndoles cumplir con las obligaciones del Real Decreto-ley 8/2019.
            <br /><br />
            Los datos se recogen con los siguientes fines:
          </p>
          <ul style={{ color: 'var(--t1)', lineHeight: '1.6', marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Gestión del registro horario verificado por los sistemas de Script 9.</li>
            <li>Garantizar la inmutabilidad de los datos mediante protocolos de seguridad avanzada.</li>
            <li>Administración de la suscripción SaaS y soporte técnico.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>3. Base Legitimadora y Roles</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            En la prestación de este servicio, se establecen dos roles diferenciados:
            <br /><br />
            <strong>A. Script 9 como Encargado del Tratamiento:</strong> Respecto a los datos de los trabajadores registrados por las empresas clientes. Script 9 procesa estos datos únicamente siguiendo las instrucciones del cliente y con el fin de cumplir el registro de jornada.
            <br /><br />
            <strong>B. Script 9 como Responsable del Tratamiento:</strong> Respecto a los datos de contacto y facturación de sus propios clientes (empresas y autónomos) para la ejecución del contrato de servicio.
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
