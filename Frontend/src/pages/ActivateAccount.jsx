import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, Warning, ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { validateActivationToken, activateAccount } from '@/lib/api';
import Logo from '@/components/ui/Logo';

export default function ActivateAccount() {
  const navigate = useNavigate();

  const [step, setStep] = useState('token'); // token | password | success | error
  const [token, setToken] = useState('');
  const [validation, setValidation] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidateToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Ingresa el código de activación.');
      return;
    }

    // Strip any whitespace or formatting
    const cleanToken = token.trim().toLowerCase();

    setIsSubmitting(true);
    setError('');
    setErrorCode('');

    try {
      const res = await validateActivationToken(cleanToken);
      if (res?.valid) {
        setValidation(res);
        setStep('password');
      } else {
        setError(res?.error || 'Código inválido.');
      }
    } catch (err) {
      const code = err?.code || '';
      const status = err?.status;
      const msg = err?.message || 'Error al validar el código.';

      setErrorCode(code);

      if (status === 410 && (code === 'TOKEN_EXPIRED' || msg.includes('expiro') || msg.includes('expiró'))) {
        setError('Este código expiró. Pídele uno nuevo a tu administrador.');
        setStep('error');
      } else if (status === 410) {
        setError('Este código ya fue usado. Intenta iniciar sesión.');
        setStep('error');
      } else if (status === 404 || code === 'INVALID_TOKEN_FORMAT') {
        setError('Código no válido. Revísalo e inténtalo de nuevo.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('La contraseña debe contener al menos una mayúscula.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await activateAccount(token.trim().toLowerCase(), password);
      setStep('success');
    } catch (err) {
      const status = err?.status;
      const msg = err?.message || 'Error al activar la cuenta.';

      if (status === 410 && err?.code === 'TOKEN_EXPIRED') {
        setError('Este código expiró. Pídele uno nuevo a tu administrador.');
        setStep('error');
      } else if (status === 410) {
        setError('Este código ya fue usado. Intenta iniciar sesión.');
        setStep('error');
      } else if (status === 409) {
        setError('Este correo ya tiene una cuenta. Intenta iniciar sesión.');
      } else if (status === 502) {
        setError('Error al crear la cuenta. Inténtalo de nuevo más tarde.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <Logo />
        </div>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: TOKEN INPUT ─── */}
          {step === 'token' && (
            <motion.div
              key="token"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl">
                <div className="px-10 py-12 text-center bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/10 border-b border-white/[0.05]">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                    <Key className="w-10 h-10 text-white" weight="duotone" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                    Activa tu cuenta
                  </h1>
                  <p className="text-zinc-400 text-sm">
                    Ingresa el código de activación que te dio tu administrador.
                  </p>
                </div>

                <form onSubmit={handleValidateToken} className="p-10 space-y-6">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 text-left font-medium">
                      Código de activación
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => { setToken(e.target.value); setError(''); }}
                      placeholder="Ej: a1b2c3d4e5f6..."
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors font-mono tracking-wide text-center"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                      <p className="text-rose-400 text-xs text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !token.trim()}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      'Validando...'
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="w-4 h-4" weight="bold" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: PASSWORD ─── */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl">
                <div className="px-10 py-12 text-center bg-gradient-to-br from-emerald-600/20 via-transparent to-blue-600/10 border-b border-white/[0.05]">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                    <CheckCircle className="w-10 h-10 text-white" weight="duotone" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                    Casi listo
                  </h1>
                  <p className="text-zinc-400 text-sm">
                    Crea una contraseña para tu cuenta de <strong className="text-white">{validation?.email}</strong>
                  </p>
                </div>

                <form onSubmit={handleActivate} className="p-10 space-y-6">
                  {/* User info */}
                  {validation?.displayName && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-center">
                      <p className="text-white font-bold text-sm">{validation.displayName}</p>
                      <p className="text-zinc-500 text-xs mt-1">{validation.email}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 text-left font-medium">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
                        className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors pr-12"
                        autoFocus
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeSlash className="w-4 h-4" weight="bold" /> : <Eye className="w-4 h-4" weight="bold" />}
                      </button>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <span className={`text-[10px] font-bold ${password.length >= 8 ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        • 8+ caracteres
                      </span>
                      <span className={`text-[10px] font-bold ${/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        • 1 mayúscula
                      </span>
                      <span className={`text-[10px] font-bold ${/[0-9]/.test(password) ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        • 1 número
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                      <p className="text-rose-400 text-xs text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
                  >
                    {isSubmitting ? 'Activando cuenta...' : 'Activar cuenta'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS ─── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl text-center">
                <div className="px-10 py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                    <CheckCircle className="w-10 h-10 text-white" weight="fill" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight mb-3">
                    Cuenta activada
                  </h1>
                  <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                    Tu cuenta fue activada correctamente. <br />
                    Ya puedes iniciar sesión con tu correo y contraseña.
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
                  >
                    Ir a iniciar sesión
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── ERROR (expired / used) ─── */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[#0a0a0c] border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl text-center">
                <div className="px-10 py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 flex items-center justify-center">
                    <Warning className="w-10 h-10 text-rose-500" weight="fill" />
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight mb-3">
                    {errorCode === 'TOKEN_EXPIRED' ? 'Código expirado' : 'Código no válido'}
                  </h1>
                  <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                    {error}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setStep('token'); setError(''); setErrorCode(''); setToken(''); }}
                      className="px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
                    >
                      Intentar de nuevo
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="px-10 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white text-sm font-bold transition-all"
                    >
                      Ir a iniciar sesión
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
