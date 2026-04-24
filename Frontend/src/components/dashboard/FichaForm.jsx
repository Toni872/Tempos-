import React, { useState } from 'react';
import { Clock, Calendar, Save, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FichaForm({ initialData, onSubmit, onCancel, loading }) {
  const safe = initialData ?? {};
  const [formData, setFormData] = useState({
    date: safe.date ? new Date(safe.date).toISOString().split('T')[0] : '',
    startTime: safe.startTime || '',
    endTime: safe.endTime || '',
    description: safe.description || '',
    status: safe.status || 'confirmed'
  });

  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.date || !formData.startTime) {
      setError('Fecha y hora de inicio son obligatorias.');
      return;
    }

    if (formData.endTime) {
      const [h1, m1] = formData.startTime.split(':').map(Number);
      const [h2, m2] = formData.endTime.split(':').map(Number);
      const t1 = h1 * 60 + m1;
      const t2 = h2 * 60 + m2;
      
      if (t2 <= t1) {
        setError('La hora de salida debe ser posterior a la de entrada.');
        return;
      }
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Corregir Fichaje</h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Ajuste manual de jornada</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-200 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            Fecha
          </label>
          <input 
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-mono text-zinc-300"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Entrada</label>
            <input 
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-mono text-zinc-300"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Salida</label>
            <input 
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-mono text-zinc-300"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Concepto / Comentario</label>
        <textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ej: Olvido de fichaje de salida corregido..."
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-zinc-300 h-24 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111114] border border-white/5 text-zinc-400 font-black text-[11px] uppercase tracking-widest hover:text-white hover:border-white/10 transition-all"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
