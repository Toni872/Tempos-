import React from 'react';
import { DeviceMobileCamera, DownloadSimple } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function FloatingDownloadBtn() {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => window.open('#', '_blank')} // Aquí iría el link a la Store o PWA
      className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 px-5 py-3.5 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all border border-white/10 backdrop-blur-xl"
    >
      <div className="relative">
        <DeviceMobileCamera weight="duotone" className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border-2 border-blue-600 animate-pulse" />
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Acceso Móvil</span>
        <span className="text-[13px] font-extrabold">Descargar APP</span>
      </div>
      <div className="ml-2 p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
        <DownloadSimple weight="bold" className="w-3.5 h-3.5" />
      </div>
    </motion.button>
  );
}
