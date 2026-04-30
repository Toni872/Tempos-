import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Note, 
  User, 
  MapPin,
  FloppyDisk,
  Timer
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function FichaForm({ modalData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(modalData ?? {
    startTime: '',
    endTime: '',
    notes: '',
    workCenterId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 shrink-0">
              <User weight="duotone" className="w-5 h-5" />
           </div>
           <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Editando Registro de</p>
              <h4 className="text-sm font-black text-white mt-1">{modalData?.userName || 'Empleado'}</h4>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput 
            label="Inicio de Jornada" 
            name="startTime" 
            value={formData.startTime?.split('.')[0]} 
            onChange={handleChange} 
            icon={Clock} 
            type="datetime-local" 
          />
          <FormInput 
            label="Fin de Jornada" 
            name="endTime" 
            value={formData.endTime?.split('.')[0]} 
            onChange={handleChange} 
            icon={Clock} 
            type="datetime-local" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Notas de Auditoría</label>
          <div className="relative group">
            <Note className="absolute left-4 top-4 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ej. Olvido de fichaje, salida anticipada autorizada..."
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
          Cancelar
        </button>
        <button type="submit" className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
           Corregir Fichaje
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
