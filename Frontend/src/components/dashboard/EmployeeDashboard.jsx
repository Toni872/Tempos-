import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Play,
  Stop,
  Pause,
  MapPin,
  User,
  Calendar,
  FileText,
  CalendarX,
  SignOut,
  Lightning,
  ShieldCheck,
  ArrowRight,
  Coffee,
  Timer,
  CheckCircle,
  Warning,
  Pulse,
  MapTrifold,
  Bell,
  CaretRight,
  Fingerprint,
  SquaresFour,
} from '@phosphor-icons/react';
import { Capacitor } from '@capacitor/core';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

// Tab names
const TABS = {
  CLOCK: 'fichar',
  HISTORY: 'historial',
  ABSENCES: 'ausencias',
  PROFILE: 'perfil',
};

/**
 * EmployeeDashboard — Interfaz completa para el empleado.
 * Premium, minimalista, centrada en el fichaje automático.
 * SIN funciones de administración.
 */
export default function EmployeeDashboard({
  profile,
  clockedIn,
  isOnBreak,
  activeFicha,
  elapsedTime = '00:00:00',
  registros = [],
  absences = [],
  workCenters = [],
  onClockToggle,
  onBreakToggle,
  onRequestAbsence,
  onLogout,
  // Auto-clock data
  autoClockStatus = 'idle',
  autoClockCenter = null,
  autoClockDistance = null,
  error = '',
  success = '',
}) {
  const [activeTab, setActiveTab] = useState(TABS.CLOCK);
  const isMobile = useMemo(() => Capacitor.isNativePlatform(), []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches';
  const displayName = profile?.displayName?.split(' ')[0] || 'Empleado';

  // Stats personales
  const todayFichas = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return (registros || []).filter(r => r.startTime?.includes(today));
  }, [registros]);

  const weekHours = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return (registros || []).reduce((acc, r) => {
      const start = new Date(r.startTime);
      if (start >= startOfWeek && r.totalMinutes) {
        return acc + (r.totalMinutes / 60);
      }
      return acc;
    }, 0).toFixed(1);
  }, [registros]);

  // ─── Render Tab Content ──────────────────────────────

  const renderClockTab = () => (
    <div className="flex flex-col items-center px-6 pt-4 pb-8">
      {/* Auto-Clock Status Banner */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 border',
            autoClockStatus === 'inside'
              ? 'bg-emerald-500/[0.08] border-emerald-500/20'
              : autoClockStatus === 'checking'
              ? 'bg-blue-500/[0.08] border-blue-500/20'
              : 'bg-white/[0.03] border-white/[0.06]'
          )}
        >
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center',
            autoClockStatus === 'inside' ? 'bg-emerald-500/20' : 'bg-white/[0.06]'
          )}>
            {autoClockStatus === 'inside' ? (
              <ShieldCheck size={18} weight="fill" className="text-emerald-400" />
            ) : autoClockStatus === 'checking' ? (
              <Pulse size={18} weight="bold" className="text-blue-400 animate-pulse" />
            ) : (
              <MapPin size={18} weight="bold" className="text-zinc-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-zinc-300 truncate">
              {autoClockStatus === 'inside'
                ? `Dentro de ${autoClockCenter?.name || 'zona de trabajo'}`
                : autoClockStatus === 'checking'
                ? 'Verificando ubicación...'
                : autoClockStatus === 'outside'
                ? `A ${autoClockDistance}m de ${autoClockCenter?.name || 'tu centro'}`
                : 'Fichaje automático activo'}
            </p>
            <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-wider">
              {autoClockStatus === 'inside' ? 'Fichaje automático' : 'GPS de alta precisión'}
            </p>
          </div>
          {autoClockStatus === 'inside' && (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </motion.div>
      )}

      {/* Reloj Principal Gigante */}
      <div className="relative flex flex-col items-center justify-center my-4">
        {/* Glow */}
        <div className={cn(
          'absolute w-56 h-56 rounded-full blur-[80px] opacity-20 transition-colors duration-1000 pointer-events-none',
          clockedIn ? (isOnBreak ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-blue-600'
        )} />

        {/* Clock Ring */}
        <motion.div
          className={cn(
            'relative w-64 h-64 rounded-full flex flex-col items-center justify-center border-[3px] transition-all duration-700',
            clockedIn
              ? isOnBreak ? 'border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.1)]' : 'border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.1)]'
              : 'border-white/[0.08] shadow-[0_0_60px_rgba(59,130,246,0.05)]'
          )}
        >
          {/* Status indicator */}
          <div className={cn(
            'absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a0c]',
            clockedIn ? (isOnBreak ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-zinc-700'
          )} />

          <motion.span
            key={elapsedTime}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="text-5xl font-black tabular-nums tracking-tight text-white"
          >
            {elapsedTime}
          </motion.span>

          <span className={cn(
            'text-[10px] font-bold uppercase tracking-[0.25em] mt-2',
            clockedIn ? (isOnBreak ? 'text-amber-400' : 'text-emerald-400') : 'text-zinc-600'
          )}>
            {clockedIn
              ? isOnBreak ? '☕ En pausa' : '● Trabajando'
              : 'Sin fichar'}
          </span>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-sm flex flex-col gap-3 mt-8">
        {/* Botón Principal */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onClockToggle}
          className={cn(
            'w-full py-5 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 shadow-lg',
            clockedIn
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white'
              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white'
          )}
        >
          {clockedIn ? (
            <>
              <Stop size={22} weight="fill" />
              Finalizar Jornada
            </>
          ) : (
            <>
              <Play size={22} weight="fill" />
              Iniciar Jornada
            </>
          )}
        </motion.button>

        {/* Botón Pausa (solo si está fichado) */}
        {clockedIn && (
          <motion.button
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBreakToggle}
            className={cn(
              'w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2.5 border transition-all',
              isOnBreak
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
                : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06]'
            )}
          >
            {isOnBreak ? (
              <>
                <Play size={18} weight="fill" />
                Reanudar Trabajo
              </>
            ) : (
              <>
                <Coffee size={18} weight="duotone" />
                Tomar Pausa
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mt-8">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">Hoy</p>
          <p className="text-2xl font-black text-white">{todayFichas.length}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">fichajes</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">Esta semana</p>
          <p className="text-2xl font-black text-white">{weekHours}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">horas</p>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="px-6 pt-4 pb-8">
      <h2 className="text-lg font-bold mb-4 text-white">Mis Fichajes</h2>

      {(!registros || registros.length === 0) ? (
        <div className="text-center py-16 text-zinc-600">
          <Clock size={48} weight="duotone" className="mx-auto mb-4 text-zinc-700" />
          <p className="text-sm font-medium">Aún no tienes fichajes registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.slice(0, 20).map((ficha, idx) => {
            // Combinar fecha (YYYY-MM-DD) con hora (HH:mm:ss) para crear un objeto Date válido
            const parseFichaDate = (dateStr, timeStr) => {
              if (!dateStr || !timeStr) return null;
              try {
                // El formato esperado es YYYY-MM-DD y HH:mm[:ss]
                const isoStr = `${dateStr.split('T')[0]}T${timeStr}`;
                const d = new Date(isoStr);
                return isNaN(d.getTime()) ? null : d;
              } catch (e) { return null; }
            };

            const start = parseFichaDate(ficha.date, ficha.startTime);
            const end = parseFichaDate(ficha.date, ficha.endTime);
            const hours = ficha.hoursWorked ? Number(ficha.hoursWorked).toFixed(1) : (ficha.totalMinutes ? (ficha.totalMinutes / 60).toFixed(1) : '—');
            const isToday = start && start.toDateString() === new Date().toDateString();

            return (
              <motion.div
                key={ficha.id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl border transition-all',
                  isToday
                    ? 'bg-blue-500/[0.05] border-blue-500/[0.12]'
                    : 'bg-white/[0.02] border-white/[0.04]'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isToday ? 'bg-blue-500/15' : 'bg-white/[0.04]'
                )}>
                  <Clock size={18} weight={isToday ? 'fill' : 'duotone'} className={isToday ? 'text-blue-400' : 'text-zinc-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate">
                    {start ? start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {start ? start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {end ? ` → ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ' → En curso'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{hours}h</p>
                  <p className={cn(
                    'text-[9px] font-bold uppercase tracking-wider',
                    ficha.status === 'active' ? 'text-emerald-400' : 'text-zinc-600'
                  )}>
                    {ficha.status === 'active' ? 'Activo' : 'Completado'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAbsencesTab = () => (
    <div className="px-6 pt-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Mis Ausencias</h2>
        {onRequestAbsence && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onRequestAbsence}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            Solicitar
          </motion.button>
        )}
      </div>

      {(!absences || absences.length === 0) ? (
        <div className="text-center py-16 text-zinc-600">
          <CalendarX size={48} weight="duotone" className="mx-auto mb-4 text-zinc-700" />
          <p className="text-sm font-medium">Sin solicitudes de ausencia</p>
        </div>
      ) : (
        <div className="space-y-2">
          {absences.map((absence, idx) => (
            <div
              key={absence.id || idx}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                absence.status === 'approved' ? 'bg-emerald-500/15' :
                absence.status === 'rejected' ? 'bg-rose-500/15' :
                'bg-amber-500/15'
              )}>
                {absence.status === 'approved' ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-400" />
                ) : absence.status === 'rejected' ? (
                  <Warning size={18} weight="fill" className="text-rose-400" />
                ) : (
                  <Clock size={18} weight="duotone" className="text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white truncate">{absence.type || 'Ausencia'}</p>
                <p className="text-[11px] text-zinc-500">
                  {absence.startDate ? new Date(absence.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}
                  {absence.endDate ? ` → ${new Date(absence.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
                </p>
              </div>
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full',
                absence.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                absence.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                'bg-amber-500/10 text-amber-400'
              )}>
                {absence.status === 'approved' ? 'Aprobada' :
                 absence.status === 'rejected' ? 'Rechazada' :
                 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="px-6 pt-4 pb-8">
      {/* Profile Card */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-600/20">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <User size={28} weight="fill" className="text-white" />
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{profile?.displayName || 'Empleado'}</p>
            <p className="text-sm text-zinc-500">{profile?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Empresa</p>
            <p className="text-sm font-bold text-white mt-1 truncate">{profile?.companyId || '—'}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">Estado</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">Activo</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Fingerprint size={18} weight="duotone" className="text-blue-400" />
          Seguridad del Dispositivo
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400">Dispositivo vinculado</span>
            <span className={cn(
              'text-[11px] font-bold px-2.5 py-1 rounded-full',
              profile?.hasDeviceBound
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            )}>
              {profile?.hasDeviceBound ? '✓ Vinculado' : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-zinc-400">Geolocalización</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              ✓ Activa
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onLogout}
        className="w-full py-4 rounded-2xl border border-rose-500/20 bg-rose-500/[0.05] text-rose-400 font-semibold text-sm flex items-center justify-center gap-2"
      >
        <SignOut size={18} weight="bold" />
        Cerrar Sesión
      </motion.button>
    </div>
  );

  // ─── Main Render ─────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans flex flex-col overflow-hidden">
      {/* Feedback Toasts */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] px-6"
          >
            <div className={cn(
              "max-w-sm mx-auto p-4 rounded-2xl border shadow-2xl flex items-center gap-3",
              error 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-200" 
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
            )}>
              {error ? <Warning size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
              <p className="text-sm font-medium">{error || success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={cn(
          'absolute top-[-15%] left-[20%] w-[50%] h-[40%] rounded-full blur-[120px] opacity-[0.06] transition-colors duration-1000',
          clockedIn ? (isOnBreak ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-blue-600'
        )} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                <User weight="fill" className="text-blue-400" size={18} />
              )}
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">{greeting}</p>
              <p className="text-sm font-bold text-white">{displayName}</p>
            </div>
          </div>
            <Logo size="xs" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === TABS.CLOCK && renderClockTab()}
            {activeTab === TABS.HISTORY && renderHistoryTab()}
            {activeTab === TABS.ABSENCES && renderAbsencesTab()}
            {activeTab === TABS.PROFILE && renderProfileTab()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="relative z-10 bg-[#0d0d0f]/95 backdrop-blur-xl border-t border-white/[0.04] px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center max-w-sm mx-auto">
          {[
            { id: TABS.CLOCK, icon: Clock, label: 'Fichar' },
            { id: TABS.HISTORY, icon: Timer, label: 'Historial' },
            { id: TABS.ABSENCES, icon: CalendarX, label: 'Ausencias' },
            { id: TABS.PROFILE, icon: User, label: 'Perfil' },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 py-2 px-4 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="employee-tab-indicator"
                    className="absolute -top-0.5 w-8 h-[3px] bg-blue-500 rounded-full"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon
                  size={22}
                  weight={isActive ? 'fill' : 'regular'}
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-blue-400' : 'text-zinc-600'
                  )}
                />
                <span className={cn(
                  'text-[9px] font-bold uppercase tracking-tight transition-colors',
                  isActive ? 'text-blue-400' : 'text-zinc-600'
                )}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
