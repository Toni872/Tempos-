import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, X, AlertCircle, Info } from 'lucide-react';

export default function ScheduleForm({ initialValues, onSubmit, onCancel, loading }) {
  const safe = initialValues ?? {};
  const [formData, setFormData] = useState({
    name: safe.name || '',
    startTime: safe.startTime || '09:00',
    endTime: safe.endTime || '18:00',
    daysOfWeek: safe.daysOfWeek || [1, 2, 3, 4, 5],
    gracePeriodMinutes: safe.gracePeriodMinutes || 15
  });

  const [error, setError] = useState(null);

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre de la plantilla es obligatorio.');
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      setError('Debes seleccionar al menos un día de la semana.');
      return;
    }

    onSubmit(formData);
  };

  const dayLabels = [
    { id: 1, label: 'L', name: 'Lunes' },
    { id: 2, label: 'M', name: 'Martes' },
    { id: 3, label: 'X', name: 'Miércoles' },
    { id: 4, label: 'J', name: 'Jueves' },
    { id: 5, label: 'V', name: 'Viernes' },
    { id: 6, label: 'S', name: 'Sábado' },
    { id: 7, label: 'D', name: 'Domingo' }
  ];

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Plantilla de Horario</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Reglas de Jornada Laboral</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-200 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Identificador del Horario</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white"
            placeholder="Ej: Jornada Completa L-V, Turno Nocturno..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hora Entrada</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Hora Salida</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white font-mono"
              required
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Días Aplicables</label>
          <div className="flex justify-between gap-2">
            {dayLabels.map(day => {
              const isActive = formData.daysOfWeek.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  title={day.name}
                  className={`flex-1 h-12 rounded-xl text-xs font-black transition-all border flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95' 
                      : 'bg-white/[0.03] border-white/5 text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-zinc-500/5 border border-white/5 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Margen de Cortesía
            </label>
            <span className="text-sm font-mono font-black text-zinc-300">{formData.gracePeriodMinutes} min</span>
          </div>
          <input
            type="range"
            min="0"
            max="120"
            step="5"
            value={formData.gracePeriodMinutes}
            onChange={e => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) })}
            className="w-full accent-blue-600 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
          />
          <p className="text-[9px] text-zinc-600 leading-relaxed font-medium">
            Tiempo de tolerancia permitido después de la hora oficial de entrada sin que se considere retraso.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111114] border border-white/5 text-zinc-400 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all"
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
              {safe.id ? 'Actualizar Plantilla' : 'Crear Plantilla'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
