import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { bootstrapLocalSession, getClientSession, registerMe, getMe, setClientSession } from '@/lib/api';
import { signInAndGetIdToken, signInWithGoogleAndGetIdToken } from '@/lib/firebaseClient';
import Logo from '@/components/ui/Logo';

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
  const [role] = useState('admin'); // Siempre admin para registros web
  const [companyName, setCompanyName] = useState(() => trialState?.company || '');
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
      navigate('/dashboard', { replace: true });
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

    // Entorno real o local con formulario: autenticar con Firebase, registrar usuario en backend si hace falta y obtener perfil
    try {
      const idToken = await signInAndGetIdToken(email.trim(), password.trim());
      // Intentar registrar en backend (si existe devolverá 409 y continuamos)
      try {
        await registerMe(idToken, { role, companyName });
      } catch (err) {
        // ignorar 409 usuario ya registrado u otros errores no fatales
      }

      const profile = await getMe(idToken);
      const session = { token: idToken, isAdmin: true, localMode: false, profile };
      setClientSession(session);
      navigate('/dashboard');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo autenticar';
      setFormError(msg.includes('Failed to fetch') || msg.includes('NetworkError') ? 'No se pudo conectar con la API. Comprueba CORS y que la API esté disponible.' : msg);
      setIsSubmitting(false);
      return;
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    
    setFormError('');
    setIsSubmitting(true);

    try {
      const idToken = await signInWithGoogleAndGetIdToken();
      
      // Intentar registro rápido (si ya existe, el backend devolverá 409 y seguimos)
      try {
        await registerMe(idToken, { role, companyName: role === 'admin' ? 'Google Company' : undefined });
      } catch {
        // Ignorar conflictos de usuario ya existente
      }

      const profile = await getMe(idToken);
      const session = { token: idToken, isAdmin: true, localMode: false, profile };
      setClientSession(session);
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error en acceso con Google';
      if (!msg.includes('auth/popup-closed-by-user')) {
        setFormError(msg);
      }
      setIsSubmitting(false);
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
      const session = await bootstrapLocalSession({ isAdmin: true });
      navigate('/dashboard', {
        state: {
          isAdmin: true,
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
              <Logo size="md" className="mb-6" />
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

            {/* Registro de Empresa - Siempre Admin */}

            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {isLogin && isLocalEnv && (
                <div style={{ borderRadius: 12, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.08)', padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#86efac', marginBottom: 10 }}>
                    Modo local: entra sin registrarte
                  </div>
                  <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>o</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)', opacity: 0.5 }} />
              </div>

              <button
                type="button"
                className="tp-btn"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                style={{
                  padding: '14px',
                  borderRadius: 10,
                  fontSize: 14,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  color: 'var(--t0)',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
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
