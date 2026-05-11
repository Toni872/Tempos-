import React, { useMemo, useState } from 'react';
import { 
  ClockCountdown, 
  Plus, 
  CalendarBlank, 
  Repeat, 
  Timer,
  TrashSimple,
  PencilSimple,
  Sun,
  Moon,
  List,
  Calendar as CalendarIcon,
  Warning,
  ArrowRight
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';

export default function HorariosTab({ schedules = [], onAdd, onEdit, onDelete }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'list'

  const calendarEvents = useMemo(() => {
    const events = [];
    schedules.forEach(s => {
      const mappedDays = (s.days || s.daysOfWeek || []).map(d => d === 7 ? 0 : d);
      
      // Evento Turno 1
      events.push({
        id: `${s.id}-t1`,
        title: `${s.name} (T1)`,
        startTime: s.startTime,
        endTime: s.endTime,
        daysOfWeek: mappedDays,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        textColor: '#60a5fa',
        extendedProps: { originalData: s }
      });

      // Evento Turno 2 (si existe)
      if (s.startTime2 && s.endTime2) {
        events.push({
          id: `${s.id}-t2`,
          title: `${s.name} (T2)`,
          startTime: s.startTime2,
          endTime: s.endTime2,
          daysOfWeek: mappedDays,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          textColor: '#a5b4fc',
          extendedProps: { originalData: s }
        });
      }
    });
    return events;
  }, [schedules]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <SectionHeader 
          icon={CalendarIcon}
          title="Gestión de Jornadas"
          subtitle="Configura jornadas continuas o partidas para tu equipo con precisión quirúrgica."
          actionLabel="Nueva Plantilla"
          actionIcon={Plus}
          onAction={onAdd}
        />
        
        <div className="flex bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5 shadow-inner self-start">
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
              viewMode === 'calendar' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/30 hover:text-white"
            )}
          >
            <CalendarIcon size={16} weight="fill" />
            Calendario
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
              viewMode === 'list' ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-white/30 hover:text-white"
            )}
          >
            <List size={16} weight="fill" />
            Listado
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl"
        >
          {viewMode === 'list' ? (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Plantilla</th>
                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Jornada</th>
                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Días</th>
                    <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {schedules.length ? schedules.map((row) => {
                    const isSplit = !!(row.startTime2 && row.endTime2);
                    return (
                      <tr key={row.id} className="hover:bg-white/[0.03] transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/5">
                               <CalendarBlank weight="fill" />
                            </div>
                            <div className="min-w-0">
                               <div className="font-black text-white text-xs tracking-tight uppercase italic">{row.name}</div>
                               <Badge color={isSplit ? 'indigo' : 'blue'}>{isSplit ? 'PARTIDA' : 'CONTINUA'}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="space-y-2">
                              {/* T1 */}
                              <div className="flex items-center gap-3">
                                 <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-[8px] font-black border border-orange-500/20">T1</div>
                                 <div className="flex items-center gap-2 font-mono text-[11px] font-black text-white">
                                    <span>{row.startTime}</span>
                                    <ArrowRight size={10} className="text-white/20" />
                                    <span>{row.endTime}</span>
                                 </div>
                              </div>
                              {/* T2 */}
                              {isSplit && (
                                <div className="flex items-center gap-3">
                                   <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-[8px] font-black border border-indigo-500/20">T2</div>
                                   <div className="flex items-center gap-2 font-mono text-[11px] font-black text-white">
                                      <span>{row.startTime2}</span>
                                      <ArrowRight size={10} className="text-white/20" />
                                      <span>{row.endTime2}</span>
                                   </div>
                                </div>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-1.5">
                            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia, idx) => {
                              const daysArray = row.days || row.daysOfWeek || [];
                              const isSelected = daysArray.includes(idx + 1);
                              return (
                                <div 
                                  key={idx} 
                                  className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-all border",
                                    isSelected ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-white/[0.03] border-white/5 text-white/10"
                                  )}
                                >
                                  {dia}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <ActionBtn onClick={() => onEdit(row)} icon={PencilSimple} color="zinc" />
                             <ActionBtn onClick={() => onDelete(row)} icon={TrashSimple} color="rose" />
                          </div>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-10">
                          <Warning size={64} weight="duotone" />
                          <p className="text-xs font-black uppercase tracking-[0.4em]">Sin jornadas configuradas</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 h-[750px] fc-theme-dark overflow-hidden">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
                events={calendarEvents}
                locale="es"
                firstDay={1}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                expandRows={true}
                height="100%"
                eventClick={(info) => onEdit(info.event.extendedProps.originalData)}
                eventClassNames="rounded-xl border shadow-2xl cursor-pointer hover:scale-[1.02] transition-all font-black text-[10px] uppercase tracking-widest p-2 italic"
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .fc-theme-dark {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-neutral-text-color: rgba(255, 255, 255, 0.2);
          --fc-border-color: rgba(255, 255, 255, 0.05);
          --fc-button-text-color: rgba(255, 255, 255, 0.4);
          --fc-button-bg-color: rgba(255, 255, 255, 0.03);
          --fc-button-border-color: rgba(255, 255, 255, 0.05);
          --fc-button-hover-bg-color: rgba(255, 255, 255, 0.1);
          --fc-button-hover-border-color: rgba(255, 255, 255, 0.2);
          --fc-button-active-bg-color: #3b82f6;
          --fc-button-active-border-color: #2563eb;
          --fc-button-active-text-color: #ffffff;
          --fc-today-bg-color: rgba(59, 130, 246, 0.03);
        }
        .fc .fc-toolbar-title { font-size: 1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.2em; font-style: italic; }
        .fc .fc-col-header-cell-cushion { padding: 15px; color: rgba(255,255,255,0.4); font-weight: 900; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.2em; }
        .fc .fc-timegrid-slot-label-cushion { color: rgba(255,255,255,0.15); font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .fc .fc-timegrid-now-indicator-line { border-color: #3b82f6; }
        .fc .fc-button-primary { border-radius: 12px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .fc .fc-button-primary:focus { box-shadow: none !important; }
      `}</style>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, color }) {
  const colors = {
    rose: "text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30",
    zinc: "text-white/20 hover:bg-white/10 hover:border-white/20 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "p-3 rounded-2xl bg-white/[0.03] border border-transparent transition-all",
        colors[color]
      )}
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}
