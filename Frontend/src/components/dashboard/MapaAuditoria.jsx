import React, { useMemo, useEffect, useState, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
import { exportAuditPDF, exportInspectionPDF, getClientSession } from '@/lib/api'; // Importamos funciones específicas

const DEFAULT_CENTER = [40.4168, -3.7038];
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

const MapController = memo(({ isFullscreen, zoom, setZoom, centerRequest }) => {
  const map = useMap();
  useMapEvents({ zoomend: () => setZoom(Math.round(map.getZoom())) });
  useEffect(() => { if (Math.abs(map.getZoom() - zoom) > 0.1) map.setZoom(zoom, { animate: true }); }, [zoom, map]);
  useEffect(() => { 
    if (centerRequest) {
      map.flyTo(centerRequest, Math.max(14, zoom), { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [centerRequest, map]);
  useEffect(() => { const timer = setTimeout(() => map.invalidateSize(), 250); return () => clearTimeout(timer); }, [isFullscreen, map]);
  return null;
});

const MapContent = memo(({ center, markers, workCenters, isFullscreen, showGeofence, showHeatmap, zoom, setZoom, centerRequest, userLocation }) => {
  return (
    <MapContainer 
      center={center || DEFAULT_CENTER} 
      zoom={zoom} 
      scrollWheelZoom={true}
      dragging={true}
      style={{ height: '100%', width: '100%', background: '#0a0a0c' }}
      zoomControl={false}
      attributionControl={false}
    >
      <MapController isFullscreen={isFullscreen} zoom={zoom} setZoom={setZoom} centerRequest={centerRequest} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {showGeofence && (workCenters || []).map((wc, idx) => (
        wc && wc.latitude && wc.longitude && (
          <Circle 
            key={`geofence-${wc.id || idx}`}
            center={[Number(wc.latitude), Number(wc.longitude)]}
            radius={Number(wc.radiusMeters) || 500}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 1.5, dashArray: '10, 15' }}
          />
        )
      ))}
      {/* Marcador de la ubicación actual del usuario */}
      {userLocation && (
        <Marker 
          position={[userLocation.lat, userLocation.lng]}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-12 h-12 bg-blue-500/20 rounded-full animate-ping"></div>
                <div class="relative w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
          })}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
            <span className="text-[10px] font-black uppercase text-blue-600 px-2">TU UBICACIÓN</span>
          </Tooltip>
        </Marker>
      )}

      {markers.map((m, idx) => {
        const isActive = !m.endTime;
        const iconHtml = showHeatmap 
          ? `<div class="w-20 h-20 rounded-full blur-3xl opacity-60 bg-red-600 animate-pulse"></div>`
          : `<div class="w-6 h-6 rounded-full border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] flex items-center justify-center ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}">
               <div class="w-2 h-2 bg-white rounded-full ${isActive ? 'animate-ping' : ''}"></div>
             </div>`;
        return (
          <Marker 
            key={`marker-${m.id || idx}`} 
            position={[m.pos.lat, m.pos.lng]} 
            icon={L.divIcon({ 
              className: 'custom-marker', 
              html: iconHtml, 
              iconSize: showHeatmap ? [80, 80] : [24, 24], 
              iconAnchor: showHeatmap ? [40, 40] : [12, 12] 
            })}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="premium-tooltip-container">
              <div className="p-5 min-w-[240px] bg-white text-zinc-900 rounded-[24px] border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-center mb-4">
                   <Badge color={isActive ? 'emerald' : 'rose'}>{isActive ? 'ACTIVO' : 'SALIDA'}</Badge>
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                     <ShieldCheck weight="fill" className="w-3.5 h-3.5" /> GPS SECURE
                   </div>
                </div>
                <h4 className="text-sm font-black tracking-tight text-zinc-900 mb-1">{m.employeeName}</h4>
                <div className="flex items-center gap-2 mb-5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                   <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{m.deviceId || 'DISPOSITIVO ENCRIP.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 border-t border-zinc-100 pt-4">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-zinc-400 uppercase block tracking-[0.15em]">Entrada</span>
                    <span className="text-xs font-black text-zinc-800 tabular-nums">{formatTime(m.startTime)}h</span>
                  </div>
                  {m.endTime && (
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-black text-zinc-400 uppercase block tracking-[0.15em]">Salida</span>
                      <span className="text-xs font-black text-rose-600 tabular-nums">{formatTime(m.endTime)}h</span>
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
});

export default function MapaAuditoria({ fichas = [], workCenters = [], employees = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGeofence, setShowGeofence] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [timeFilter, setTimeFilter] = useState(24);
  const [zoom, setZoom] = useState(14);
  const [centerRequest, setCenterRequest] = useState(null);
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
    if (markers.length > 0) return [markers[0].pos.lat, markers[0].pos.lng];
    return DEFAULT_CENTER;
  }, [markers]);

  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);
  const toggleGeofence = useCallback(() => setShowGeofence(v => !v), []);
  const toggleHeatmap = useCallback(() => setShowHeatmap(v => !v), []);
  
  const handleRecenter = useCallback(() => {
    if (markers.length > 0) {
      setCenterRequest([...center]);
      setTimeout(() => setCenterRequest(null), 100);
    }
  }, [center, markers]);

  const handleDetectLocation = useCallback(() => {
    console.log('📡 [GPS] Iniciando detección...');
    if (!navigator.geolocation) {
      console.error('❌ [GPS] Geolocalización no soportada');
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ [GPS] Ubicación obtenida:', position.coords);
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setUserLocation(newLoc);
        setCenterRequest([latitude, longitude]);
        setZoom(16);
        setIsLocating(false);
        setTimeout(() => setCenterRequest(null), 100);
      },
      (error) => {
        console.error("❌ [GPS] Error detectando ubicación:", error);
        let msg = "No se pudo obtener tu ubicación.";
        if (error.code === 1) msg = "Permiso denegado. Por favor, activa el GPS en el candado de la barra de direcciones.";
        if (error.code === 2) msg = "Ubicación no disponible.";
        if (error.code === 3) msg = "Tiempo de espera agotado.";
        alert(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // FUNCIÓN DE EXPORTACIÓN FINAL Y SEGURA
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
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

    } catch (error) {
      console.error("Error al descargar auditoría:", error);
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
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

    } catch (error) {
      console.error("Error al descargar registro legal:", error);
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
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z+1))} className="text-zinc-500 hover:text-blue-400 transition-colors">
            <MagnifyingGlassPlus size={20} weight="bold" />
          </button>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
            Acercar
          </div>
        </div>
        
        <div className="h-28 flex items-center">
          <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="zoom-slider-v-final" />
        </div>

        <div className="group relative">
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z-1))} className="text-zinc-500 hover:text-blue-400 transition-colors">
            <MagnifyingGlassMinus size={20} weight="bold" />
          </button>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap border border-white/10 shadow-2xl">
            Alejar
          </div>
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
      <div className="absolute inset-0 z-[1000]">
        <div style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(0.85)', height: '100%', width: '100%' }}>
          <MapContent 
            center={center} 
            markers={markers} 
            workCenters={workCenters} 
            isFullscreen={isFull} 
            showGeofence={showGeofence} 
            showHeatmap={showHeatmap} 
            zoom={zoom} 
            setZoom={setZoom} 
            centerRequest={centerRequest}
            userLocation={userLocation}
          />
        </div>
      </div>
      <style>{`
        .premium-tooltip-container { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .premium-tooltip-container::before { display: none !important; }
        .leaflet-container { background: #0a0a0c !important; cursor: crosshair !important; }
        .custom-marker { filter: invert(100%) hue-rotate(180deg) brightness(1.25); }
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
