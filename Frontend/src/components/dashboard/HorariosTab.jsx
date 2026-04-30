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
  Calendar as CalendarIcon
} from '@phosphor-icons/react';
import ModernTable from './ModernTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function HorariosTab({ schedules = [], onAdd, onEdit, onDelete }) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' o 'list'

  const columns = [
    { 
      header: 'Nombre del Horario', 
      cell: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
             <CalendarBlank weight="duotone" className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-zinc-100 group-hover:text-white transition-colors">{row.name}</div>
            <div className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-widest">{row.isTemplate ? 'Plantilla Global' : 'Horario Personal'}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Franja Horaria', 
      cell: (row) => {
        const isNight = parseInt(row.startTime?.split(':')[0]) > 20 || parseInt(row.startTime?.split(':')[0]) < 6;
        return (
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-3 py-1.5 rounded-xl border flex items-center gap-2",
              isNight ? "bg-indigo-500/5 border-indigo-500/20 text-indigo-400" : "bg-orange-500/5 border-orange-500/20 text-orange-400"
            )}>
              {isNight ? <Moon className="w-3.5 h-3.5" weight="fill" /> : <Sun className="w-3.5 h-3.5" weight="fill" />}
              <span className="text-sm font-black tabular-nums">{row.startTime} — {row.endTime}</span>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Días Aplicables', 
      cell: (row) => (
        <div className="flex gap-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dia, idx) => {
            const isSelected = row.days?.includes(idx + 1);
            return (
              <div 
                key={dia} 
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                  isSelected ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white/[0.03] text-zinc-700"
                )}
              >
                {dia}
              </div>
            );
          })}
        </div>
      )
    },
    { 
      header: 'Recurrencia', 
      cell: (row) => (
        <Badge color={row.flexible ? 'cyan' : 'blue'}>
          <Repeat className="w-3.5 h-3.5" weight="bold" />
          {row.flexible ? 'Flexible' : 'Fijo'}
        </Badge>
      )
    }
  ];

  // Convertir las plantillas de base de datos al formato de recurrencia de FullCalendar
  const calendarEvents = useMemo(() => {
    return schedules.map(s => {
      // FullCalendar usa 0=Domingo, 1=Lunes. Nuestra BD usa 1=Lunes, 7=Domingo.
      const mappedDays = (s.days || []).map(d => d === 7 ? 0 : d);
      return {
        id: s.id,
        title: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        daysOfWeek: mappedDays,
        backgroundColor: s.isTemplate ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        borderColor: s.isTemplate ? 'rgba(59, 130, 246, 0.5)' : 'rgba(245, 158, 11, 0.5)',
        textColor: s.isTemplate ? '#60a5fa' : '#fbbf24',
        extendedProps: { originalData: s }
      };
    });
  }, [schedules]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader 
          icon={ClockCountdown}
          title="Planificación y Turnos"
          subtitle="Diseña y organiza los horarios de forma visual en el calendario."
          actionLabel="Crear Plantilla"
          actionIcon={Plus}
          onAction={onAdd}
        />
        
        <div className="flex bg-[#111114] p-1 rounded-xl border border-white/[0.06] shadow-inner ml-4">
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", viewMode === 'calendar' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendario
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", viewMode === 'list' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
          >
            <List className="w-4 h-4" />
            Plantillas
          </button>
        </div>
      </div>

      <div className="bg-[#0d0d0f] rounded-[24px] overflow-hidden border border-white/[0.04]">
        {viewMode === 'list' ? (
          <ModernTable 
            columns={columns} 
            data={schedules} 
            emptyIcon={ClockCountdown}
            emptyMessage="No hay horarios definidos. Crea plantillas para automatizar los turnos."
            actions={(row) => (
              <>
                <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="p-2.5 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white transition-all border border-transparent hover:border-white/10">
                  <PencilSimple className="w-4 h-4" weight="duotone" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(row); }} className="p-2.5 rounded-xl bg-rose-500/5 text-rose-500/40 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20">
                  <TrashSimple className="w-4 h-4" weight="duotone" />
                </button>
              </>
            )}
          />
        ) : (
          <div className="p-6 h-[700px] fc-theme-dark">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              locale="es"
              firstDay={1}
              allDaySlot={false}
              slotMinTime="06:00:00"
              slotMaxTime="24:00:00"
              expandRows={true}
              height="100%"
              eventClick={(info) => {
                onEdit(info.event.extendedProps.originalData);
              }}
              eventClassNames="rounded-md border shadow-sm cursor-pointer hover:brightness-125 transition-all font-semibold p-1"
            />
          </div>
        )}
      </div>

      <style>{`
        .fc-theme-dark {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #111114;
          --fc-neutral-text-color: #a1a1aa;
          --fc-border-color: rgba(255, 255, 255, 0.06);
          --fc-button-text-color: #a1a1aa;
          --fc-button-bg-color: #18181b;
          --fc-button-border-color: rgba(255, 255, 255, 0.1);
          --fc-button-hover-bg-color: rgba(255, 255, 255, 0.05);
          --fc-button-hover-border-color: rgba(255, 255, 255, 0.2);
          --fc-button-active-bg-color: #3b82f6;
          --fc-button-active-border-color: #2563eb;
          --fc-button-active-text-color: #ffffff;
          --fc-today-bg-color: rgba(59, 130, 246, 0.05);
        }
        .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 800; color: #fff; text-transform: capitalize; }
        .fc .fc-col-header-cell-cushion { padding: 12px 8px; color: #e4e4e7; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
        .fc .fc-timegrid-slot-label-cushion { color: #71717a; font-size: 0.75rem; font-weight: 600; }
        .fc .fc-timegrid-now-indicator-line { border-color: #ef4444; }
        .fc .fc-timegrid-now-indicator-arrow { border-color: #ef4444; }
      `}</style>
    </div>
  );
}
