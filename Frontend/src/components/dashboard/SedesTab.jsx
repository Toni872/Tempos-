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
  MapTrifold
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
    
    if (!mapboxgl.accessToken || map.current) return;
    
    const centerLat = workCenters[0]?.latitude || 40.4168;
    const centerLng = workCenters[0]?.longitude || -3.7038;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerLng, centerLat],
      zoom: 14,
      pitch: 45,
    });

    map.current.on('load', () => {
      // Dibujar los radios (Geofencing)
      workCenters.forEach(wc => {
        if (!wc.latitude || !wc.longitude) return;
        
        // Marker
        const el = document.createElement('div');
        el.className = 'w-6 h-6 rounded-full bg-indigo-500 border-[4px] border-[#111114] shadow-[0_0_15px_#6366f1] flex items-center justify-center';
        el.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>';
        
        new mapboxgl.Marker(el)
          .setLngLat([wc.longitude, wc.latitude])
          .addTo(map.current);

        // Geocerca (Círculo estático simplificado para visualización)
        if (wc.geofencingEnabled && wc.radiusMeters) {
           map.current.addSource(`geofence-${wc.id}`, {
             type: 'geojson',
             data: createGeoJSONCircle([wc.longitude, wc.latitude], wc.radiusMeters / 1000)
           });
           map.current.addLayer({
             id: `geofence-fill-${wc.id}`,
             type: 'fill',
             source: `geofence-${wc.id}`,
             paint: { 'fill-color': '#6366f1', 'fill-opacity': 0.1 }
           });
           map.current.addLayer({
             id: `geofence-line-${wc.id}`,
             type: 'line',
             source: `geofence-${wc.id}`,
             paint: { 'line-color': '#6366f1', 'line-width': 2, 'line-dasharray': [2, 2] }
           });
        }
      });
    });

  }, [workCenters]);

  useEffect(() => {
    if (activeSede && map.current && activeSede.latitude && activeSede.longitude) {
      map.current.flyTo({
        center: [activeSede.longitude, activeSede.latitude],
        zoom: 16,
        essential: true,
        duration: 2000
      });
    }
  }, [activeSede]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <SectionHeader 
        icon={NavigationArrow}
        title="Sedes y Logística"
        subtitle="Gestiona los centros de trabajo y los perímetros de geofencing."
        actionLabel="Registrar Nueva Sede"
        actionIcon={Plus}
        onAction={onAdd}
      />

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 h-[700px]">
        {/* Panel Izquierdo: Lista */}
        <div className="bg-[#111114] border border-white/[0.06] rounded-[24px] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/[0.04] bg-white/[0.01]">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <MapTrifold className="w-5 h-5 text-indigo-400" weight="duotone" />
              Directorio de Sedes
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {workCenters.length > 0 ? workCenters.map((wc) => (
              <div 
                key={wc.id}
                onClick={() => setActiveSede(wc)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-3 group relative overflow-hidden",
                  activeSede?.id === wc.id ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]" : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
                )}
              >
                {activeSede?.id === wc.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-white text-sm group-hover:text-indigo-300 transition-colors">{wc.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wider">{wc.address || 'Sin dirección definida'}</p>
                  </div>
                  <Badge color={wc.geofencingEnabled ? 'emerald' : 'zinc'}>
                    <Crosshair className="w-3 h-3" />
                    {wc.geofencingEnabled ? `${wc.radiusMeters}m` : 'Off'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/[0.04]">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    Plantilla Asignada
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(wc); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white"><PencilSimple className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(wc); }} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"><TrashSimple className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center p-8 text-zinc-500 text-sm">No hay sedes registradas.</div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Mapa interactivo */}
        <div className="xl:col-span-2 bg-[#111114] border border-white/[0.06] rounded-[24px] overflow-hidden relative">
          {!import.meta.env.VITE_MAPBOX_TOKEN ? (
            <div className="h-full flex items-center justify-center bg-[#0a0a0a] flex-col p-8 text-center">
               <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4"><Globe className="w-8 h-8 text-blue-500" /></div>
               <h3 className="text-white font-bold text-lg">Geolocalización Inactiva</h3>
               <p className="text-zinc-500 max-w-sm mt-2 text-sm">Configura VITE_MAPBOX_TOKEN para activar el motor de mapas y trazar los radios de fichaje (Geofencing).</p>
            </div>
          ) : (
            <>
              <div className="absolute top-4 left-4 z-10 bg-[#111114]/90 backdrop-blur border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">Motor WebGL Activo</span>
              </div>
              <div ref={mapContainer} className="w-full h-full" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Función auxiliar para dibujar un círculo en GeoJSON
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
