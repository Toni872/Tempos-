import React, { useState } from 'react';
import { 
  ClockCountdown, 
  CalendarBlank, 
  Repeat, 
  Sun, 
  Moon,
  FloppyDisk,
  Timer,
  Clock,
  ArrowRight
} from '@phosphor-icons/react';
import Toggle from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

export default function ScheduleForm({ initialData, onSubmit, onCancel }) {
  const [isSplitShift, setIsSplitShift] = useState(!!(initialData?.startTime2 && initialData?.endTime2));
  
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    startTime: initialData?.startTime ?? '09:00',
    endTime: initialData?.endTime ?? '14:00',
    startTime2: initialData?.startTime2 ?? '16:00',
    endTime2: initialData?.endTime2 ?? '19:00',
    days: initialData?.days ?? [1, 2, 3, 4, 5],
    flexible: initialData?.flexible ?? false,
    isTemplate: initialData?.isTemplate ?? true
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Si no es jornada partida, limpiamos los campos del segundo turno antes de enviar
    const submissionData = { ...formData };
    if (!isSplitShift) {
      delete submissionData.startTime2;
      delete submissionData.endTime2;
    }
    onSubmit(submissionData);
  };

  const weekDays = [
    { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' },
    { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 7, label: 'D' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <FormInput 
          label="Nombre de la Plantilla" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          icon={CalendarBlank} 
          placeholder="Ej. Jornada de Oficina" 
        />

        {/* CONTENEDOR DE TURNOS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Configuración de Turnos</label>
            <button 
              type="button" 
              onClick={() => setIsSplitShift(!isSplitShift)}
              className={cn(
                "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all",
                isSplitShift ? "bg-blue-600/10 text-blue-500" : "bg-white/5 text-zinc-500 hover:text-white"
              )}
            >
              {isSplitShift ? "Cambiar a Jornada Continua" : "Activar Jornada Partida"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* TURNO 1 */}
            <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sun size={40} weight="fill" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                  <span className="text-[10px] font-black">T1</span>
                </div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Mañana / Primer Turno</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput 
                  label="Entrada" 
                  name="startTime" 
                  value={formData.startTime} 
                  onChange={handleChange} 
                  icon={Clock} 
                  type="time" 
                />
                <FormInput 
                  label="Salida" 
                  name="endTime" 
                  value={formData.endTime} 
                  onChange={handleChange} 
                  icon={ArrowRight} 
                  type="time" 
                />
              </div>
            </div>

            {/* TURNO 2 (Condicional) */}
            {isSplitShift && (
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Moon size={40} weight="fill" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                    <span className="text-[10px] font-black">T2</span>
                  </div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Tarde / Segundo Turno</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput 
                    label="Entrada" 
                    name="startTime2" 
                    value={formData.startTime2} 
                    onChange={handleChange} 
                    icon={Clock} 
                    type="time" 
                  />
                  <FormInput 
                    label="Salida" 
                    name="endTime2" 
                    value={formData.endTime2} 
                    onChange={handleChange} 
                    icon={ArrowRight} 
                    type="time" 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Días Laborales</label>
          <div className="flex justify-between gap-2">
            {weekDays.map(day => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "flex-1 h-12 rounded-xl text-xs font-black transition-all border",
                  formData.days.includes(day.id) 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-600 hover:text-zinc-400"
                )}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                 <Repeat weight="duotone" className="w-5 h-5" />
              </div>
              <div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Horario Flexible</h4>
                 <p className="text-[10px] text-zinc-600 font-medium mt-1">Permitir fichajes fuera de la hora exacta.</p>
              </div>
           </div>
           <Toggle 
              enabled={formData.flexible} 
              onChange={(val) => setFormData(p => ({ ...p, flexible: val }))} 
           />
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
          Cancelar
        </button>
        <button type="submit" className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
           {initialData?.id ? 'Actualizar Horario' : 'Guardar Plantilla'}
        </button>
      </div>
    </form>
  );
}

function FormInput({ label, icon: Icon, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
        <input 
          {...props}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all placeholder:text-zinc-700"
        />
      </div>
    </div>
  );
}
