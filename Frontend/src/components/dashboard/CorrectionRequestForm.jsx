import React, { useState } from 'react';
import { 
  Clock, 
  Note, 
  ChatTeardropText,
  Warning,
  Info
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function CorrectionRequestForm({ initialData, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '18:00',
    reason: '',
    description: initialData?.description || '',
    projectCode: initialData?.projectCode || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      alert("Es obligatorio indicar el motivo de la corrección.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
        <Info className="text-amber-500 shrink-0 mt-0.5" size={18} weight="fill" />
        <div className="text-xs text-amber-200/70 leading-relaxed">
          <p className="font-bold uppercase tracking-widest text-[10px] mb-1">Solicitud de Corrección Legal</p>
          Esta solicitud será revisada por un administrador. Una vez aprobada, se generará un registro de auditoría permanente según la normativa vigente.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Hora Entrada</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input 
              type="time" 
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full bg-[#111114] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Hora Salida</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input 
              type="time" 
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full bg-[#111114] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none transition-all"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Motivo de la Corrección</label>
        <div className="relative">
          <ChatTeardropText className="absolute left-4 top-4 text-zinc-600" size={18} />
          <textarea 
            name="reason"
            placeholder="Ej: Olvidé fichar la salida al terminar la jornada..."
            value={formData.reason}
            onChange={handleChange}
            className="w-full bg-[#111114] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none transition-all min-h-[100px] resize-none"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Notas Adicionales (Opcional)</label>
        <div className="relative">
          <Note className="absolute left-4 top-4 text-zinc-600" size={18} />
          <textarea 
            name="description"
            placeholder="Detalles sobre las tareas realizadas..."
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-[#111114] border border-white/[0.06] rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none transition-all min-h-[80px] resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-white text-[11px] font-black uppercase tracking-widest transition-all"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-[2] px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </div>
    </form>
  );
}
