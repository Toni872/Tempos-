import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { bootstrapLocalSession, getClientSession, registerMe, getMe, setClientSession, clearClientSession } from '@/lib/api';
import { signInAndGetIdToken, signUpAndGetIdToken, sendPasswordReset, sendVerificationEmail, auth as firebaseAuth } from '@/lib/firebaseClient';
import { Capacitor } from '@capacitor/core';
import Logo from '@/components/ui/Logo';
import ErrorText from '@/components/ui/ErrorText';
import { Eye, EyeSlash, SpinnerGap } from '@phosphor-icons/react';
import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 8;
const FREE_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'icloud.com', 'aol.com', 'mail.com'];
const AUTH_FIELD_IDS = {
  companyName: 'auth-companyName',
  name: 'auth-name',
  email: 'auth-email',
  password: 'auth-password',
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
  const role = Capacitor.isNativePlatform() ? 'employee' : 'admin';
  const [companyName, setCompanyName] = useState(() => trialState?.company || '');
  const [companyDomain, setCompanyDomain] = useState('');
  const companyDomainManuallyEdited = useRef(false);
  const [freeEmailWarning, setFreeEmailWarning] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [returnUrl, setReturnUrl] = useState(null);

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
      // Validar que el token no esté expirado antes de redirigir
      const tokenPayload = (() => {
        try {
          const parts = existingSession.token.split('.');
          if (parts.length !== 3) return null;
          return JSON.parse(atob(parts[1]));
        } catch { return null; }
      })();
      const now = Math.floor(Date.now() / 1000);
      if (tokenPayload?.exp && tokenPayload.exp < now) {
        // Token expirado: limpiar sesión y quedarse en login
        clearClientSession();
        return;
      }
      navigate('/dashboard', { replace: true });
    }
  }, [isLogin, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setReturnUrl(redirect);
    }
    if (params.get('verified') === '1') {
      setVerifiedSuccess(true);
      // Limpiar la URL sin recargar
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

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

  const loginSchema = z.object({
    email: z.string().min(1, "El correo electrónico es obligatorio.").email("Introduce un correo electrónico válido."),
    password: z.string().min(1, "La contraseña es obligatoria.").min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  });

  const registerSchema = z.object({
    companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres."),
    companyDomain: z.string().optional(),
    name: z.string().min(2, "El nombre completo debe tener al menos 2 caracteres."),
    email: z.string().min(1, "El correo electrónico es obligatorio.").email("Introduce un correo electrónico válido."),
    password: z.string().min(1, "La contraseña es obligatoria.").min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  });

  const validateForm = () => {
    try {
      const data = { email, password, name, companyName, companyDomain };
      const schema = isLogin ? loginSchema : registerSchema;
      
      const result = schema.safeParse(data);
      if (!result.success) {
        const nextErrors = {};
        (result.error?.errors ?? []).forEach(err => {
          nextErrors[err.path[0]] = err.message;
        });
        return nextErrors;
      }
      return {};
    } catch {
      return {};
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

    // Safety timeout: si Firebase no responde en 30s, liberamos el botón
    const safetyTimeout = setTimeout(() => {
      setIsSubmitting(false);
      setFormError('El servidor de autenticación no está respondiendo. Verifica tu conexión e intenta de nuevo.');
    }, 30000);

    // Entorno real o local con formulario: autenticar con Firebase, registrar usuario en backend si hace falta y obtener perfil
    try {
      let idToken;
      if (isLogin) {
        idToken = await signInAndGetIdToken(email.trim(), password.trim());

        // Si el email no está verificado, redirigir a verificación
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser?.emailVerified) {
          await firebaseAuth.signOut();
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, { replace: true });
          return;
        }
      } else {
        idToken = await signUpAndGetIdToken(email.trim(), password.trim());
      }

      // Solo registrar en backend si es un registro nuevo, no en login
      if (!isLogin) {
        try {
          await registerMe(idToken, { 
            role, 
            companyName: role === 'admin' ? companyName.trim() || undefined : undefined,
            companyDomain: role === 'admin' ? companyDomain.trim() || undefined : undefined,
            name: name || undefined 
          });
        } catch (err) {
          // ignorar 409 usuario ya registrado u otros errores no fatales
        }
      }

      const profile = await getMe(idToken);
      clearTimeout(safetyTimeout);
      const session = { 
        token: idToken, 
        isAdmin: profile.role === 'admin' || profile.role === 'manager', 
        localMode: false, 
        profile 
      };
      setClientSession(session);
      localStorage.setItem('tempos.remember', rememberMe ? 'true' : 'false');
      navigate(returnUrl || '/dashboard');
      return;
    } catch (err) {
      clearTimeout(safetyTimeout);
      const msg = err instanceof Error ? err.message : 'No se pudo autenticar';
      setFormError(msg.includes('Failed to fetch') || msg.includes('NetworkError') ? 'No se pudo conectar con la API. Comprueba CORS y que la API esté disponible.' : msg);
      setIsSubmitting(false);
      return;
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setFormError('Por favor, introduce tu correo electrónico primero.');
      setErrors({ email: 'Requerido para restablecer' });
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await sendPasswordReset(email.trim());
      setFormError('Se ha enviado un correo para restablecer tu contraseña.');
    } catch (err) {
      console.error('❌ Error reset password:', err);
      setFormError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
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
      const isTargetAdmin = targetRole === 'admin';
      const session = await bootstrapLocalSession({ isAdmin: isTargetAdmin });
      navigate('/dashboard', {
        state: {
          isAdmin: isTargetAdmin,
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div className="tp-root" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg0)', color: 'var(--t0)', fontFamily: 'var(--ff-body)' }}>
        
        {/* ── Left Form Side ── */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 'clamp(20px, 5vw, 40px) clamp(16px, 8vw, 48px)',
          paddingTop: 'calc(clamp(40px, 8vw, 60px) + env(safe-area-inset-top, 24px))',
          paddingBottom: 'calc(clamp(20px, 5vw, 40px) + env(safe-area-inset-bottom, 20px))',
          position: 'relative', 
          maxWidth: 640, 
          margin: '0 auto' 
        }}>
          
          <button onClick={() => navigate('/')} className="tp-btn tp-btn-ghost" style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, 
            width: 'fit-content', marginBottom: '40px', fontSize: 13
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Volver al inicio
          </button>

          <div style={{ margin: 'auto 0', width: '100%', paddingTop: 40, paddingBottom: 40 }}>
            <div style={{ marginBottom: 40 }}>
              <Logo size="md" className="mb-6" />
              <h1 style={{ fontFamily: 'var(--ff-head)', fontSize: 36, fontWeight: 600, letterSpacing: -0.5, marginBottom: 12, color: 'var(--t0)' }}>
                {isLogin ? 'Acceso Empresa' : 'Crea tu cuenta gratis'}
              </h1>
              <p style={{ color: 'var(--t1)', fontSize: 15, fontWeight: 300, lineHeight: 1.6 }}>
                {isLogin ? 'Introduce tus credenciales para acceder a la intranet de gestión.' : 'Únete a las empresas que ya controlan su tiempo de forma invisible y sin sorpresas.'}
              </p>
              {!isLogin && trialState && (
                <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid rgba(37,99,235,0.35)', background: 'rgba(37,99,235,0.09)', color: 'var(--mg2)', padding: '6px 12px', fontSize: 12.5, fontWeight: 600 }}>
                  Alta iniciada desde prueba gratuita
                </div>
              )}
            </div>

            {/* Registro de Empresa - Siempre Admin */}

            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {verifiedSuccess && (
                <div role="status" style={{ borderRadius: 10, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', fontSize: 13, padding: '10px 12px', fontWeight: 500 }}>
                  Email verificado correctamente. Ya puedes iniciar sesión.
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

                  <label style={{ display: 'block', fontSize: 13, color: 'var(--t2)', marginBottom: 6, fontWeight: 500, marginTop: 16 }}>Dominio de la empresa <span style={{ color: 'var(--t3)', fontWeight: 400 }}>(opcional)</span></label>
                  <input 
                    id="auth-companyDomain"
                    type="text"
                    value={companyDomain}
                    onChange={e => {
                      setCompanyDomain(e.target.value);
                      companyDomainManuallyEdited.current = true;
                      setFormError('');
                    }}
                    autoComplete="url"
                    placeholder="miempresa.com"
                    style={getInputStyle(false)}
                  />
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
                    const value = e.target.value;
                    setEmail(value);
                    clearFieldError('email');
                    setFormError('');

                    if (!isLogin) {
                      if (!companyDomainManuallyEdited.current) {
                        const atIndex = value.indexOf('@');
                        if (atIndex !== -1) {
                          setCompanyDomain(value.slice(atIndex + 1).toLowerCase());
                        } else {
                          setCompanyDomain('');
                        }
                      }

                      const atIndex = value.indexOf('@');
                      if (atIndex !== -1) {
                        const domain = value.slice(atIndex + 1).toLowerCase();
                        setFreeEmailWarning(
                          FREE_EMAIL_DOMAINS.includes(domain)
                            ? 'Usa un email corporativo. Los emails gratuitos no están permitidos para registrar una empresa.'
                            : ''
                        );
                      } else {
                        setFreeEmailWarning('');
                      }
                    }
                  }}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="ejemplo@empresa.com"
                  style={getInputStyle(!!errors.email)}
                />
                <ErrorText id="email-error" message={errors.email} />
                {!isLogin && freeEmailWarning && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>{freeEmailWarning}</span>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>Contraseña</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: 0, 
                        fontSize: 12, 
                        color: 'var(--primary)', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    id={AUTH_FIELD_IDS.password}
                    type={showPassword ? 'text' : 'password'}
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
                    style={{ ...getInputStyle(!!errors.password), paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--t2)',
                      opacity: 0.5,
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <ErrorText id="password-error" message={errors.password} />

                {isLogin && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--t1)', userSelect: 'none' }}>Recordar mi sesión</span>
                  </label>
                )}
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
                  ? (
                    <>
                      <SpinnerGap size={20} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                      {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                    </>
                  )
                  : (isLogin ? 'Acceder' : 'Empezar prueba gratuita')}
              </button>




            </form>

            {isLogin && (
              <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--t1)' }}>
                ¿Aún no estás registrado?{' '}
                <Link to="/trial" style={{ color: 'var(--mg)', textDecoration: 'none', fontWeight: 600 }}>
                  Prueba gratis
                </Link>
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--t2)', textAlign: 'center' }}>
            © 2026. Todos los derechos reservados.
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
