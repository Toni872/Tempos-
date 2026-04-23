import React, { useState } from 'react';
import { Calendar, Save, AlertCircle, Info, Plane, Thermometer, UserSquare2, Sparkles } from 'lucide-react';

export default function AusenciaForm({ initialValues, onSubmit, onCancel, loading }) {
  const safe = initialValues ?? {};
  const [motivo, setMotivo] = useState(safe.motivo || safe.reason || 'Vacaciones');
  const [dias, setDias] = useState(safe.dias || safe.days || 1);
  const [fechaInicio, setFechaInicio] = useState(safe.fechaInicio || safe.startDate || '');
  const [fechaFin, setFechaFin] = useState(safe.fechaFin || safe.endDate || '');
  const [error, setError] = useState('');

  const typeOptions = [
    { value: 'Vacaciones', icon: Plane, label: 'Vacaciones', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-500/20' },
    { value: 'Baja médica', icon: Thermometer, label: 'Baja médica', color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-500/20' },
    { value: 'Asuntos propios', icon: UserSquare2, label: 'Asuntos Propios', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-500/20' },
    { value: 'Otro', icon: Sparkles, label: 'Otro', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-500/20' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin || dias < 1) {
      setError('Completa todos los campos correctamente.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }
    setError('');
    onSubmit({ motivo, dias, fechaInicio, fechaFin });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Solicitar Ausencia</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Permisos y Vacaciones</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-200 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Motivo de Ausencia</label>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = motivo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMotivo(opt.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isActive 
                      ? `${opt.bg} ${opt.border} shadow-lg` 
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/5'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white/10' : 'bg-white/5'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? opt.color : 'text-zinc-500'}`} />
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 p-4 bg-zinc-500/5 border border-white/5 rounded-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <Calendar className="w-24 h-24 stroke-1" />
           </div>
           
           <div className="relative z-10 flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Inicio Rango</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white font-mono"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Fin Rango</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white font-mono"
                  required
                />
              </div>
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex justify-between items-center">
            <span>Días Solicitados</span>
            <span className="text-orange-400 font-mono">{dias} {dias === 1 ? 'Día' : 'Días'}</span>
          </label>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={dias}
            onChange={e => setDias(parseInt(e.target.value))}
            className="w-full accent-orange-500 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer mt-2"
          />
          <p className="text-[9px] text-zinc-500 font-medium flex items-center gap-1.5 pt-1">
            <Info className="w-3 h-3" />
            Asegúrate de ajustar los días hábiles manualmente.
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111114] border border-white/5 text-zinc-400 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 rounded-2xl bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Solicitar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
