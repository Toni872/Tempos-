import { useMemo, useEffect, useState, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
// Mapbox GL JS Implementation
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Usar token desde variables de entorno (Vite)
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

const DEFAULT_CENTER = [-3.7038, 40.4168]; // [lng, lat] para Mapbox

function parseLocation(ficha) {
  if (ficha?.latitude && ficha?.longitude) {
    return { lat: Number(ficha.latitude), lng: Number(ficha.longitude) };
  }
  const loc = ficha?.metadata?.location;
  if (loc) {
    if (typeof loc === 'string') {
      const [lat, lng] = loc.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (typeof loc === 'object' && loc.lat && loc.lng) {
      return { lat: Number(loc.lat), lng: Number(loc.lng) };
    }
  }
  if (ficha?.metadata?.latitude && ficha?.metadata?.longitude) {
    return { lat: Number(ficha.metadata.latitude), lng: Number(ficha.metadata.longitude) };
  }
  return null;
}

function formatTime(v) {
  return v ? String(v).slice(0, 5) : '—';
}

const MapContent = memo(function MapContent({ center, markers, workCenters, isFullscreen }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapboxgl.accessToken) return;

    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center || DEFAULT_CENTER,
      zoom: 13,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });

    map.current.on('style.load', () => {
      // Configurar 3D buildings (Wow effect)
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#111114',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6
        }
      });
    });

    // Add markers
    markers.forEach(m => {
      const el = document.createElement('div');
      el.className = `w-3 h-3 rounded-full border-2 ${m.endTime ? 'bg-red-500 border-red-900 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500 border-emerald-900 shadow-[0_0_10px_#10b981]'}`;
      
      new mapboxgl.Marker(el)
        .setLngLat([m.pos.lng, m.pos.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="font-bold text-black text-xs">${m.employeeName}</div>
          <div class="text-gray-500 text-[10px]">${new Date(m.date).toLocaleDateString()} · ${formatTime(m.startTime)}${m.endTime ? ` → ${formatTime(m.endTime)}` : ''}</div>
        `))
        .addTo(map.current);
    });

  }, [center, markers]);

  useEffect(() => {
    if (map.current) {
      setTimeout(() => map.current.resize(), 200);
    }
  }, [isFullscreen]);

  if (!mapboxgl.accessToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-6 border border-rose-500/20 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h4 className="text-white font-bold mb-2">Requiere Mapbox Token</h4>
        <p className="text-sm text-zinc-400">Añade <code className="text-blue-400">VITE_MAPBOX_TOKEN</code> en tu archivo .env para activar el motor 3D de Mapbox.</p>
      </div>
    );
  }

  return <div ref={mapContainer} className="w-full h-full rounded-b-[24px]" />;
});

import * as Sentry from "@sentry/react";

export default function MapaAuditoria({ fichas = [], workCenters = [], employees = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Si hay fichas pero ninguna tiene GPS, avisamos a Sentry de forma silenciosa
    if (fichas.length > 0 && !fichas.some(f => f.latitude || f.metadata?.location)) {
      Sentry.captureMessage("Fichajes detectados sin datos de geolocalización", "warning");
    }
  }, [fichas]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const markers = useMemo(() => {
    return fichas
      .map(f => {
        const pos = parseLocation(f);
        if (!pos) return null;
        const emp = employees.find(e => e.uid === f.userId || e.id === f.userId);
        return { ...f, pos, employeeName: emp?.displayName || emp?.name || f.userId };
      })
      .filter(Boolean);
  }, [fichas, employees]);

  const center = useMemo(() => {
    if (markers.length > 0) return [markers[0].pos.lat, markers[0].pos.lng];
    const wc = workCenters.find(c => c.latitude && c.longitude);
    if (wc) return [Number(wc.latitude), Number(wc.longitude)];
    return DEFAULT_CENTER;
  }, [markers, workCenters]);

  const hasData = markers.length > 0 || workCenters.some(c => c.latitude && c.longitude);

  const renderMapUI = (isFull) => (
    <div className={isFull ? 'fixed inset-0 z-[99999] bg-[#0a0a0a] flex flex-col' : 'rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] relative flex flex-col'}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#141414]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Mapa de Geofichaje</h3>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{markers.length} puntos registrados</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 mr-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /><span className="text-[10px] text-white/40 font-bold uppercase">Entrada</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /><span className="text-[10px] text-white/40 font-bold uppercase">Salida</span></div>
          </div>
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="group p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 text-white/50 hover:text-white transition-all border border-white/10 flex items-center gap-2"
          >
            {isFull ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="text-xs font-black uppercase tracking-tighter">Cerrar</span>
              </>
            ) : (
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </button>
        </div>
      </div>

      <div className={isFull ? 'flex-1 relative' : 'h-[420px] relative'}>
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-white/10 bg-[#0a0a0a] gap-4">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            <span className="text-xs font-bold uppercase tracking-widest italic">Aun no hay datos GPS en este periodo</span>
          </div>
        ) : (
          <MapContent center={center} markers={markers} workCenters={workCenters} isFullscreen={isFullscreen} />
        )}
      </div>

      <style>{`
        .leaflet-dark .leaflet-control-zoom a { background: #1c1c1c !important; color: #fff !important; border-color: rgba(255,255,255,0.1) !important; }
        .leaflet-dark .leaflet-popup-content-wrapper { background: #1c1c1c !important; color: #fff !important; border-radius: 12px !important; }
        .leaflet-dark .leaflet-popup-tip { background: #1c1c1c !important; }
        .leaflet-container { background: #0a0a0a !important; }
      `}</style>
    </div>
  );

  return (
    <>
      {!isFullscreen && renderMapUI(false)}
      {isFullscreen && createPortal(renderMapUI(true), document.body)}
    </>
  );
}
