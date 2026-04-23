
const TermsOfService = () => {
  return (
    <div className="tp-marketing tp-marketing--legal" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="tp-marketing__container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>Términos de Servicio</h1>
        <p className="tp-marketing__last-update" style={{ color: 'var(--t2)', marginBottom: '3rem' }}>Última actualización: 11 de abril de 2026</p>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>1. Aceptación de los Términos</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El presente documento establece las Condiciones Generales de Uso del software <strong>Tempos</strong> (en adelante, "el Software" o "el Servicio"), desarrollado y operado por <strong>Antonio Lloret Sánchez</strong> (en adelante, "el Proveedor").
            <br /><br />
            Al registrarse, acceder o utilizar el Servicio, el usuario persona física o jurídica (en adelante, "el Cliente" o "la Empresa") acepta quedar expresamente vinculado por los presentes Términos de Servicio.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>2. Descripción del Servicio</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            Tempos se proporciona bajo el modelo "Software as a Service" (SaaS). Ofrece una plataforma tecnológica para la gestión, registro y reporte de la jornada laboral de los empleados del Cliente, con el objetivo de facilitar a este último el cumplimiento del <strong>artículo 34.9 del Estatuto de los Trabajadores</strong> (Real Decreto-ley 8/2019 de España).
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>3. Responsabilidades del Cliente</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El Cliente es el único responsable de:
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Verificar la exactitud de los registros introducidos por sus empleados.</li>
              <li>Asegurar que el uso que hace de la herramienta cumple con los convenios colectivos aplicables a su sector.</li>
              <li>Informar debidamente a sus empleados sobre la implantación del sistema de control y el tratamiento de sus datos personales.</li>
              <li>Mantener la confidencialidad de las claves de acceso de administrador.</li>
            </ul>
             El Proveedor actúa únicamente como un mero proveedor del canal tecnológico.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>4. Acuerdo de Encargo de Tratamiento (DPA)</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            A los efectos de la normativa de Protección de Datos (RGPD y LOPDGDD), el Cliente ostenta la condición de <strong>Responsable del Tratamiento</strong> de los datos de sus empleados alojados en Tempos. Antonio Lloret Sánchez actuará exclusivamente como <strong>Encargado del Tratamiento</strong>.
            <br /><br />
            El Proveedor se compromete a tratar los datos siguiendo única y exclusivamente las instrucciones documentadas del Cliente, aplicando todas las medidas de seguridad exigibles, y obligándose a no utilizar dichos datos para ningún fin distinto a la prestación del Servicio. Al aceptar estos términos, se da por suscrito el Acuerdo de Encargo de Tratamiento entre las partes.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>5. Disponibilidad y Mantenimiento</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El Proveedor hará los mejores esfuerzos comerciales para garantizar un acceso ininterrumpido al Servicio (SLA del 99%). No obstante, el Cliente acepta que el acceso puede interrumpirse temporalmente por tareas de mantenimiento, actualizaciones de emergencia o causas de fuerza mayor. Se informará con antelación de las paradas programadas cuando sea viable.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>6. Limitación de Responsabilidad</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El Software se proporciona "tal cual". Antonio Lloret Sánchez <strong>declina expresamente cualquier responsabilidad</strong> frente a sanciones, multas administrativas, demandas laborales o indemnizaciones de cualquier tipo impuestas al Cliente por parte de la Inspección de Trabajo, Seguridad Social u órganos judiciales, que se deriven de:
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Falta de fichaje u omisiones por parte de los empleados.</li>
              <li>Modificaciones indebidas de los apuntes horarios realizadas por el administrador del Cliente.</li>
              <li>Cálculos incorrectos debido a la mala configuración de perfiles o turnos por parte del Cliente.</li>
            </ul>
            En todo caso, la responsabilidad máxima económica del Proveedor por reclamaciones directamente relacionadas con el Servicio quedará limitada a la cuantía abonada por el Cliente en los doce (12) meses previos al incidente.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>7. Pagos y Cancelación</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El uso de Tempos requiere el pago de una suscripción recurrente tras el periodo de prueba o la modalidad "Freemium" en su caso. El Cliente puede cancelar la suscripción en cualquier momento. La cancelación se hará efectiva al final del periodo de facturación en curso. A la terminación, el Cliente tendrá derecho a descargar un archivo en formato Excel/PDF con el histórico de registros de sus empleados. Tras 30 días post-cancelación, el Proveedor procederá al borrado irreversible de los datos en cumplimiento de la normativa.
          </p>
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--t0)' }}>8. Modificación de los Términos</h2>
          <p style={{ color: 'var(--t1)', lineHeight: '1.6' }}>
            El Proveedor se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones importantes se notificarán al Cliente con al menos 15 días de antelación. El uso continuado del Servicio constituirá la aceptación de los nuevos términos.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
