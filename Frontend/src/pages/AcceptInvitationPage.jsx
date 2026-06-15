import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitation, registerMe, setClientSession } from '@/lib/api';
import { signUpAndGetIdToken } from '@/lib/firebaseClient';
import Logo from '@/components/ui/Logo';

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [state, setState] = useState('loading'); // loading | valid | expired | invalid | already_used | registering | error
  const [invitation, setInvitation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      setErrorMsg('Enlace de invitación inválido.');
      return;
    }

    // Validar invitación
    (async () => {
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
    })();
  }, [token, navigate]);

  const handleAccept = async () => {
    if (!password || password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!invitation?.email) {
      setErrorMsg('Error: no se encontró el email de la invitación.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      setState('registering');
      setStatusMsg('Creando cuenta...');

      const idToken = await signUpAndGetIdToken(invitation.email, password);
      
      setStatusMsg('Aceptando invitación...');
      const res = await registerMe(idToken, {
        role: invitation.role || 'employee',
        name: invitation.displayName || undefined,
      });

      if (res?.data) {
        setClientSession({ token: idToken, ...res.data });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setState('valid');
      setIsSubmitting(false);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este correo ya tiene una cuenta. Inicia sesión desde la página de login.');
      } else {
        setErrorMsg(err?.response?.data?.error || err.message || 'Error al aceptar la invitación.');
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
              Esta invitación ya fue aceptada. Puedes iniciar sesión desde la página de login.
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
            <a
              href={`/invite/${token}`}
              className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
            >
              Reintentar
            </a>
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
                Para aceptar la invitación y empezar a usar <strong className="text-white">Tempos</strong>, crea una contraseña.
              </p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-2 text-left font-medium">Correo electrónico</label>
              <input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="invite-password" className="block text-xs text-zinc-500 mb-2 text-left font-medium">Crear contraseña</label>
              <input
                id="invite-password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                <p className="text-rose-400 text-xs text-center">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Aceptar invitación'}
            </button>

            <p className="text-center text-[10px] text-zinc-600">
              Al registrarte, aceptas los{' '}
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
