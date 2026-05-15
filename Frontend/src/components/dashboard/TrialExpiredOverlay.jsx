import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function TrialExpiredOverlay({ trialExpiresAt }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
            Tu tiempo de prueba ha terminado
          </h2>
          
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Esperamos que hayas disfrutado de la experiencia Tempos. Para seguir optimizando tu gestión de personal y cumplir con la normativa legal, activa tu plan profesional.
          </p>

          <div className="w-full space-y-3 mb-8">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm text-zinc-300 font-medium">Todos tus datos están a salvo</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-zinc-300 font-medium">Activa el plan PRO al instante</span>
            </div>
          </div>

          <button 
            onClick={() => window.location.href = '/contacto'}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20"
          >
            Ver Planes Profesionales
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-xs text-zinc-500">
            ¿Tienes dudas? <a href="/contacto" className="text-zinc-300 hover:underline">Habla con un asesor</a>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
