import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, ShieldCheck, Navigation } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapEvents({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function WorkCenterForm({ initialData, onSubmit, onCancel, loading }) {
  const safe = initialData ?? {};
  const [formData, setFormData] = useState({
    name: safe.name || '',
    latitude: safe.latitude || 40.4167,
    longitude: safe.longitude || -3.7037,
    radiusMeters: safe.radiusMeters || 100,
  });

  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMapClick = (latlng) => {
    setFormData(prev => ({
      ...prev,
      latitude: parseFloat(latlng.lat.toFixed(6)),
      longitude: parseFloat(latlng.lng.toFixed(6)),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre del centro es obligatorio.');
      return;
    }
    onSubmit(formData);
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          }));
        },
        () => setError('No se pudo obtener la ubicación actual.')
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
          <MapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Configurar Sede</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Centro de Trabajo y Geofencing</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all text-white"
            placeholder="Ej: Oficina Central, Obra Pozuelo..."
            required
          />
        </div>

        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl overflow-hidden shadow-inner">
          <div className="h-[250px] relative">
            <MapContainer 
              center={[formData.latitude, formData.longitude]} 
              zoom={13} 
              style={{ h: '100%', width: '100%', height: '250px' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              />
              <Marker position={[formData.latitude, formData.longitude]} />
              <Circle 
                center={[formData.latitude, formData.longitude]} 
                radius={formData.radiusMeters} 
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
              />
              <MapEvents onClick={handleMapClick} />
            </MapContainer>
            
            <button 
              type="button"
              onClick={getMyLocation}
              className="absolute bottom-4 right-4 z-[1000] p-3 bg-blue-600 text-white rounded-xl shadow-2xl hover:bg-blue-500 transition-all active:scale-95"
              title="Mi ubicación"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter block">Latitud</span>
              <span className="text-xs font-mono text-zinc-300">{formData.latitude}</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter block">Longitud</span>
              <span className="text-xs font-mono text-zinc-300">{formData.longitude}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Radio de Geocerca
            </label>
            <span className="text-sm font-mono font-black text-blue-400">{formData.radiusMeters}m</span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={formData.radiusMeters}
            onChange={e => handleChange('radiusMeters', parseInt(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
          />
          <p className="text-[9px] text-zinc-500 leading-relaxed font-medium">
            Los empleados solo podrán fichar si su ubicación GPS se encuentra dentro de este radio respecto al centro seleccionado.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 rounded-2xl bg-[#111114] border border-white/5 text-zinc-400 font-black text-[11px] uppercase tracking-widest hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
          disabled={loading}
        >
          {loading ? 'Guardando...' : safe.id ? 'Actualizar Sede' : 'Registrar Centro'}
        </button>
      </div>
    </form>
  );
}
