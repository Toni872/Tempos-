import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { bootstrapLocalSession, getClientSession, registerMe, getMe, setClientSession } from '@/lib/api';
import { signInAndGetIdToken } from '@/lib/firebaseClient';

const MIN_PASSWORD_LENGTH = 8;
const AUTH_FIELD_IDS = {
  companyName: 'auth-companyName',
  name: 'auth-name',
  email: 'auth-email',
  password: 'auth-password'
};

const inputBaseStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--bg1)',
  border: '1px solid var(--border)',
  color: 'var(--t0)',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'var(--ff-body)'
};

function getInputStyle(hasError) {
  return {
    ...inputBaseStyle,
    border: hasError ? '1px solid #ef4444' : inputBaseStyle.border,
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

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const isLocalEnv = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const navigate = useNavigate();
  const location = useLocation();

  const [trialState] = useState(() => {
    if (isLogin || !location.state?.trial) {
      return null;
    }

    return {
      email: location.state?.email || '',
      company: location.state?.company || ''
    };
  });

  const [email, setEmail] = useState(() => trialState?.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(() => (trialState?.company ? 'admin' : 'employee')); // 'admin' | 'employee'
  const [companyName, setCompanyName] = useState(() => trialState?.company || '');
  const [adminKey, setAdminKey] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pageMode = isLogin ? 'login' : 'register';
  const authBackgrounds = {
    login: {
      admin: '/auth_login_admin_4k.jpg',
      employee: '/auth_login_4k.jpg'
    },
    register: {
      admin: '/auth_register_admin_4k_v2.jpg',
      employee: '/auth_register_4k_v2.jpg'
    }
  };
  const bgImage = authBackgrounds[pageMode]?.[role] || '/auth_bg_login.jpg';

  // Sincronizar scroll al cambiar de ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    if (!isLogin && location.state?.trial) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isLogin, location.pathname, location.state, navigate]);

  useEffect(() => {
    const existingSession = getClientSession();
    if (isLogin && existingSession?.token) {
      navigate('/dashboard', { replace: true, state: { isAdmin: existingSession.isAdmin } });
    }
  }, [isLogin, navigate]);

  const clearFieldError = (field) => {
    setErrors(prev => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!isLogin && role === 'admin' && !companyName.trim()) {
      nextErrors.companyName = 'El nombre de la empresa es obligatorio para administradores.';
    }

    if (!isLogin && !name.trim()) {
      nextErrors.name = 'El nombre completo es obligatorio.';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Introduce un correo electrónico válido.';
    }

    if (!trimmedPassword) {
      nextErrors.password = 'La contraseña es obligatoria.';
    } else if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    return nextErrors;
  };

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    setFormError('');
    if (nextRole !== 'admin') {
      clearFieldError('companyName');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError('Revisa los campos marcados para continuar.');

      const firstFieldWithError = Object.keys(AUTH_FIELD_IDS).find((field) => nextErrors[field]);
      if (firstFieldWithError) {
        requestAnimationFrame(() => {
          const el = document.getElementById(AUTH_FIELD_IDS[firstFieldWithError]);
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

    if (isLocalEnv) {
      try {
        const session = await bootstrapLocalSession({ isAdmin: role === 'admin' });
        navigate('/dashboard', { state: { isAdmin: session.isAdmin, localMode: true } });
        return;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'No se pudo conectar con la API local.';
        setFormError(msg.includes('Failed to fetch') || msg.includes('NetworkError') ? 'No se pudo conectar con la API local. ¿Está levantada la API en http://localhost:8080?' : msg);
        setIsSubmitting(false);
        return;
      }
    }

    // Entorno real: autenticar con Firebase, registrar usuario en backend si hace falta y obtener perfil
    try {
      const idToken = await signInAndGetIdToken(email.trim(), password.trim());
      // Intentar registrar en backend (si existe devolverá 409 y continuamos)
      try {
        await registerMe(idToken);
      } catch (err) {
        // ignorar 409 usuario ya registrado u otros errores no fatales
      }

      const profile = await getMe(idToken);
      const session = { token: idToken, isAdmin: role === 'admin', localMode: false, profile };
      setClientSession(session);
      navigate('/dashboard', { state: { isAdmin: session.isAdmin } });
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo autenticar';
      setFormError(msg.includes('Failed to fetch') || msg.includes('NetworkError') ? 'No se pudo conectar con la API. Comprueba CORS y que la API esté disponible.' : msg);
      setIsSubmitting(false);
      return;
    }
  };

  const handleLocalQuickAccess = async (targetRole) => {
    if (isSubmitting) {
      return;
    }

    setErrors({});
    setFormError('');
    setIsSubmitting(true);

    try {
      const session = await bootstrapLocalSession({ isAdmin: targetRole === 'admin' });
      navigate('/dashboard', {
        state: {
          isAdmin: session.isAdmin,
          localMode: true
        }
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo conectar con la API local.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .tp-auth-right { display: none; }
        @media(min-width: 900px) {
          .tp-auth-right { display: block; }
        }
      `}</style>
      <div className="tp-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg0)', color: 'var(--t0)', fontFamily: 'var(--ff-body)' }}>
        
        {/* ── Left Form Side ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '5vw 8vw', position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          
          <button onClick={() => navigate('/')} className="tp-btn tp-btn-ghost" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, 
            width: 'fit-content', marginBottom: 'auto', fontSize: 13
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al inicio
          </button>

          <div style={{ margin: 'auto 0', width: '100%', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
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
                <div style={{ fontFamily: 'var(--ff-head)', fontSize: 24, fontWeight: 700, letterSpacing: 1.5 }}>
                  Tem<span style={{ color: 'var(--mg)' }}>pos</span>
                </div>
              </div>
              <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 600, letterSpacing: -0.5, marginBottom: 12, color: 'var(--t0)' }}>
                {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratis'}
              </h1>
              <p style={{ color: 'var(--t1)', fontSize: 15, fontWeight: 300, lineHeight: 1.6 }}>
                {isLogin ? 'Introduce tus credenciales para acceder a tu panel de control.' : 'Únete a las empresas que ya controlan su tiempo de forma invisible y sin sorpresas.'}
              </p>
              {!isLogin && trialState && (
                <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(37,99,235,0.35)', background: 'rgba(37,99,235,0.09)', color: 'var(--mg2)', padding: '6px 12px', fontSize: 12.5, fontWeight: 600 }}>
                  Alta iniciada desde prueba gratuita
                </div>
              )}
            </div>

            {/* Role Selector */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 32, background: 'var(--bg1)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => handleRoleChange('employee')}
                type="button"
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: role === 'employee' ? 'var(--mg)' : 'transparent', color: role === 'employee' ? '#fff' : 'var(--t2)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
              >Soy Empleado</button>
              <button 
                onClick={() => handleRoleChange('admin')}
                type="button"
                style={{ flex: 1, padding: '10px', borderRadius: 10, background: role === 'admin' ? 'var(--mg)' : 'transparent', color: role === 'admin' ? '#fff' : 'var(--t2)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
              >Soy Administrador</button>
            </div>

            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {isLogin && isLocalEnv && (
                <div style={{ borderRadius: 12, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)', padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#86efac', marginBottom: 10 }}>
                    Modo local: entra sin registrarte
                  </div>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
                    <button
                      type="button"
                      className="tp-btn"
                      disabled={isSubmitting}
                      onClick={() => handleLocalQuickAccess('employee')}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--t0)',
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Entrar como Empleado
                    </button>
                    <button
                      type="button"
                      className="tp-btn"
                      disabled={isSubmitting}
                      onClick={() => handleLocalQuickAccess('admin')}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(37,99,235,0.35)',
                        background: 'rgba(37,99,235,0.14)',
                        color: '#bfdbfe',
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Entrar como Admin
                    </button>
                  </div>
                </div>
              )}

              {!!formError && (
                <div role="alert" aria-live="assertive" style={{ borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fecaca', fontSize: 13, padding: '10px 12px', fontWeight: 500 }}>
                  {formError}
                </div>
              )}

              {!isLogin && role === 'admin' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6, fontWeight: 500 }}>Nombre de la Empresa</label>
                  <input 
                    id={AUTH_FIELD_IDS.companyName}
                    type="text"
                    value={companyName}
                    onChange={e => {
                      setCompanyName(e.target.value);
                      clearFieldError('companyName');
                      setFormError('');
                    }}
                    autoComplete="organization"
                    aria-invalid={!!errors.companyName}
                    aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                    placeholder="Ej. Tempos Tech S.L."
                    style={getInputStyle(!!errors.companyName)}
                  />
                  <ErrorText id="companyName-error" message={errors.companyName} />
                </div>
              )}

              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6, fontWeight: 500 }}>Nombre completo</label>
                  <input 
                    id={AUTH_FIELD_IDS.name}
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      clearFieldError('name');
                      setFormError('');
                    }}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    placeholder="Ej. Ana García"
                    style={getInputStyle(!!errors.name)}
                  />
                  <ErrorText id="name-error" message={errors.name} />
                </div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6, fontWeight: 500 }}>Correo electrónico</label>
                <input 
                  id={AUTH_FIELD_IDS.email}
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                    setFormError('');
                  }}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="ejemplo@empresa.com"
                  style={getInputStyle(!!errors.email)}
                />
                <ErrorText id="email-error" message={errors.email} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Contraseña</label>
                  {isLogin && <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12, color: 'var(--mg)', textDecoration: 'none', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>}
                </div>
                <input 
                  id={AUTH_FIELD_IDS.password}
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                    setFormError('');
                  }}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  placeholder="••••••••"
                  style={getInputStyle(!!errors.password)}
                />
                <ErrorText id="password-error" message={errors.password} />
              </div>

              {role === 'admin' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6, fontWeight: 500 }}>Admin Secret Key</label>
                  <input 
                    type="password"
                    value={adminKey}
                    onChange={e => {
                      setAdminKey(e.target.value);
                      setFormError('');
                    }}
                    autoComplete="off"
                    placeholder="••••••••"
                    style={getInputStyle(false)}
                  />
                </div>
              )}

              <button
                type="submit"
                className="tp-btn tp-btn-primary"
                disabled={isSubmitting}
                style={{
                  padding: '16px',
                  borderRadius: 10,
                  fontSize: 15,
                  marginTop: 8,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSubmitting ? 0.7 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting
                  ? 'Procesando...'
                  : (isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis')}
              </button>
            </form>

            <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--t1)' }}>
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes una cuenta? '}
              <Link to={isLogin ? '/register' : '/login'} style={{ color: 'var(--mg)', fontWeight: 600, textDecoration: 'none' }}>
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--t2)', textAlign: 'center' }}>
            Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
          </div>
        </div>

        {/* ── Right Image Side (Split Screen) ── */}
        <div className="tp-auth-right" style={{ flex: 1.2, position: 'relative', overflow: 'hidden', background: 'var(--bg0)' }}>
          <img src={bgImage} alt={`Visual ${pageMode} ${role}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'contrast(1.1) saturate(1.2)' }} />
          {/* Global tint overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(20,20,20,0.6), rgba(37,99,235,0.2))', pointerEvents: 'none' }} />
          {/* Overlay fade to blend left side */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '250px', background: 'linear-gradient(to right, var(--bg0) 0%, transparent 100%)', pointerEvents: 'none' }} />
          {/* Tagline */}
          <div style={{ position: 'absolute', bottom: 60, right: 60, textAlign: 'right', pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'var(--ff-head)', fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: -0.5, marginBottom: 8 }}>
              {isLogin ? 'El control vuelve a ti.' : 'Menos burocracia. Más impacto.'}
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>
              {isLogin ? 'Accede a tus datos en tiempo real.' : 'Cumple la normativa en 30 segundos.'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
