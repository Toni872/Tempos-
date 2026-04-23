import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const PHONE_REGEX = /^[+]?[(]?[0-9\s-]{6,20}$/;
const TRIAL_FIELD_IDS = {
  company: 'trial-company',
  phone: 'trial-phone',
  firstName: 'trial-firstName',
  lastName: 'trial-lastName',
  email: 'trial-email',
  acceptedPrivacy: 'trial-acceptedPrivacy'
};

const TRIAL_INPUT_BASE_STYLE = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--bg2)',
  border: '1px solid var(--border)',
  color: 'var(--t0)',
  outline: 'none',
  fontSize: 14,
  fontFamily: 'var(--ff-body)',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

function getTrialInputStyle(hasError) {
  return {
    ...TRIAL_INPUT_BASE_STYLE,
    border: hasError ? '1px solid #ef4444' : TRIAL_INPUT_BASE_STYLE.border,
    boxShadow: hasError ? '0 0 0 1px rgba(239,68,68,0.35)' : 'none'
  };
}

function ErrorText({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" aria-live="polite" style={{ marginTop: 6, fontSize: 12.5, color: '#ef4444', fontWeight: 500 }}>
      {message}
    </p>
  );
}

export default function TrialPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    acceptedPrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formError) {
      setFormError('');
    }

    setErrors(prev => {
      if (!prev[name]) {
        return prev;
      }

      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};
    const emailValue = formData.email.trim();

    if (!formData.company.trim()) {
      nextErrors.company = 'El nombre de la empresa es obligatorio.';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'El teléfono de contacto es obligatorio.';
    } else if (!PHONE_REGEX.test(formData.phone.trim())) {
      nextErrors.phone = 'Introduce un teléfono válido.';
    }
    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'El nombre es obligatorio.';
    }
    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Los apellidos son obligatorios.';
    }
    if (!emailValue) {
      nextErrors.email = 'El email profesional es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      nextErrors.email = 'Introduce un email profesional válido.';
    }
    if (!formData.acceptedPrivacy) {
      nextErrors.acceptedPrivacy = 'Debes aceptar la política de privacidad para continuar.';
    }

    return nextErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('Revisa los campos marcados para continuar.');

      const firstFieldWithError = Object.keys(TRIAL_FIELD_IDS).find((field) => nextErrors[field]);
      if (firstFieldWithError) {
        requestAnimationFrame(() => {
          const el = document.getElementById(TRIAL_FIELD_IDS[firstFieldWithError]);
          if (el) {
            el.focus();
          }
        });
      }
      return;
    }

    setErrors({});
    setFormError('');
    setIsSubmitting(true);

    navigate('/register', { state: { trial: true, email: formData.email.trim(), company: formData.company.trim() } });
  };

  return (
    <div style={{ background: 'var(--bg0)', color: 'var(--t0)', minHeight: '100vh', fontFamily: 'var(--ff-body)', overflowX: 'hidden' }}>
      {/* Header Simplificado */}
      <header style={{ height: 100, display: 'flex', alignItems: 'center', padding: '0 4.5%', background: 'linear-gradient(to bottom, rgba(20,20,20,0.8), transparent)', position: 'absolute', width: '100%', zIndex: 10 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--mg)" strokeWidth="2.5" opacity="0.2"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--mg)" strokeWidth="2.8"/>
            <circle cx="50" cy="12" r="2.2" fill="var(--mg)"/>
            <circle cx="88" cy="50" r="2.2" fill="var(--mg)"/>
            <circle cx="50" cy="88" r="2.2" fill="var(--mg)"/>
            <circle cx="12" cy="50" r="2.2" fill="var(--mg)"/>
            <line x1="50" y1="50" x2="50" y2="28" stroke="var(--mg)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
            <line x1="50" y1="50" x2="68" y2="44" stroke="var(--mg)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
            <circle cx="50" cy="50" r="3.5" fill="var(--mg)"/>
          </svg>
          <span style={{ fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: 32, letterSpacing: 1.5, color: '#fff' }}>TEM<span style={{ color: 'var(--mg)' }}>POS</span></span>
        </Link>
      </header>

      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 100 }}>
        {/* Lado Izquierdo: Formulario */}
        <div style={{ flex: 1, padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: 500 }}>
            <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 44, fontWeight: 600, letterSpacing: -1, marginBottom: 20 }}>Solicita tu prueba gratis de 7 días</h1>
            <p style={{ color: 'var(--t1)', fontSize: 16, lineHeight: 1.6, marginBottom: 40 }}>
              Experimenta el futuro del control horario sin compromiso. Únete a la élite empresarial que ya optimiza su gestión de personal con Tempos. 7 días de acceso total para transformar tu cumplimiento legal en una ventaja competitiva de alto rendimiento.
            </p>

            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {!!formError && (
                <div role="alert" aria-live="assertive" style={{ borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fecaca', fontSize: 13, padding: '10px 12px', fontWeight: 500 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Empresa*</label>
                  <input id={TRIAL_FIELD_IDS.company} name="company" value={formData.company} onChange={handleChange} type="text" autoComplete="organization" aria-invalid={!!errors.company} aria-describedby={errors.company ? 'trial-company-error' : undefined} style={getTrialInputStyle(!!errors.company)} placeholder="Tu empresa S.L." />
                  <ErrorText id="trial-company-error" message={errors.company} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Teléfono contacto*</label>
                  <input id={TRIAL_FIELD_IDS.phone} name="phone" value={formData.phone} onChange={handleChange} type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'trial-phone-error' : undefined} style={getTrialInputStyle(!!errors.phone)} placeholder="+34 600 000 000" />
                  <ErrorText id="trial-phone-error" message={errors.phone} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Nombre*</label>
                  <input id={TRIAL_FIELD_IDS.firstName} name="firstName" value={formData.firstName} onChange={handleChange} type="text" autoComplete="given-name" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? 'trial-firstName-error' : undefined} style={getTrialInputStyle(!!errors.firstName)} placeholder="Jane" />
                  <ErrorText id="trial-firstName-error" message={errors.firstName} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Apellidos*</label>
                  <input id={TRIAL_FIELD_IDS.lastName} name="lastName" value={formData.lastName} onChange={handleChange} type="text" autoComplete="family-name" aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? 'trial-lastName-error' : undefined} style={getTrialInputStyle(!!errors.lastName)} placeholder="Doe" />
                  <ErrorText id="trial-lastName-error" message={errors.lastName} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 8 }}>Email profesional*</label>
                <input id={TRIAL_FIELD_IDS.email} name="email" value={formData.email} onChange={handleChange} type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'trial-email-error' : undefined} style={getTrialInputStyle(!!errors.email)} placeholder="nombre@empresa.com" />
                <ErrorText id="trial-email-error" message={errors.email} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <input id={TRIAL_FIELD_IDS.acceptedPrivacy} type="checkbox" name="acceptedPrivacy" checked={formData.acceptedPrivacy} onChange={handleChange} aria-invalid={!!errors.acceptedPrivacy} aria-describedby={errors.acceptedPrivacy ? 'trial-privacy-error' : undefined} style={{ width: 18, height: 18, accentColor: 'var(--mg)', cursor: 'pointer' }} />
                <label htmlFor="privacy" style={{ fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                  He leído y acepto la <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--mg)', textDecoration: 'none' }}>Política de Privacidad</a>
                </label>
              </div>
              <ErrorText id="trial-privacy-error" message={errors.acceptedPrivacy} />

              <button
                type="submit"
                className="tp-btn tp-btn-primary"
                disabled={isSubmitting}
                style={{ padding: '16px', borderRadius: 12, fontSize: 16, marginTop: 10, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Procesando...' : 'Empezar mi prueba gratuita'}
              </button>
            </form>
          </div>
        </div>

        {/* Lado Derecho: Contenido Persuasivo */}
        <div style={{ flex: 1, background: 'var(--bg1)', padding: '60px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 600, marginBottom: 24 }}>¿Por qué elegir Tempos?</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <FeatureItem title="Fichaje sin fricciones" desc="Facilita el fichaje a tus empleados desde app móvil o QR, eliminando errores y pérdidas de tiempo." />
              <FeatureItem title="Cumplimiento Legal Total" desc="Genera informes auditables en segundos, cumpliendo rigurosamente con la ley de control horario." />
              <FeatureItem title="Ahorro en Infraestructura" desc="Sin terminales físicos costosos. Una solución 100% digital que escala con tu negocio." />
              <FeatureItem title="Gestión Centralizada" desc="Controla horarios, ausencias y proyectos desde una intranet potente e intuitiva." />
            </div>

            <div style={{ marginTop: 60, padding: 24, borderRadius: 20, background: 'rgba(232,0,125,0.05)', border: '1px solid rgba(232,0,125,0.2)' }}>
              <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "Si no te convence Tempos, podrás dejar de utilizar la herramienta en cualquier momento, sin compromiso ni costes ocultos. Estamos aquí para ayudarte a crecer."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--mg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</h4>
        <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}
