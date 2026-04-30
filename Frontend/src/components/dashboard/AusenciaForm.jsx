import React, { useState } from 'react';
import { 
  CalendarX, 
  AirplaneTilt, 
  ThermometerHot, 
  Suitcase, 
  Calendar,
  Note,
  FloppyDisk,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function AusenciaForm({ initialValues, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialValues ?? {
    type: 'Vacaciones',
    startDate: '',
    endDate: '',
    status: 'Pending',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const types = [
    { id: 'Vacaciones', icon: AirplaneTilt, color: 'text-emerald-500' },
    { id: 'Enfermedad', icon: ThermometerHot, color: 'text-rose-500' },
    { id: 'Asuntos Propios', icon: Suitcase, color: 'text-blue-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Tipo de Ausencia</label>
          <div className="grid grid-cols-3 gap-2">
            {types.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData(p => ({ ...p, type: t.id }))}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                  formData.type === t.id 
                    ? "bg-white/[0.05] border-blue-500/40 text-white shadow-lg" 
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-600 hover:text-zinc-400"
                )}
              >
                <t.icon weight={formData.type === t.id ? "fill" : "duotone"} className={cn("w-6 h-6", formData.type === t.id ? t.color : "text-zinc-700")} />
                <span className="text-[9px] font-black uppercase tracking-tighter text-center">{t.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            label="Fecha Inicio" 
            name="startDate" 
            value={formData.startDate} 
            onChange={handleChange} 
            icon={Calendar} 
            type="date" 
          />
          <FormInput 
            label="Fecha Fin" 
            name="endDate" 
            value={formData.endDate} 
            onChange={handleChange} 
            icon={Calendar} 
            type="date" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Estado de Aprobación</label>
          <div className="flex gap-2">
            {['Pending', 'Approved', 'Rejected'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFormData(p => ({ ...p, status: s }))}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all",
                  formData.status === s 
                    ? (s === 'Approved' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : s === 'Rejected' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500") 
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-600 hover:text-zinc-400"
                )}
              >
                {s === 'Approved' ? <CheckCircle className="w-4 h-4" /> : s === 'Rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                {s === 'Pending' ? 'Pendiente' : s === 'Approved' ? 'Aprobar' : 'Denegar'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Justificante / Notas</label>
          <div className="relative group">
            <Note className="absolute left-4 top-4 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Añade detalles adicionales..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
          Cancelar
        </button>
        <button type="submit" className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
           {initialValues?.id ? 'Actualizar Ausencia' : 'Registrar Ausencia'}
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
