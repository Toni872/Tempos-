import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  MapPin, 
  ChevronRight, 
  UserPlus, 
  CalendarDays, 
  Smartphone,
  CheckCircle2,
  Circle,
  Coffee,
  XCircle,
  Search,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OverviewTab({ 
  profile, 
  employees = [],
  registros = [],
  dashboardStats,
  setActiveTab
}) {
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';
  const [searchQuery, setSearchQuery] = useState('');

  // Build employee status from real data
  const employeeStatusList = useMemo(() => {
    if (dashboardStats?.employeeStatusList?.length > 0) {
      return dashboardStats.employeeStatusList;
    }
    // Derive from employees array
    return employees.map(emp => {
      const isWorking = emp.isWorking || emp.status === 'working';
      const isOnBreak = emp.status === 'break';
      let color = 'zinc'; // fuera de jornada
      if (isWorking) color = 'blue';
      else if (isOnBreak) color = 'orange';
      
      return {
        uid: emp.id || emp.uid,
        name: emp.displayName || emp.name || emp.email || 'Empleado',
        email: emp.email || '',
        color,
        lastAction: emp.lastClockIn 
          ? new Date(emp.lastClockIn).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : 'Ninguna'
      };
    });
  }, [employees, dashboardStats]);

  // Compute metrics from real data
  const metrics = useMemo(() => {
    if (dashboardStats?.metrics) return dashboardStats.metrics;
    const working = employeeStatusList.filter(e => e.color === 'blue').length;
    const onBreak = employeeStatusList.filter(e => e.color === 'orange').length;
    const outside = employeeStatusList.filter(e => e.color === 'zinc' || e.color === 'cyan').length;
    return {
      working,
      onBreak,
      outside,
      registered: employees.length
    };
  }, [employees, employeeStatusList, dashboardStats]);

  // Build recent activity from registros
  const recentActivity = useMemo(() => {
    if (dashboardStats?.recentActivity?.length > 0) return dashboardStats.recentActivity;
    // Build from registros (fichas)
    const today = new Date().toISOString().split('T')[0];
    return registros
      .filter(r => {
        const rDate = r.startTime ? r.startTime.split('T')[0] : r.createdAt?.split('T')[0];
        return rDate === today;
      })
      .slice(0, 15)
      .map((r, i) => ({
        id: r.id || i,
        action: r.endTime ? 'salida' : 'entrada',
        createdAt: r.endTime || r.startTime || r.createdAt,
        user: { displayName: r.userName || r.user?.displayName || 'Empleado' }
      }));
  }, [registros, dashboardStats]);

  // Filter status list by search
  const filteredStatusList = useMemo(() => {
    if (!searchQuery.trim()) return employeeStatusList;
    const q = searchQuery.toLowerCase();
    return employeeStatusList.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.email && e.email.toLowerCase().includes(q))
    );
  }, [employeeStatusList, searchQuery]);

  // Determine onboarding progress
  const hasEmployees = employees.length > 0;
  const hasSchedules = dashboardStats?.hasSchedules || false;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Onboarding Header (Pasos) */}
      {isAdmin && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden rounded-xl border border-white/5 bg-[#111114]">
          <OnboardingStep 
            step={1} 
            title="Alta empleados" 
            description="Crea un usuario para cada empleado para que puedan acceder a la app de fichaje o consultar sus datos."
            active={true}
            completed={hasEmployees}
            icon={UserPlus}
            color="bg-blue-700"
            onClick={() => setActiveTab?.('Equipo')}
          />
          <OnboardingStep 
            step={2} 
            title="Asigna el horario laboral" 
            description="Cada empleado deberá tener un horario y recibirá recordatorios de fichajes a sus horas de entrada y salida."
            active={hasEmployees}
            completed={hasSchedules}
            icon={CalendarDays}
            color={hasEmployees ? "bg-blue-700" : "bg-zinc-800"}
            onClick={() => setActiveTab?.('Horarios')}
          />
          <OnboardingStep 
            step={3} 
            title="Descarga APP" 
            description="Una vez creados, proporciona a tus empleados su usuario y contraseña para que comiencen a usar la app."
            active={hasEmployees && hasSchedules}
            icon={Smartphone}
            color={hasEmployees && hasSchedules ? "bg-blue-700" : "bg-zinc-800"}
          />
        </section>
      )}

      {/* 2. Resumen de Estados (4 Contadores de Color) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox 
          label="Empleados Trabajando" 
          value={metrics.working} 
          icon={Clock} 
          color="bg-[#0028a3]" 
        />
        <MetricBox 
          label="Empleados en Pausa" 
          value={metrics.onBreak} 
          icon={Coffee} 
          color="bg-[#ed8115]" 
        />
        <MetricBox 
          label="Fuera de Jornada Laboral" 
          value={metrics.outside} 
          icon={XCircle} 
          color="bg-[#00a8c2]" 
        />
        <MetricBox 
          label="Empleados Registrados" 
          value={metrics.registered} 
          icon={Users} 
          color="bg-[#2a8d55]" 
        />
      </section>

      {/* 3. Main Content: Table & Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Tabla: Estado de los Empleados */}
        <div className="xl:col-span-2 bg-[#111114] border border-white/5 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Estado de los Empleados</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 border-none rounded-md py-1.5 pl-8 pr-4 text-[11px] focus:ring-1 focus:ring-blue-600/50 outline-none w-48 text-zinc-300" 
              />
            </div>
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-16">Estado</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nombre</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Última Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStatusList.length > 0 ? filteredStatusList.map((emp) => (
                  <tr key={emp.uid} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-center">
                       <StatusBullet color={emp.color} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                          {emp.name}
                        </span>
                        {emp.email && (
                          <span className="text-[10px] text-zinc-600">{emp.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {emp.lastAction !== 'Ninguna' ? emp.lastAction : '—'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      {employees.length === 0 ? (
                        <div className="space-y-3">
                          <Users className="w-10 h-10 text-zinc-800 mx-auto" />
                          <p className="text-sm text-zinc-600 font-medium">No hay empleados registrados</p>
                          {isAdmin && (
                            <button 
                              onClick={() => setActiveTab?.('Equipo')}
                              className="text-xs text-blue-500 hover:text-blue-400 font-bold"
                            >
                              Añadir tu primer empleado →
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600 italic">No se encontraron resultados para "{searchQuery}"</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between">
            <p className="text-[10px] text-zinc-500">
              Mostrando {filteredStatusList.length} de {employees.length} empleados registrados
            </p>
            <button 
              onClick={() => setActiveTab?.('Equipo')}
              className="bg-blue-700/80 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-3 rounded uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              Ver listado empleados
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Listado: Fichajes del día */}
        <div className="bg-[#111114] border border-white/5 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-zinc-900/40 flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Fichajes del día</h3>
            <span className="text-[10px] text-zinc-500 font-medium">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar max-h-[480px]">
            {recentActivity.length > 0 ? recentActivity.map((event) => (
              <ActivityItem key={event.id} event={event} />
            )) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-zinc-700" />
                </div>
                <p className="text-xs text-zinc-600 font-bold uppercase tracking-tight">No hay fichajes registrados hoy</p>
                <p className="text-[10px] text-zinc-700 mt-1">Los fichajes aparecerán aquí en tiempo real</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
              {recentActivity.length} fichaje{recentActivity.length !== 1 ? 's' : ''} hoy
            </span>
            <button 
              onClick={() => setActiveTab?.('Registros')}
              className="text-[10px] text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}

function OnboardingStep({ step, title, description, active, completed, icon: Icon, color, onClick }) {
  return (
    <div 
      className={cn(
        "p-6 flex gap-4 transition-all border-r border-white/5 last:border-r-0",
        active ? "opacity-100 cursor-pointer hover:bg-white/[0.02]" : "opacity-40 grayscale cursor-not-allowed"
      )}
      onClick={active ? onClick : undefined}
    >
      <div className={cn(
        "w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-white shadow-lg relative", 
        completed ? "bg-emerald-600" : color
      )}>
        {completed ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <div className="space-y-1">
        <h4 className={cn("text-xs font-bold uppercase tracking-wider", active ? "text-white" : "text-zinc-500")}>
          {title}
        </h4>
        <p className="text-[10px] leading-relaxed text-zinc-500 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, icon: Icon, color }) {
  return (
    <div className={cn("p-6 rounded-md shadow-lg flex items-center justify-between transition-transform hover:scale-[1.02] cursor-default", color)}>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-extrabold text-white">{value}</p>
      </div>
      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
        <Icon className="w-5 h-5 text-white/40" />
      </div>
    </div>
  );
}

function StatusBullet({ color }) {
  const colors = {
    blue: "bg-[#0028a3]",
    orange: "bg-[#ed8115]",
    cyan: "bg-[#00a8c2]",
    green: "bg-emerald-600",
    zinc: "bg-zinc-700"
  };
  
  return (
    <div className="flex justify-center">
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shadow-inner pt-0.5", colors[color] || colors.zinc)}>
        <Circle className="w-3 h-3 text-white/50 fill-white/10" />
      </div>
    </div>
  );
}

function ActivityItem({ event }) {
  const action = (event.action || '').toLowerCase();
  const isClockIn = action.includes('clockin') || action.includes('entrada') || action.includes('clock_in');
  const isClockOut = action.includes('clockout') || action.includes('salida') || action.includes('clock_out');
  const isBreak = action.includes('break') || action.includes('pausa');

  const actionText = isClockIn ? 'ENTRADA' : isClockOut ? 'SALIDA' : isBreak ? 'PAUSA' : (event.action || 'ACCIÓN').toUpperCase();
  const actionColor = isClockIn ? 'text-emerald-500' : isClockOut ? 'text-rose-400' : isBreak ? 'text-amber-500' : 'text-blue-400';
  const timeStr = new Date(event.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all">
      <div className="space-y-0.5 min-w-0">
        <p className="text-[11px] font-bold text-zinc-300 truncate">{event.user?.displayName || 'Empleado'}</p>
        <p className={cn("text-[9px] font-bold tracking-wider", actionColor)}>{actionText}</p>
      </div>
      <div className="px-2 py-1 bg-black/20 rounded border border-white/5">
        <span className="text-[11px] font-mono font-bold text-blue-500">{timeStr}</span>
      </div>
    </div>
  );
}
