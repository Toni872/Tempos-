import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Map } from 'lucide-react';
import MapaAuditoria from './MapaAuditoria';

export default function AnalisisTab({ registros = [], workCenters = [], employees = [] }) {
  
  // Fake data for the chart based on realistic HR metrics
  const weeklyData = [
    { day: 'Lun', hours: 42, overtime: 2 },
    { day: 'Mar', hours: 38, overtime: 1 },
    { day: 'Mié', hours: 45, overtime: 5 },
    { day: 'Jue', hours: 40, overtime: 0 },
    { day: 'Vie', hours: 35, overtime: 0 },
  ];

  const maxHours = Math.max(...weeklyData.map(d => d.hours + d.overtime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Análisis Estratégico</h2>
            <p className="text-zinc-500 text-sm font-medium">Insights operativos y cumplimiento de horarios</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico SVG Nativo */}
        <div className="lg:col-span-2 bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest">Horas Trabajadas vs Extra</h3>
              <p className="text-xs text-zinc-600 mt-1">Evolución de la semana actual</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Ordinarias</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> Extra</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 md:gap-6 mt-4 h-48 px-2 pb-6 border-b border-white/5 relative">
            {/* SVG Grid Lines Background */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-dashed border-zinc-600" />
              <div className="w-full border-t border-dashed border-zinc-600" />
              <div className="w-full border-t border-dashed border-zinc-600" />
              <div className="w-full border-t border-dashed border-zinc-600" />
            </div>

            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 relative z-10 group">
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
                  {d.hours}h + {d.overtime}h extra
                </div>
                
                <div className="w-full max-w-[48px] flex flex-col justify-end gap-1 h-full">
                  {d.overtime > 0 && (
                    <div 
                      style={{ height: `${(d.overtime / maxHours) * 100}%` }} 
                      className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-sm transition-all duration-1000 animate-in slide-in-from-bottom-2"
                    />
                  )}
                  <div 
                    style={{ height: `${(d.hours / maxHours) * 100}%` }} 
                    className={`w-full bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-1000 animate-in slide-in-from-bottom-4 ${d.overtime > 0 ? 'rounded-b-sm' : 'rounded-sm'}`}
                  />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjetas de Insights */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/50 to-[#111114] border border-indigo-500/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/10 pointer-events-none" />
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Puntualidad Global</h3>
            <p className="text-4xl font-black text-white">92<span className="text-xl text-zinc-500">%</span></p>
            <p className="text-xs text-indigo-300 font-medium mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +2% vs mes anterior
            </p>
          </div>

          <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
             <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Presencialidad</h3>
             <div className="flex gap-4 mt-4">
               <div>
                 <p className="text-2xl font-black text-emerald-400">75%</p>
                 <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">En Sede</p>
               </div>
               <div>
                 <p className="text-2xl font-black text-blue-400">25%</p>
                 <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Remoto</p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Mapa de Auditoría (Geofichaje) */}
      <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Mapa de Geofichaje</h3>
            <p className="text-sm text-zinc-500">Visualización en tiempo real de entradas y salidas fuera de la geocerca permitida.</p>
          </div>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
            <Map className="w-5 h-5 text-zinc-400" />
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-white/10">
          <MapaAuditoria fichas={registros} workCenters={workCenters} employees={employees} />
        </div>
      </div>

    </div>
  );
}
