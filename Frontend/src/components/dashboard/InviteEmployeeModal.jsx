import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CopySimple, CheckCircle, Warning, EnvelopeSimple, User, ShieldCheck } from '@phosphor-icons/react';
import { inviteEmployee } from '@/lib/api';

export default function InviteEmployeeModal({ open, onClose, token: authToken }) {
  const [step, setStep] = useState('form'); // form | success
  const [formData, setFormData] = useState({ email: '', displayName: '', role: 'employee' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.displayName) {
      setError('Completá todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await inviteEmployee(authToken, formData);
      setResult(res);
      setStep('success');
    } catch (err) {
      setError(err?.message || 'Error al invitar al empleado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = async () => {
    if (result?.token) {
      try {
        await navigator.clipboard.writeText(result.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Fallback: select the token text manually
      }
    }
  };

  const handleDone = () => {
    setStep('form');
    setFormData({ email: '', displayName: '', role: 'employee' });
    setResult(null);
    setError('');
    setCopied(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDone}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative bg-[#111114] border border-white/[0.08] rounded-[20px] shadow-[0_24px_80px_rgba(0,0,0,0.5)] w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Invitar empleado"
          >
            {/* Close Button */}
            <button
              onClick={handleDone}
              aria-label="Cerrar"
              className="absolute top-5 right-5 z-10 w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-white transition-all duration-200"
            >
              <X className="w-4 h-4" weight="bold" />
            </button>

            {step === 'form' && (
              <>
                <div className="px-8 pt-8 pb-2">
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Invitar empleado</h2>
                  <p className="text-zinc-500 text-xs mt-1">
                    El empleado recibirá un código de activación para crear su cuenta.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                      <EnvelopeSimple className="inline w-3 h-3 mr-1" weight="bold" />
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleChange('email')}
                      placeholder="email@ejemplo.com"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                      <User className="inline w-3 h-3 mr-1" weight="bold" />
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={handleChange('displayName')}
                      placeholder="Nombre del empleado"
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                      <ShieldCheck className="inline w-3 h-3 mr-1" weight="bold" />
                      Rol
                    </label>
                    <select
                      value={formData.role}
                      onChange={handleChange('role')}
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="employee" className="bg-[#111114]">Empleado</option>
                      <option value="manager" className="bg-[#111114]">Manager</option>
                      <option value="admin" className="bg-[#111114]">Administrador</option>
                      <option value="auditor" className="bg-[#111114]">Auditor</option>
                    </select>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2">
                      <Warning className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" weight="fill" />
                      <p className="text-rose-400 text-xs">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
                  >
                    {isSubmitting ? 'Generando código...' : 'Generar código de activación'}
                  </button>
                </form>
              </>
            )}

            {step === 'success' && result && (
              <>
                <div className="px-8 pt-8 pb-2 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500" weight="fill" />
                  </div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">Empleado invitado</h2>
                  <p className="text-zinc-400 text-xs mt-1">
                    Compartí este código con <strong className="text-white">{result.displayName}</strong> de forma segura.
                  </p>
                </div>

                <div className="px-8 py-6 space-y-5">
                  {/* Token display */}
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 text-center">
                      Código de activación único
                    </label>
                    <div className="bg-[#0a0a0c] border border-white/[0.08] rounded-xl p-4 font-mono text-xs text-blue-400 break-all text-center select-all tracking-wide">
                      {result.token}
                    </div>
                    <button
                      onClick={handleCopyToken}
                      className="w-full mt-3 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <><CheckCircle className="w-4 h-4 text-emerald-500" weight="fill" /> Copiado</>
                      ) : (
                        <><CopySimple className="w-4 h-4" weight="bold" /> Copiar código</>
                      )}
                    </button>
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <Warning className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" weight="fill" />
                    <div>
                      <p className="text-amber-400 text-xs font-bold mb-1">Importante</p>
                      <p className="text-amber-400/70 text-[11px] leading-relaxed">
                        Este código se muestra una sola vez. Compartilo de forma segura con el empleado.
                        El código expira en <strong>24 horas</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Done button */}
                  <button
                    onClick={handleDone}
                    className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20"
                  >
                    Listo
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
