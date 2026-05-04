import React, { useRef, useEffect, useState } from 'react';
import { 
  NavigationArrow, 
  Plus, 
  MapPin, 
  Users, 
  Globe,
  DeviceMobile,
  TrashSimple,
  PencilSimple,
  Crosshair,
  User,
  MapTrifold,
  Warning,
  Buildings,
  Pulse
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';

export default function SedesTab({ workCenters = [], onAdd, onEdit, onDelete }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [activeSede, setActiveSede] = useState(null);

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    }
    
    if (!mapboxgl.accessToken || !mapContainer.current || map.current) return;
    
    const centerLat = workCenters[0]?.latitude || 40.4168;
    const centerLng = workCenters[0]?.longitude || -3.7038;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 45,
      antialias: true
    });

    map.current.on('load', () => {
      workCenters.forEach(wc => {
        if (!wc.latitude || !wc.longitude) return;
        
        const el = document.createElement('div');
        el.className = 'group relative flex items-center justify-center';
        el.innerHTML = `
          <div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping"></div>
          <div class="relative w-6 h-6 bg-blue-600 rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        `;
        
        new mapboxgl.Marker(el)
          .setLngLat([wc.longitude, wc.latitude])
          .addTo(map.current);

        if (wc.geofencingEnabled && wc.radiusMeters) {
           map.current.addSource(`geofence-${wc.id}`, {
             type: 'geojson',
             data: createGeoJSONCircle([wc.longitude, wc.latitude], wc.radiusMeters / 1000)
           });
           map.current.addLayer({
             id: `geofence-fill-${wc.id}`,
             type: 'fill',
             source: `geofence-${wc.id}`,
             paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.05 }
           });
           map.current.addLayer({
             id: `geofence-line-${wc.id}`,
             type: 'line',
             source: `geofence-${wc.id}`,
             paint: { 'line-color': '#3b82f6', 'line-width': 1, 'line-dasharray': [4, 4] }
           });
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [workCenters]);

  useEffect(() => {
    if (activeSede && map.current && activeSede.latitude && activeSede.longitude) {
      map.current.flyTo({
        center: [activeSede.longitude, activeSede.latitude],
        zoom: 16,
        essential: true,
        duration: 2000,
        pitch: 60
      });
    }
  }, [activeSede]);

  return (
    <div className="space-y-8 h-full flex flex-col animate-in fade-in duration-700">
      <SectionHeader 
        icon={Buildings}
        title="Infraestructura y Sedes"
        subtitle="Auditoría geográfica de centros operativos y perímetros de seguridad."
        actionLabel="Nueva Sede"
        actionIcon={Plus}
        onAction={onAdd}
      />

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-[650px]">
        {/* Panel Izquierdo: Lista */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
              <MapTrifold size={20} weight="fill" className="text-blue-500" />
              Activos Registrados
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {workCenters.length > 0 ? workCenters.map((wc) => (
              <div 
                key={wc.id}
                onClick={() => setActiveSede(wc)}
                className={cn(
                  "p-6 rounded-[2rem] border cursor-pointer transition-all flex flex-col gap-4 group relative overflow-hidden",
                  activeSede?.id === wc.id 
                    ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/20" 
                    : "bg-white/[0.03] border-white/5 hover:bg-white/10"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <h4 className={cn(
                      "font-black text-sm tracking-tight uppercase italic truncate",
                      activeSede?.id === wc.id ? "text-white" : "text-white/60 group-hover:text-white"
                    )}>{wc.name}</h4>
                    <p className={cn(
                      "text-[9px] font-bold mt-1 uppercase tracking-widest truncate",
                      activeSede?.id === wc.id ? "text-white/60" : "text-white/20"
                    )}>{wc.address || 'Sin coordenadas fijadas'}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                    wc.geofencingEnabled 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : "bg-white/5 border-white/5 text-white/20"
                  )}>
                    <Crosshair size={10} weight="bold" />
                    {wc.geofencingEnabled ? `${wc.radiusMeters}M` : 'OFF'}
                  </div>
                </div>
                
                <div className={cn(
                  "flex items-center justify-between pt-4 border-t",
                  activeSede?.id === wc.id ? "border-white/10" : "border-white/5"
                )}>
                  <div className="flex items-center gap-2">
                    <Users size={14} className={activeSede?.id === wc.id ? "text-white/60" : "text-white/20"} />
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      activeSede?.id === wc.id ? "text-white" : "text-white/40"
                    )}>Terminal Activa</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(wc); }} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"><PencilSimple size={14} weight="bold" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(wc); }} className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 transition-colors"><TrashSimple size={14} weight="bold" /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-10">
                <Warning size={48} weight="duotone" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sin sedes operativas</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Mapa interactivo */}
        <div className="xl:col-span-2 bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl">
          {!import.meta.env.VITE_MAPBOX_TOKEN ? (
            <div className="h-full flex items-center justify-center bg-[#0a0a0a] flex-col p-12 text-center">
               <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20 shadow-2xl animate-pulse">
                  <Globe size={40} weight="duotone" className="text-blue-500" />
               </div>
               <h3 className="text-white font-black text-xl uppercase italic tracking-tight">Geolocalización Inactiva</h3>
               <p className="text-white/20 max-w-sm mt-4 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">Configura VITE_MAPBOX_TOKEN para activar el motor de mapas y trazar los perímetros de seguridad (Geofencing).</p>
            </div>
          ) : (
            <>
              <div className="absolute top-6 left-6 z-10 bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                <Pulse size={16} className="text-blue-500 animate-pulse" weight="bold" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Motor WebGL 2.0 Operativo</span>
              </div>
              <div ref={mapContainer} className="w-full h-full" />
            </>
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

