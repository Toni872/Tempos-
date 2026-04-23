import { useMemo, useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const clockInIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#10b981;border:2px solid #065f46;border-radius:50%;box-shadow:0 0 8px rgba(16,185,129,0.6)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const clockOutIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;background:#ef4444;border:2px solid #7f1d1d;border-radius:50%;box-shadow:0 0 8px rgba(239,68,68,0.6)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const DEFAULT_CENTER = [40.4168, -3.7038];

function parseLocation(ficha) {
  const loc = ficha?.metadata?.location;
  if (!loc) return null;
  if (typeof loc === 'string') {
    const [lat, lng] = loc.split(',').map(Number);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }
  if (typeof loc === 'object' && loc.lat && loc.lng) {
    return { lat: Number(loc.lat), lng: Number(loc.lng) };
  }
  return null;
}

function formatTime(v) {
  return v ? String(v).slice(0, 5) : '—';
}

function InvalidateMapSize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(id);
  }, [trigger, map]);
  return null;
}

/**
 * Extracted as a stable component to prevent MapContainer remounting on parent re-renders.
 * MapContainer does NOT support dynamic center/zoom — it only reads props on first mount.
 */
const MapContent = memo(function MapContent({ center, markers, workCenters, isFullscreen }) {
  return (
    <MapContainer
      center={center}
      zoom={14}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
      className="leaflet-dark"
    >
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <InvalidateMapSize trigger={isFullscreen} />

      {workCenters.filter(c => c.latitude && c.longitude).map(c => (
        <Circle
          key={`circle-${c.id}`}
          center={[Number(c.latitude), Number(c.longitude)]}
          radius={c.radiusMeters || 200}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1.5 }}
        >
          <Popup>
            <div className="font-bold text-black">{c.name}</div>
            <div className="text-gray-500 text-xs">Sede autorizada · {c.radiusMeters}m</div>
          </Popup>
        </Circle>
      ))}

      {workCenters.filter(c => c.latitude && c.longitude).map(c => (
        <Marker key={`marker-${c.id}`} position={[Number(c.latitude), Number(c.longitude)]}>
          <Popup>
            <div className="font-bold text-black">{c.name}</div>
            <div className="text-gray-500 text-xs">Sede autorizada · {c.radiusMeters}m</div>
          </Popup>
        </Marker>
      ))}

      {markers.map((m) => (
        <Marker key={m.id} position={[m.pos.lat, m.pos.lng]} icon={m.endTime ? clockOutIcon : clockInIcon}>
          <Popup>
            <div className="font-bold text-black">{m.employeeName}</div>
            <div className="text-gray-600 text-xs">
              {new Date(m.date).toLocaleDateString('es-ES')} · {formatTime(m.startTime)}{m.endTime ? ` → ${formatTime(m.endTime)}` : ' (activo)'}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});

export default function MapaAuditoria({ fichas = [], workCenters = [], employees = [] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
