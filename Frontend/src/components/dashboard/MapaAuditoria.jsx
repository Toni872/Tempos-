import React, { useMemo, useEffect, useState, memo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  ArrowsOutCardinal, 
  X, 
  NavigationArrow, 
  MapPin,
  ChartPieSlice,
  Users,
  ShieldCheck,
  SelectionBackground,
  Fire,
  Clock,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  DownloadSimple,
  Crosshair
} from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { exportAuditPDF, exportInspectionPDF, getClientSession } from '@/lib/api';

const DEFAULT_CENTER = [-3.7038, 40.4168]; // [lng, lat]
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

const parseLocation = (ficha) => {
  if (!ficha) return null;
  if (ficha.latitude && ficha.longitude) return { lat: Number(ficha.latitude), lng: Number(ficha.longitude) };
  const loc = ficha.metadata?.location;
  if (loc) {
    if (typeof loc === 'string') {
      const [lat, lng] = loc.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (typeof loc === 'object' && loc.lat && loc.lng) {
      return { lat: Number(loc.lat), lng: Number(loc.lng) };
    }
  }
  return null;
};

const formatTime = (v) => (v ? String(v).slice(0, 5) : '--:--');

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

export default function MapaAuditoria({ fichas = [], workCenters = [], employees = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef({});
  const geofenceLayersRef = useRef([]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGeofence, setShowGeofence] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [timeFilter, setTimeFilter] = useState(24);
  const [zoom, setZoom] = useState(14);
  const [isExporting, setIsExporting] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const markers = useMemo(() => {
    return (fichas || []).map(f => {
      const pos = parseLocation(f);
      if (!pos) return null;
      const hour = parseInt(f.startTime?.split(':')[0] || '0', 10);
      if (hour > timeFilter) return null;
      const emp = (employees || []).find(e => e.uid === f.userId || e.id === f.userId);
      return { ...f, pos, employeeName: emp?.displayName || emp?.name || 'Usuario', deviceId: f.metadata?.deviceId };
    }).filter(Boolean);
  }, [fichas, employees, timeFilter]);

  const center = useMemo(() => {
    if (markers.length > 0) return [markers[0].pos.lng, markers[0].pos.lat];
    return DEFAULT_CENTER;
  }, [markers]);

  // Initialization of Mapbox
  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    }
    if (!mapboxgl.accessToken || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom,
      pitch: 45,
      antialias: true
    });

    map.current.on('zoomend', () => {
      setZoom(Math.round(map.current.getZoom()));
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center when changed significantly
  const handleRecenter = useCallback(() => {
    if (map.current && markers.length > 0) {
      map.current.flyTo({ center: [markers[0].pos.lng, markers[0].pos.lat], zoom: 16, essential: true, duration: 1500 });
    }
  }, [markers]);

  // Render Markers
  useEffect(() => {
    if (!map.current) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    markers.forEach((m, idx) => {
      const isActive = !m.endTime;
      const el = document.createElement('div');
      
      if (showHeatmap) {
        el.className = 'w-20 h-20 rounded-full blur-3xl opacity-60 bg-red-600 animate-pulse';
      } else {
        el.className = `w-6 h-6 rounded-full border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] flex items-center justify-center ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`;
        el.innerHTML = `<div class="w-2 h-2 bg-white rounded-full ${isActive ? 'animate-ping' : ''}"></div>`;
      }

      // Generate popup HTML
      const badgeHtml = isActive 
        ? `<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-emerald-500/20">ACTIVO</div>`
        : `<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border-rose-500/20">SALIDA</div>`;

      const popupHtml = `
        <div class="p-5 min-w-[240px] bg-white text-zinc-900 rounded-[24px] border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <div class="flex justify-between items-center mb-4">
             ${badgeHtml}
             <div class="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tight">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M224,54.91V112a104.14,104.14,0,0,1-88.64,102.94l-5.61.84a16.27,16.27,0,0,1-3.5,0l-5.61-.84A104.14,104.14,0,0,1,32,112V54.91A16,16,0,0,1,43.25,40.59l80-32a16,16,0,0,1,11.5,0l80,32A16,16,0,0,1,224,54.91ZM179.31,99.31a8,8,0,0,0-11.31-11.31L120,135.51,100,115.51a8,8,0,1,0-11.31,11.31l25.65,25.66a8,8,0,0,0,11.32,0Z"></path></svg> 
               GPS SECURE
             </div>
          </div>
          <h4 class="text-sm font-black tracking-tight text-zinc-900 mb-1">${m.employeeName}</h4>
          <div class="flex items-center gap-2 mb-5">
             <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             <p class="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">${m.deviceId || 'DISPOSITIVO ENCRIP.'}</p>
          </div>
          <div class="grid grid-cols-2 gap-6 border-t border-zinc-100 pt-4">
            <div class="space-y-0.5">
              <span class="text-[8px] font-black text-zinc-400 uppercase block tracking-[0.15em]">Entrada</span>
              <span class="text-xs font-black text-zinc-800 tabular-nums">${formatTime(m.startTime)}h</span>
            </div>
            ${m.endTime ? `
              <div class="space-y-0.5">
                <span class="text-[8px] font-black text-zinc-400 uppercase block tracking-[0.15em]">Salida</span>
                <span class="text-xs font-black text-rose-600 tabular-nums">${formatTime(m.endTime)}h</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 15, closeButton: false, className: 'premium-mapbox-popup' }).setHTML(popupHtml);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([m.pos.lng, m.pos.lat])
        .setPopup(popup)
        .addTo(map.current);
      
      markersRef.current[m.id || idx] = marker;
    });
  }, [markers, showHeatmap]);

  // Render Geofences
  useEffect(() => {
    if (!map.current) return;
    
    const renderFences = () => {
      // Clear old sources/layers
      geofenceLayersRef.current.forEach(id => {
        if (map.current.getLayer(`geofence-fill-${id}`)) map.current.removeLayer(`geofence-fill-${id}`);
        if (map.current.getLayer(`geofence-line-${id}`)) map.current.removeLayer(`geofence-line-${id}`);
        if (map.current.getSource(`geofence-${id}`)) map.current.removeSource(`geofence-${id}`);
      });
      geofenceLayersRef.current = [];

      if (!showGeofence) return;

      workCenters.forEach((wc, idx) => {
        if (wc && wc.latitude && wc.longitude) {
          const id = wc.id || idx;
          geofenceLayersRef.current.push(id);
          
          if (!map.current.getSource(`geofence-${id}`)) {
            map.current.addSource(`geofence-${id}`, {
              type: 'geojson',
              data: createGeoJSONCircle([Number(wc.longitude), Number(wc.latitude)], (Number(wc.radiusMeters) || 500) / 1000)
            });
            map.current.addLayer({
              id: `geofence-fill-${id}`,
              type: 'fill',
              source: `geofence-${id}`,
              paint: { 'fill-color': '#10b981', 'fill-opacity': 0.08 }
            });
            map.current.addLayer({
              id: `geofence-line-${id}`,
              type: 'line',
              source: `geofence-${id}`,
              paint: { 'line-color': '#10b981', 'line-width': 1.5, 'line-dasharray': [4, 4] }
            });
          }
        }
      });
    };

    if (map.current.isStyleLoaded()) {
      renderFences();
    } else {
      map.current.once('style.load', renderFences);
    }
  }, [workCenters, showGeofence]);

  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);
  const toggleGeofence = useCallback(() => setShowGeofence(v => !v), []);
  const toggleHeatmap = useCallback(() => setShowHeatmap(v => !v), []);
  
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setUserLocation(newLoc);
        
        if (map.current) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 16, essential: true });
          
          // User marker
          if (markersRef.current['user-loc']) markersRef.current['user-loc'].remove();
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
              <div class="relative w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
            </div>
          `;
          markersRef.current['user-loc'] = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .addTo(map.current);
        }
        setIsLocating(false);
      },
      (error) => {
        let msg = "No se pudo obtener tu ubicación.";
        if (error.code === 1) msg = "Permiso denegado. Por favor, activa el GPS en el candado de la barra de direcciones.";
        alert(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const session = getClientSession();
      if (!session?.token) throw new Error("No hay sesión activa");
      const blob = await exportAuditPDF(session.token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auditoria_gps_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); link.remove(); }, 100);
    } catch (error) {
      alert("Error de descarga. Por favor, asegúrate de tener conexión.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportInspection = async () => {
    try {
      setIsExporting(true);
      const session = getClientSession();
      if (!session?.token) throw new Error("No hay sesión activa");
      const blob = await exportInspectionPDF(session.token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registro_legal_jornada_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.URL.revokeObjectURL(url); link.remove(); }, 100);
    } catch (error) {
      alert("Error de descarga. Por favor, asegúrate de tener conexión.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && setIsFullscreen(false);
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (map.current) {
      setTimeout(() => map.current.resize(), 100);
    }
  }, [isFullscreen]);

  const setZoomControlled = (val) => {
    setZoom(val);
    if (map.current) map.current.setZoom(val);
  };

  const renderMapLayout = (isFull) => (
    <div className={cn(
      "bg-[#0a0a0c] transition-all duration-500 relative",
      isFull ? "fixed inset-0 z-[99999]" : "w-full h-full rounded-[40px] shadow-2xl border border-white/5"
    )}>
      <div className="absolute top-8 left-8 right-8 z-[2000] flex items-center justify-between pointer-events-none">
        <div className="bg-[#111114]/95 backdrop-blur-2xl px-6 py-4 rounded-[28px] border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-4">
          <ChartPieSlice size={24} weight="duotone" className="text-emerald-500" />
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">SALA DE MANDOS GPS</h3>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">MONITOREO ACTIVO</p>
          </div>
        </div>
        <div className="bg-[#111114]/95 backdrop-blur-2xl p-2 rounded-[28px] border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-2">
          {/* Geovallas */}
          <div className="group relative">
            <button onClick={toggleGeofence} className={cn("p-3 rounded-2xl transition-all", showGeofence ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-white/5 text-zinc-500 hover:text-white")}>
              <SelectionBackground size={20} weight="fill" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
              Geovallas
            </div>
          </div>

          {/* Mapa de Calor */}
          <div className="group relative">
            <button onClick={toggleHeatmap} className={cn("p-3 rounded-2xl transition-all", showHeatmap ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "bg-white/5 text-zinc-500 hover:text-white")}>
              <Fire size={20} weight="fill" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
              Mapa de Calor
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Ubicación Actual */}
          <div className="group relative">
            <button onClick={handleDetectLocation} className={cn("p-3 rounded-2xl transition-all", isLocating ? "bg-blue-600 animate-pulse text-white" : "bg-white/5 text-zinc-500 hover:text-blue-400")}>
              <NavigationArrow size={20} weight={isLocating ? "fill" : "bold"} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
              Mi Ubicación
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Recentrar */}
          <div className="group relative">
            <button onClick={handleRecenter} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all">
              <Crosshair size={20} weight="bold" />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
              Recentrar Radar
            </div>
          </div>

          {/* Pantalla Completa */}
          <div className="group relative">
            <button onClick={toggleFullscreen} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl">
              {isFull ? <X size={20} weight="bold" /> : <ArrowsOutCardinal size={20} weight="bold" />}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
              {isFull ? 'Salir' : 'Pantalla Completa'}
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[2000] flex flex-col items-center gap-5 bg-[#111114]/95 backdrop-blur-2xl px-3 py-6 rounded-[32px] border border-white/10 shadow-2xl">
        <div className="group relative">
          <button onClick={() => setZoomControlled(Math.min(MAX_ZOOM, zoom+1))} className="text-zinc-500 hover:text-blue-400 transition-colors">
            <MagnifyingGlassPlus size={20} weight="bold" />
          </button>
        </div>
        
        <div className="h-28 flex items-center">
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} value={zoom} onChange={(e) => setZoomControlled(Number(e.target.value))} className="zoom-slider-v-final" />
        </div>

        <div className="group relative">
          <button onClick={() => setZoomControlled(Math.max(MIN_ZOOM, zoom-1))} className="text-zinc-500 hover:text-blue-400 transition-colors">
            <MagnifyingGlassMinus size={20} weight="bold" />
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-8 right-8 z-[2000] flex flex-col md:flex-row gap-4 pointer-events-none">
        <div className="flex-1 bg-[#111114]/95 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 shadow-2xl pointer-events-auto">
           <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-3">
               <Clock size={20} weight="fill" className="text-blue-500" />
               <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">LÍNEA DE TIEMPO DEL DÍA</span>
             </div>
             <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-4 py-1 rounded-full border border-blue-500/20">{timeFilter}:00h</span>
           </div>
           <input type="range" min="0" max="24" value={timeFilter} onChange={(e) => setTimeFilter(Number(e.target.value))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer" />
        </div>
        <div className="bg-[#111114]/95 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-6 pointer-events-auto">
           <div className="flex flex-col">
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">AGENTES EN RADAR</p>
             <p className="text-2xl font-black text-white leading-none">{markers.length}</p>
           </div>
           <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 group">
             <DownloadSimple size={18} weight="bold" className="group-hover:translate-y-0.5 transition-transform" />
             {isExporting ? 'GENERANDO...' : 'AUDITORÍA PDF'}
           </button>
           <button onClick={handleExportInspection} disabled={isExporting} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 group">
             <ShieldCheck size={18} weight="bold" className="group-hover:scale-110 transition-transform" />
             {isExporting ? 'GENERANDO...' : 'REGISTRO LEGAL'}
           </button>
        </div>
      </div>
      
      {/* Mapbox Container */}
      <div className="absolute inset-0 z-[1000] overflow-hidden rounded-[40px]">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      
      <style>{`
        .premium-mapbox-popup .mapboxgl-popup-content { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .premium-mapbox-popup .mapboxgl-popup-tip { display: none !important; }
        .mapboxgl-canvas-container { cursor: crosshair !important; }
        .mapboxgl-canvas { filter: invert(90%) hue-rotate(180deg) brightness(0.85); }
        .zoom-slider-v-final { -webkit-appearance: none; appearance: none; writing-mode: vertical-lr; direction: rtl; width: 6px; height: 110px; background: rgba(255,255,255,0.1); border-radius: 10px; outline: none; }
        .zoom-slider-v-final::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; cursor: pointer; box-shadow: 0 0 15px rgba(59,130,246,0.6); }
      `}</style>
    </div>
  );

  return (
    <>
      {renderMapLayout(false)}
      {isFullscreen && createPortal(renderMapLayout(true), document.body)}
    </>
  );
}
