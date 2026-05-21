import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitation, registerMe, setClientSession } from '@/lib/api';
import { signInWithGoogleAndGetIdToken, handleRedirectResult } from '@/lib/firebaseClient';
import Logo from '@/components/ui/Logo';

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState('loading'); // loading | valid | expired | invalid | already_used | registering | error
  const [invitation, setInvitation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      setErrorMsg('Enlace de invitación inválido.');
      return;
    }

    // Primero verificar si venimos de una redirección de Google (mobile)
    handleRedirectResult().then(async (idToken) => {
      if (idToken) {
        // Viniendo de redirect, registrar automáticamente
        try {
          setState('registering');
          setStatusMsg('Completando registro...');
          const res = await registerMe(idToken, {});
          if (res?.data) {
            setClientSession({ token: idToken, ...res.data });
            navigate('/dashboard', { replace: true });
          }
        } catch (err) {
          setState('error');
          setErrorMsg(err?.response?.data?.error || err.message || 'Error al completar el registro.');
        }
        return;
      }

      // Validar invitación
      try {
        const res = await getInvitation(token);
        if (res?.valid) {
          setInvitation(res);
          setState('valid');
        } else {
          setState('invalid');
          setErrorMsg(res?.error || 'Invitación no válida.');
        }
      } catch (err) {
        const status = err?.status;
        const msg = err?.response?.data?.error || err.message;

        if (status === 410) {
          setState('expired');
          setErrorMsg(msg || 'Esta invitación ha expirado.');
        } else {
          setState('invalid');
          setErrorMsg(msg || 'Invitación no encontrada.');
        }
      }
    });
  }, [token, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setState('registering');
      setStatusMsg('Conectando con Google...');

      const idToken = await signInWithGoogleAndGetIdToken((msg) => {
        setStatusMsg(msg);
      });

      if (!idToken) {
        // En móvil puede ser null si se redirige — el useEffect lo maneja al volver
        return;
      }

      setStatusMsg('Completando registro...');
      const res = await registerMe(idToken, {});

      if (res?.data) {
        setClientSession({ token: idToken, ...res.data });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setState('error');
      if (err.message?.toLowerCase().includes('popup') || err.message?.toLowerCase().includes('blocked')) {
        setErrorMsg('El navegador bloqueó la ventana emergente de Google. Permití popups para este sitio e intentá de nuevo.');
      } else {
        setErrorMsg(err?.response?.data?.error || err.message || 'Error al iniciar sesión con Google.');
      }
    }
  };

  // ─── LOADING STATE ───
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500 font-medium">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR STATES ───
  if (state === 'invalid' || state === 'expired') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="mb-8">
            <Logo />
          </div>

          <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl p-10 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-white mb-3">
              {state === 'expired' ? 'Invitación Expirada' : 'Invitación No Encontrada'}
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              {state === 'expired'
                ? 'Esta invitación ya no es válida porque ha expirado. Solicité una nueva a tu administrador.'
                : errorMsg}
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              Ir a Iniciar Sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── ALREADY USED ───
  if (state === 'already_used') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="mb-8">
            <Logo />
          </div>
          <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl p-10 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-3">Invitación ya utilizada</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Esta invitación ya fue aceptada. Podés iniciar sesión con tu cuenta de Google.
            </p>
            <a
              href="/login"
              className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              Iniciar Sesión
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGISTERING ───
  if (state === 'registering') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">{statusMsg}</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ───
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl p-10 shadow-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-3">Error al registrarse</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">{errorMsg}</p>
            <button
              onClick={handleGoogleSignIn}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VALID — WELCOME SCREEN ───
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <Logo />
        </div>

        <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl">
          {/* Gradient Header */}
          <div className="px-10 py-12 text-center bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/10 border-b border-white/[0.05]">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              Has sido invitado
            </h1>
            <p className="text-zinc-400 text-sm">
              a unirte a <strong className="text-white">{invitation?.companyName || 'tu empresa'}</strong>
            </p>
          </div>

          {/* Content */}
          <div className="p-10 space-y-6">
            <div className="text-center">
              <p className="text-zinc-400 text-sm mb-1">Bienvenido,</p>
              <p className="text-xl font-bold text-white">{invitation?.displayName || 'Usuario'}</p>
              <p className="text-zinc-500 text-sm mt-1">{invitation?.email}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Para aceptar la invitación y empezar a usar <strong className="text-white">Tempos</strong>, registrate con Google usando este mismo correo electrónico.
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Registrarse con Google
            </button>

            <p className="text-center text-[10px] text-zinc-600">
              Al registrarte, aceptás los{' '}
              <a href="/legal/terminos" className="text-blue-500 hover:text-blue-400 underline">términos de servicio</a>
              {' '}y la{' '}
              <a href="/legal/privacidad" className="text-blue-500 hover:text-blue-400 underline">política de privacidad</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
