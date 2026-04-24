import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  MapPin, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Building2,
  ClipboardList,
  FileCheck,
  Wallet,
  Settings
} from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { group: 'General', items: [
    { name: 'Inicio', icon: LayoutDashboard },
    { name: 'Equipo', icon: Users },
    { name: 'Registros', icon: ClipboardList },
    { name: 'Sedes', icon: MapPin },
    { name: 'Horarios', icon: Clock },
    { name: 'Ausencias', icon: Calendar },
    { name: 'Documentos', icon: FileCheck },
  ] },
  { group: 'Análisis', items: [
    { name: 'Análisis', icon: BarChart3 },
    { name: 'Informes', icon: FileText },
    { name: 'Nóminas', icon: Wallet },
    { name: 'Mensajes', icon: MessageSquare },
  ] },
  { group: 'Configuración', items: [
    { name: 'Mi Empresa', icon: Building2 },
    { name: 'Mi Perfil', icon: UserCircle },
    { name: 'Ajustes', icon: Settings },
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

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-[#0d0d0f]/80 backdrop-blur-xl sticky top-0 h-screen z-30">
        <div className="p-8 pb-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight">Tempos</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 py-6 scrollbar-hide">
          {sidebarItems.map((group) => {
            const isAdmin = profile?.role === 'admin';
            // Filter items based on role
            const filteredItems = group.items.filter(item => {
              if (isAdmin) return true;
              // Employees only see specific tabs
              const employeeAllowed = ['Inicio', 'Horarios', 'Ausencias', 'Documentos', 'Mensajes', 'Mi Perfil'];
              return employeeAllowed.includes(item.name);
            });

            if (filteredItems.length === 0) return null;

            return (
              <div key={group.group} className="mb-8">
                <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
                  {group.group}
                </h3>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveTab(item.name)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                          isActive 
                            ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" 
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                        {item.name}
                        {isActive && (
                          <motion.div 
                            layoutId="active-pill"
                            className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full"
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

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative z-10">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 bg-[#0a0a0c]/60 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-zinc-400"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">{activeTab}</h1>
              <p className="text-xs text-zinc-500 hidden sm:block">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-zinc-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0a0c]" />
            </button>
            <div className="h-8 w-px bg-white/5 mx-2" />
            <UserMenu onLogout={onLogout} />
          </div>
        </header>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#0d0d0f] z-50 lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-xl">Tempos</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-zinc-500" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto p-4 py-2">
                {sidebarItems.map((group) => {
                  const isAdmin = profile?.role === 'admin';
                  const filteredItems = group.items.filter(item => {
                    if (isAdmin) return true;
                    const employeeAllowed = ['Inicio', 'Horarios', 'Ausencias', 'Documentos', 'Mensajes', 'Mi Perfil', 'Ajustes'];
                    return employeeAllowed.includes(item.name);
                  });
                  if (filteredItems.length === 0) return null;
                  return (
                    <div key={group.group} className="mb-6">
                      <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                        {group.group}
                      </h3>
                      <div className="space-y-1">
                        {filteredItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.name;
                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                setActiveTab(item.name);
                                setIsMobileMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                                isActive ? "text-blue-400 bg-blue-500/10" : "text-zinc-500"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 text-zinc-500 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
