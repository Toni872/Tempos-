import React from 'react';
import { MapPin, Navigation, LayoutGrid, Trash2, Edit3, ShieldCheck } from 'lucide-react';
import ModernTable from './ModernTable';
import { cn } from '@/lib/utils';

export default function SedesTab({ workCenters, onAdd, onEdit, onDelete }) {
  const columns = [
    {
      header: 'Centro de Trabajo',
      cell: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-white text-base">{row.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <Navigation className="w-3 h-3" />
              {row.latitude?.toFixed(4)}, {row.longitude?.toFixed(4)}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Geovalla (Radius)',
      cell: (row) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min(100, (row.radiusMeters / 1000) * 100)}%` }} 
              />
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">{row.radiusMeters}m</span>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Precisión Requerida
          </span>
        </div>
      )
    },
    {
      header: 'Configuración',
      cell: (row) => (
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Auto-Check: ON</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#111114]/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <LayoutGrid className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Centros de Trabajo</h2>
          </div>
          <p className="text-zinc-500 font-medium max-w-md">
            Gestiona las ubicaciones físicas y perímetros de seguridad para el control de asistencia.
          </p>
        </div>
        
        <button 
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-[0.2em] px-8 py-4 rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
        >
          <MapPin className="w-4 h-4" />
          Registrar Nueva Sede
        </button>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
        <div className="relative bg-[#0d0d0f] border border-white/5 rounded-[2.5rem] p-2 shadow-2xl overflow-hidden">
          <ModernTable 
            columns={columns}
            data={workCenters}
            emptyMessage="No hay sedes registradas para esta empresa."
            onRowClick={onEdit}
            actions={(row) => (
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                  title="Editar Sede"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                  className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500/50 hover:text-red-500 hover:bg-red-500/20 transition-all"
                  title="Eliminar Sede"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#111114] border border-white/5 rounded-[2rem] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{workCenters.length}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sedes Activas</div>
          </div>
        </div>
        
        <div className="md:col-span-2 p-6 bg-gradient-to-r from-blue-600/10 to-transparent border border-white/5 rounded-[2rem] flex items-center justify-between">
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Las sedes con geovalla activa bloquean automáticamente los fichajes realizados fuera del radio permitido, garantizando la veracidad de los datos.
          </p>
          <div className="w-px h-12 bg-white/5" />
          <div className="text-right">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Precisión GPS</span>
            <span className="text-lg font-bold text-white">Alta Sensibilidad</span>
          </div>
        </div>
      </div>
    </div>
  );
}
