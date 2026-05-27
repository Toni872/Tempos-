import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersThree, Buildings, FileDoc } from '@phosphor-icons/react';
import Logo from '@/components/ui/Logo';

export default function OnboardingWelcome({ isOpen, onDismiss, onAction }) {
  const options = [
    { key: 'employees', icon: UsersThree, title: 'Invitar empleados', desc: 'Agregá tu equipo para empezar a registrar jornadas' },
    { key: 'workCenters', icon: Buildings, title: 'Configurar sedes', desc: 'Definí los centros de trabajo donde opera tu empresa' },
    { key: 'manual', icon: FileDoc, title: 'Ver manual de usuario', desc: 'Conocé todas las funcionalidades de Tempos' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-6"
          >
            <div className="w-full max-w-lg bg-[#0d0d0f] border border-white/[0.08] rounded-[32px] p-8 shadow-2xl space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Logo />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    ¡Bienvenido a Tempos!
                  </h2>
                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                    Configurá tu espacio de trabajo en pocos pasos y empezá a gestionar tu equipo.
                  </p>
                </div>
              </div>

              {/* Option Cards */}
              <div className="grid gap-3">
                {options.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => onAction(opt.key)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-200 text-left group w-full"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-blue-400" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors">
                          {opt.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                          {opt.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="text-center">
                <button
                  onClick={onDismiss}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 active:scale-95"
                >
                  Comenzar
                </button>
                <p className="text-[10px] text-zinc-600 mt-3">
                  Podés retomar estos pasos más tarde desde el panel lateral
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
