import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth, reloadCurrentUser, signOutUser } from '@/lib/firebaseClient';
import { requestVerificationEmail } from '@/lib/api';
import Logo from '@/components/ui/Logo';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('waiting'); // waiting | verified | sending | resent | error | processing
  const [message, setMessage] = useState('');
  const email = searchParams.get('email') || sessionStorage.getItem('pending_verification_email') || '';

  // Detectar errores de verificación que vienen desde el redirect del backend
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'expired') {
      setStatus('error');
      setMessage('El enlace ha expirado. Solicita uno nuevo.');
    } else if (error === 'invalid') {
      setStatus('error');
      setMessage('El enlace no es válido o ya fue usado.');
    }
  }, [searchParams]);

  const checkVerification = useCallback(async () => {
    try {
      const user = await reloadCurrentUser();
      if (user?.emailVerified) {
        setStatus('verified');
        sessionStorage.removeItem('pending_verification_email');
        sessionStorage.removeItem('pending_verification_password');
        // Sign out so user can log in fresh with verified status
        await signOutUser();
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    } catch {
      // ignore, will retry
    }
  }, [navigate]);

  // Auto-poll every 3 seconds while waiting for manual verification (not from email link)
  useEffect(() => {
    if (status !== 'waiting') return;
    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, [status, checkVerification]);

  // Check on mount for cases without oobCode
  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  const handleResend = async () => {
    setStatus('sending');
    try {
      const savedEmail = sessionStorage.getItem('pending_verification_email');
      if (!savedEmail) {
        setStatus('error');
        setMessage('No se encontró el email. Vuelve a registrarte.');
        return;
      }

      await requestVerificationEmail(savedEmail);

      setStatus('resent');
      setMessage('Email reenviado correctamente.');
      setTimeout(() => setStatus('waiting'), 4000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Error al reenviar el email.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--t0)',
      fontFamily: 'var(--ff-body)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
        </div>

        {status === 'verified' ? (
          <>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{
              fontFamily: 'var(--ff-head)',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: -0.5,
              marginBottom: 8,
            }}>
              Email verificado
            </h1>
            <p style={{ color: 'var(--t2)', lineHeight: 1.6, marginBottom: 24 }}>
              Tu dirección de email ha sido verificada correctamente.
              <br/>Redirigiendo al inicio de sesión...
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 56, height: 56,
              borderRadius: '50%',
              background: 'rgba(37,99,235,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
            </div>

            <h1 style={{
              fontFamily: 'var(--ff-head)',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: -0.5,
              marginBottom: 8,
            }}>
              Verifica tu email
            </h1>

            {email && (
              <p style={{ color: 'var(--t1)', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                Te enviamos un email a <strong style={{ color: 'var(--t0)' }}>{email}</strong>.
                Haz clic en el enlace para activar tu cuenta.
              </p>
            )}

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 28,
              textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: 'var(--t0)' }}>¿No lo recibiste?</strong>
                <br/>
                Revisa la carpeta de spam o correo no deseado. Si pasaron más de 5 minutos, solicita un nuevo enlace.
              </p>
            </div>

            {message && (
              <p style={{
                fontSize: 13,
                color: status === 'error' ? '#f87171' : '#34d399',
                marginBottom: 16,
              }}>
                {message}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleResend}
                disabled={status === 'sending'}
                className="tp-btn tp-btn-primary"
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  opacity: status === 'sending' ? 0.7 : 1,
                  width: '100%',
                }}
              >
                {status === 'sending' ? 'ENVIANDO...' : 'REENVIAR EMAIL DE VERIFICACIÓN'}
              </button>

              <Link
                to="/login"
                style={{
                  color: 'var(--t3)',
                  fontSize: 13,
                  textDecoration: 'none',
                  padding: '10px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--t0)'}
                onMouseLeave={e => e.target.style.color = 'var(--t3)'}
              >
                Ya verifiqué mi email &rarr; Iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
