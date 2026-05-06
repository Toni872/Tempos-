import React from 'react';
import { WarningCircle, X } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function Error({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="pointer-events-auto flex items-center gap-4 bg-[#16161a]/90 backdrop-blur-xl border border-rose-500/30 px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(244,63,94,0.2)]"
      >
        <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
          <WarningCircle size={24} weight="fill" className="text-white" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-0.5">Alerta de Sistema</span>
          <p className="text-xs font-bold text-white/90 italic tracking-widest">{message}</p>
        </div>

        <button 
          onClick={onClose}
          className="ml-4 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white/10 hover:text-white transition-all"
        >
          <X size={16} weight="bold" />
        </button>
      </motion.div>
    </div>
  );
}
