import React from 'react';
import { 
  Plus, 
  TrashSimple,
  PencilSimple,
  Crosshair,
  MapTrifold,
  Buildings
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';

export default function SedesTab({ workCenters = [], onAdd, onEdit, onDelete, profile }) {

  const maxWorkCenters = profile?.features?.maxWorkCenters || 999;
  const isLimitReached = maxWorkCenters !== 999 && workCenters.length >= maxWorkCenters;

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-700">
      <SectionHeader 
        icon={Buildings}
        title="Infraestructura y Sedes"
        subtitle="Administra los centros operativos y sus perímetros de seguridad (Geofencing)."
        actionLabel={isLimitReached ? `LÍMITE ALCANZADO 🔒` : "Nueva Sede"}
        actionIcon={isLimitReached ? undefined : Plus}
        onAction={isLimitReached ? () => alert('Has alcanzado el límite de sedes de tu plan (Starter). Actualiza a Business para añadir sedes ilimitadas.') : onAdd}
      />

      <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
            <MapTrifold size={20} weight="fill" className="text-blue-500" />
            Centros Operativos Registrados ({workCenters.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {workCenters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workCenters.map((wc) => (
                <div 
                  key={wc.id}
                  className="p-6 rounded-[2rem] border bg-white/[0.03] border-white/5 hover:bg-white/10 transition-all flex flex-col gap-4 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-4">
                      <h4 className="font-black text-sm tracking-tight uppercase italic truncate text-white/90 group-hover:text-white">
                        {wc.name}
                      </h4>
                      <p className="text-[10px] font-bold mt-1 uppercase tracking-widest text-white/40 group-hover:text-white/60 line-clamp-2">
                        {wc.address || 'Sin dirección especificada'}
                      </p>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 shrink-0",
                      wc.geofencingEnabled 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                        : "bg-white/5 border-white/5 text-white/20"
                    )}>
                      <Crosshair size={12} weight="bold" />
                      {wc.geofencingEnabled ? `${wc.radiusMeters}M` : 'OFF'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                    <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Coordenadas</span>
                       <span className="text-[10px] font-bold text-white/60 font-mono">
                         {wc.latitude ? `${Number(wc.latitude).toFixed(4)}, ${Number(wc.longitude).toFixed(4)}` : 'No configuradas'}
                       </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(wc); }} className="p-2 rounded-xl bg-white/5 hover:bg-white/20 text-white transition-colors" title="Editar sede"><PencilSimple size={16} weight="bold" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(wc); }} className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/40 text-rose-500 transition-colors" title="Eliminar sede"><TrashSimple size={16} weight="bold" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-30">
              <Buildings size={64} weight="duotone" className="text-white" />
              <p className="text-xs font-black text-white uppercase tracking-[0.4em]">Sin sedes operativas</p>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center max-w-sm mt-2">
                Añade tu primer centro de trabajo para empezar a organizar a tu equipo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function createGeoJSONCircle(center, radiusInKm, points = 64) {
  const coords = { latitude: center[1], longitude: center[0] };
  const km = radiusInKm;
  const ret = [];
  const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
  const distanceY = km / 110.574;
  let theta, x, y;
  for (let i = 0; i < points; i++) {
    theta = (i / points) * (2 * Math.PI);
    x = distanceX * Math.cos(theta);
    y = distanceY * Math.sin(theta);
    ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);
  return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } }] };
}

