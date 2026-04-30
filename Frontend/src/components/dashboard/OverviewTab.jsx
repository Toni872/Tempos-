import React, { useState, useMemo } from 'react';
import { 
  UsersThree, 
  ClockCountdown, 
  UserPlus, 
  CalendarBlank, 
  DeviceMobileCamera,
  CheckCircle,
  Circle,
  CoffeeBean,
  Prohibit,
  MagnifyingGlass,
  CaretRight,
} from '@phosphor-icons/react';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import MapaAuditoria from './MapaAuditoria';

export default function OverviewTab({ 
  profile, 
  employees = [],
  registros = [],
  dashboardStats,
  setActiveTab,
  workCenters = []
}) {
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';
  const [searchQuery, setSearchQuery] = useState('');

  // Build employee status from real data
  const employeeStatusList = useMemo(() => {
    if (dashboardStats?.employeeStatusList?.length > 0) {
      return dashboardStats.employeeStatusList;
    }
    return employees.map(emp => {
      const isWorking = emp.isWorking || emp.status === 'working';
      const isOnBreak = emp.status === 'break';
      let color = 'zinc';
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

  const metrics = useMemo(() => {
    if (dashboardStats?.metrics) return dashboardStats.metrics;
    const working = employeeStatusList.filter(e => e.color === 'blue').length;
    const onBreak = employeeStatusList.filter(e => e.color === 'orange').length;
    const outside = employeeStatusList.filter(e => e.color === 'zinc' || e.color === 'cyan').length;
    return { working, onBreak, outside, registered: employees.length };
  }, [employees, employeeStatusList, dashboardStats]);

  const recentActivity = useMemo(() => {
    if (dashboardStats?.recentActivity?.length > 0) return dashboardStats.recentActivity;
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

  const filteredStatusList = useMemo(() => {
    if (!searchQuery.trim()) return employeeStatusList;
    const q = searchQuery.toLowerCase();
    return employeeStatusList.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.email && e.email.toLowerCase().includes(q))
    );
  }, [employeeStatusList, searchQuery]);

  const hasEmployees = employees.length > 0;
  const hasSchedules = dashboardStats?.hasSchedules || false;

  return (
    <div className="space-y-8">
      
      {/* Onboarding Steps */}
      {isAdmin && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-0 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#111114]">
          <OnboardingStep 
            step={1} 
            title="Alta empleados" 
            description="Crea un usuario para cada empleado para que puedan acceder a la app."
            active={true}
            completed={hasEmployees}
            icon={UserPlus}
            onClick={() => setActiveTab?.('Equipo')}
          />
          <OnboardingStep 
            step={2} 
            title="Asigna el horario" 
            description="Cada empleado recibirá recordatorios de fichajes a sus horas de turno."
            active={hasEmployees}
            completed={hasSchedules}
            icon={CalendarBlank}
            onClick={() => setActiveTab?.('Horarios')}
          />
          <OnboardingStep 
            step={3} 
            title="Descarga APP" 
            description="Proporciona a tus empleados su usuario y contraseña para la app."
            active={hasEmployees && hasSchedules}
            icon={DeviceMobileCamera}
          />
        </section>
      )}

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Trabajando" value={metrics.working} icon={ClockCountdown} color="blue" />
        <StatCard label="En Pausa" value={metrics.onBreak} icon={CoffeeBean} color="orange" />
        <StatCard label="Fuera de Jornada" value={metrics.outside} icon={Prohibit} color="cyan" />
        <StatCard label="Registrados" value={metrics.registered} icon={UsersThree} color="emerald" />
      </section>

      {/* Gráfico Analítico Recharts */}
      <section className="rounded-[24px] border border-white/[0.06] bg-[#111114] overflow-hidden p-6 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <h3 className="font-extrabold text-[11px] uppercase tracking-[0.15em] text-zinc-500 mb-6 relative z-10">Productividad Semanal (Horas)</h3>
        <div className="h-[220px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Lun', horas: 8.5 }, { name: 'Mar', horas: 7.2 }, { name: 'Mié', horas: 9.1 },
              { name: 'Jue', horas: 8.0 }, { name: 'Vie', horas: 6.5 }, { name: 'Sáb', horas: 0 }, { name: 'Dom', horas: 0 }
            ]}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              />
              <Bar dataKey="horas" radius={[6, 6, 0, 0]} barSize={32}>
                {
                  [8.5, 7.2, 9.1, 8.0, 6.5, 0, 0].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry > 8 ? '#3b82f6' : entry > 0 ? '#6366f1' : '#27272a'} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Mini Mapa de Actividad */}
      <section className="rounded-[24px] border border-white/[0.06] bg-[#111114] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04]">
           <h3 className="font-extrabold text-[11px] uppercase tracking-[0.15em] text-zinc-500">Actividad Geográfica Hoy</h3>
        </div>
        <div className="h-[300px]">
          <MapaAuditoria 
            fichas={registros} 
            workCenters={workCenters} 
            employees={employees} 
          />
        </div>
      </section>

      {/* Main Content: Table & Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Employee Status Table */}
        <div className="xl:col-span-2 bg-[#111114] border border-white/[0.06] rounded-[20px] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <h3 className="font-extrabold text-[11px] uppercase tracking-[0.15em] text-zinc-500">Estado de los Empleados</h3>
            <div className="relative">
              <MagnifyingGlass className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" weight="bold" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl py-1.5 pl-8 pr-4 text-[11px] focus:ring-1 focus:ring-blue-600/50 outline-none w-48 text-zinc-300 placeholder:text-zinc-700 font-medium transition-all" 
              />
            </div>
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-6 py-3 text-[10px] font-extrabold text-zinc-600 uppercase tracking-[0.15em] text-center w-16">Estado</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-zinc-600 uppercase tracking-[0.15em]">Nombre</th>
                  <th className="px-6 py-3 text-[10px] font-extrabold text-zinc-600 uppercase tracking-[0.15em] text-right">Última Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredStatusList.length > 0 ? filteredStatusList.map((emp) => (
                  <tr key={emp.uid} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-3.5 text-center">
                       <StatusBullet color={emp.color} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">{emp.name}</span>
                        {emp.email && <span className="text-[10px] text-zinc-700 font-medium">{emp.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-[11px] text-zinc-600 font-mono font-semibold">
                        {emp.lastAction !== 'Ninguna' ? emp.lastAction : '—'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      {employees.length === 0 ? (
                        <EmptyState
                          icon={UsersThree}
                          title="Sin empleados"
                          subtitle="Añade tu primer empleado para empezar."
                          actionLabel={isAdmin ? "Añadir empleado" : undefined}
                          onAction={isAdmin ? () => setActiveTab?.('Equipo') : undefined}
                        />
                      ) : (
                        <p className="text-sm text-zinc-600 italic">No se encontraron resultados para "{searchQuery}"</p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3.5 border-t border-white/[0.04] flex items-center justify-between">
            <p className="text-[10px] text-zinc-600 font-medium">
              {filteredStatusList.length} de {employees.length} empleados
            </p>
            <button 
              onClick={() => setActiveTab?.('Equipo')}
              className="bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-extrabold py-1.5 px-4 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              Ver listado
              <CaretRight className="w-3 h-3" weight="bold" />
            </button>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-[#111114] border border-white/[0.06] rounded-[20px] flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
            <h3 className="font-extrabold text-[11px] uppercase tracking-[0.15em] text-zinc-500">Fichajes del día</h3>
            <span className="text-[10px] text-zinc-600 font-semibold">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide max-h-[480px]">
            {recentActivity.length > 0 ? recentActivity.map((event) => (
              <ActivityItem key={event.id} event={event} />
            )) : (
              <EmptyState
                icon={ClockCountdown}
                title="Sin fichajes hoy"
                subtitle="Los fichajes aparecerán aquí en tiempo real."
              />
            )}
          </div>
          <div className="px-5 py-3.5 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase tracking-[0.12em] font-extrabold">
              {recentActivity.length} fichaje{recentActivity.length !== 1 ? 's' : ''} hoy
            </span>
            <button 
              onClick={() => setActiveTab?.('Registros')}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-extrabold flex items-center gap-1 transition-colors"
            >
              Ver todos <CaretRight className="w-3 h-3" weight="bold" />
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}

function OnboardingStep({ step, title, description, active, completed, icon: Icon, onClick }) {
  return (
    <div 
      className={cn(
        "p-6 flex gap-4 transition-all border-r border-white/[0.04] last:border-r-0",
        active ? "opacity-100 cursor-pointer hover:bg-white/[0.02]" : "opacity-30 grayscale cursor-not-allowed"
      )}
      onClick={active ? onClick : undefined}
    >
      <div className={cn(
        "w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-extrabold text-white shadow-lg relative", 
        completed ? "bg-emerald-600 shadow-emerald-600/20" : "bg-blue-600 shadow-blue-600/20"
      )}>
        {completed ? <CheckCircle className="w-5 h-5" weight="fill" /> : step}
      </div>
      <div className="space-y-1 min-w-0">
        <h4 className={cn("text-xs font-extrabold uppercase tracking-wider", active ? "text-white" : "text-zinc-500")}>
          {title}
        </h4>
        <p className="text-[10px] leading-relaxed text-zinc-600 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

function StatusBullet({ color }) {
  const colors = {
    blue: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]",
    orange: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]",
    cyan: "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]",
    green: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    zinc: "bg-zinc-600"
  };
  
  return (
    <div className="flex justify-center">
      <div className={cn("w-2.5 h-2.5 rounded-full transition-all", colors[color] || colors.zinc)} />
    </div>
  );
}

function ActivityItem({ event }) {
  const action = (event.action || '').toLowerCase();
  const isClockIn = action.includes('clockin') || action.includes('entrada') || action.includes('clock_in');
  const isClockOut = action.includes('clockout') || action.includes('salida') || action.includes('clock_out');
  const isBreak = action.includes('break') || action.includes('pausa');

  const actionText = isClockIn ? 'ENTRADA' : isClockOut ? 'SALIDA' : isBreak ? 'PAUSA' : (event.action || 'ACCIÓN').toUpperCase();
  const actionColor = isClockIn ? 'text-emerald-400' : isClockOut ? 'text-rose-400' : isBreak ? 'text-amber-400' : 'text-blue-400';
  const dotColor = isClockIn ? 'bg-emerald-400' : isClockOut ? 'bg-rose-400' : isBreak ? 'bg-amber-400' : 'bg-blue-400';
  const timeStr = new Date(event.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-[14px] bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group">
      <div className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-zinc-300 truncate group-hover:text-white transition-colors">{event.user?.displayName || 'Empleado'}</p>
        <p className={cn("text-[9px] font-extrabold tracking-wider", actionColor)}>{actionText}</p>
      </div>
      <span className="text-[11px] font-mono font-semibold text-zinc-500 tabular-nums">{timeStr}</span>
    </div>
  );
}
