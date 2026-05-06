import { useMemo, useState, useCallback } from 'react';

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SchedulingGrid({ employees = [], schedules = [], assignments = [], onAssign }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const weekDays = useMemo(() => {
    const monday = getMonday(viewDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [viewDate]);

  const navigateWeek = useCallback((direction) => {
    setViewDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * 7);
      return next;
    });
  }, []);

  const getDaySchedule = useCallback((userId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

    const assignment = assignments.find(a => {
      if (a.userId !== userId) return false;
      return dateStr >= a.startDate && dateStr <= (a.endDate || '9999-12-31');
    });
    if (!assignment) return null;

    const schedule = schedules.find(s => s.id === assignment.scheduleId);
    if (!schedule?.daysOfWeek?.includes(dayOfWeek)) return null;
    return schedule;
  }, [assignments, schedules]);

  const todayStr = useMemo(() => new Date().toDateString(), []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-[#141414]/80 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Planificador Semanal</h3>
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
            <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white/80 min-w-[140px] text-center">
              Semana {weekDays[0].getDate()} - {weekDays[6].getDate()} {weekDays[6].toLocaleString('es-ES', { month: 'short' })}
            </div>
            <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tighter text-white/20">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Mañana</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500" /> Tarde</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-white/10" /> Libre</div>
          </div>
        </div>
      </div>

      <div className="bg-[#0d0d0f] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="sticky left-0 z-10 bg-[#0d0d0f] p-6 text-left border-r border-white/5 min-w-[240px]">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Plantilla</span>
                </th>
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === todayStr;
                  return (
                    <th key={i} className={`p-4 text-center border-r border-white/5 min-w-[120px] ${isToday ? 'bg-blue-500/5' : ''}`}>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">{d.toLocaleString('es-ES', { weekday: 'short' })}</div>
                      <div className={`text-xl font-black ${isToday ? 'text-blue-400' : 'text-white'}`}>{d.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map((emp, empIdx) => (
                <tr key={emp.id || emp.uid || empIdx} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="sticky left-0 z-10 bg-[#0d0d0f] p-4 border-r border-white/5 group-hover:bg-[#111113]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center text-xs font-black text-white/40 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                        {(emp.displayName || emp.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{emp.displayName || emp.email?.split('@')[0]}</div>
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-tighter">{emp.role === 'admin' ? 'Admin' : 'Personal'}</div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((date, idx) => {
                    const sch = getDaySchedule(emp.id, date);
                    const isToday = date.toDateString() === todayStr;
                    const isMorning = sch && parseInt(sch.startTime, 10) < 14;

                    return (
                      <td
                        key={idx}
                        className={`p-2 border-r border-white/5 transition-all relative ${isToday ? 'bg-blue-500/[0.02]' : ''}`}
                        onClick={() => onAssign?.(emp, date)}
                      >
                        {sch ? (
                          <div className={`h-full w-full rounded-2xl p-3 border cursor-pointer shadow-lg ${
                            isMorning
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          }`}>
                            <div className="text-[10px] font-black uppercase tracking-tighter mb-1 truncate">{sch.name}</div>
                            <div className="text-xs font-black tracking-tight">{sch.startTime} - {sch.endTime}</div>
                          </div>
                        ) : (
                          <div className="h-full w-full min-h-[60px] rounded-2xl border border-dashed border-white/5 group-hover:border-white/10 transition-colors flex items-center justify-center cursor-pointer hover:bg-white/[0.03]">
                            <svg className="w-4 h-4 text-white/0 group-hover:text-white/10 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-6 px-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Capacidad Óptima</span>
        </div>
        <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">Haz clic en cualquier celda para reasignar turnos dinámicamente</p>
      </div>
    </div>
  );
}
