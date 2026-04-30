import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SquaresFour,
  UsersThree,
  ClockCountdown,
  CalendarBlank,
  NavigationArrow,
  FileDoc,
  ChatTeardrop,
  ChartLineUp,
  UserCircleGear,
  SignOut,
  List,
  X,
  BellRinging,
  Buildings,
  ClipboardText,
  CurrencyCircleDollar,
  GearSix,
  CalendarX,
  ShieldCheck,
} from '@phosphor-icons/react';
import UserMenu from '@/components/UserMenu';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { group: 'General', items: [
    { name: 'Inicio', icon: SquaresFour },
    { name: 'GeoMapa', icon: NavigationArrow },
    { name: 'Equipo', icon: UsersThree },
    { name: 'Registros', icon: ClipboardText },
    { name: 'Sedes', icon: Buildings },
    { name: 'Horarios', icon: ClockCountdown },
    { name: 'Ausencias', icon: CalendarX },
    { name: 'Documentos', icon: FileDoc },
  ] },
  { group: 'Análisis', items: [
    { name: 'Análisis', icon: ChartLineUp },
    { name: 'Informes', icon: ClipboardText },
    { name: 'Nóminas', icon: CurrencyCircleDollar },
    { name: 'Mensajes', icon: ChatTeardrop },
  ] },
  { group: 'Configuración', items: [
    { name: 'Mi Empresa', icon: GearSix },
    { name: 'Legal', icon: ShieldCheck },
    { name: 'Mi Perfil', icon: UserCircleGear },
  ] }
];

export default function DashboardShell({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  profile, 
  children 
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <nav className={cn("flex-1 overflow-y-auto scrollbar-hide", isMobile ? "p-4 py-2" : "p-4 py-6")}>
        {sidebarItems.map((group) => {
          return (
            <div key={group.group} className={cn(isMobile ? "mb-6" : "mb-8")}>
              <h3 className="px-4 text-[10px] font-extrabold text-zinc-600 uppercase tracking-[0.2em] mb-3">
                {group.group}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name);
                        if (isMobile) setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 group relative",
                        isActive 
                          ? "text-blue-400 bg-blue-500/[0.08] border border-blue-500/[0.15]" 
                          : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      <Icon 
                        className={cn("w-[18px] h-[18px]", isActive ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400")} 
                        weight={isActive ? "duotone" : "regular"}
                      />
                      {item.name}
                      {isActive && (
                        <motion.div 
                          layoutId={isMobile ? "active-pill-mobile" : "active-pill"}
                          className="absolute left-0 w-[3px] h-4 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t border-white/[0.04]", isMobile ? "p-6" : "p-4")}>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-zinc-600 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-200"
        >
          <SignOut className="w-[18px] h-[18px]" weight="regular" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex overflow-hidden">
      {/* Background Ambient Light */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-blue-500/[0.03] blur-[100px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-[272px] border-r border-white/[0.04] bg-[#0d0d0f]/80 backdrop-blur-xl sticky top-0 h-screen z-30">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ClockCountdown className="w-5 h-5 text-white" weight="fill" />
          </div>
          <span className="font-['Space_Grotesk'] text-[22px] font-bold tracking-tight">Tempos</span>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* Top Header */}
        <header className="h-[72px] border-b border-white/[0.04] bg-[#0a0a0c]/60 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="w-6 h-6" weight="bold" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white">{activeTab}</h1>
              <p className="text-[11px] text-zinc-600 hidden sm:block font-medium">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-500 hover:text-white transition-colors relative rounded-xl hover:bg-white/[0.04]">
              <BellRinging className="w-5 h-5" weight="duotone" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0a0c] animate-pulse" />
            </button>
            <div className="h-7 w-px bg-white/[0.06] mx-1" />
            <UserMenu onLogout={onLogout} />
          </div>
        </header>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#0d0d0f] z-50 lg:hidden flex flex-col border-r border-white/[0.04]"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <ClockCountdown className="w-4 h-4 text-white" weight="fill" />
                  </div>
                  <span className="font-bold text-xl">Tempos</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" weight="bold" />
                </button>
              </div>
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
