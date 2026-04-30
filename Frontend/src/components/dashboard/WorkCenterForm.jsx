import React, { useState } from 'react';
import { 
  Buildings, 
  MapPin, 
  Crosshair, 
  NavigationArrow,
  CheckCircle,
  FloppyDisk
} from '@phosphor-icons/react';
import Toggle from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';

export default function WorkCenterForm({ initialData, onSubmit, onCancel }) {
  // Aseguramos valores por defecto para evitar warnings de uncontrolled input
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    latitude: Number(initialData?.latitude || 40.4168),
    longitude: Number(initialData?.longitude || -3.7038),
    radiusMeters: Number(initialData?.radiusMeters || initialData?.radius || 100),
    geofencingEnabled: initialData?.geofencingEnabled ?? false
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Enviamos los datos asegurando el formato numérico para el Backend
    onSubmit({
      ...formData,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      radiusMeters: Number(formData.radiusMeters)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <FormInput 
          label="Nombre de la Sede" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          icon={Buildings} 
          placeholder="Ej. Oficina Central" 
          required
        />
        
        <FormInput 
          label="Dirección Física" 
          name="address" 
          value={formData.address} 
          onChange={handleChange} 
          icon={MapPin} 
          placeholder="Calle, Ciudad, CP" 
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput 
            label="Latitud" 
            name="latitude" 
            value={formData.latitude} 
            onChange={handleChange} 
            icon={NavigationArrow} 
            type="number" 
            step="any"
            required
          />
          <FormInput 
            label="Longitud" 
            name="longitude" 
            value={formData.longitude} 
            onChange={handleChange} 
            icon={NavigationArrow} 
            type="number" 
            step="any"
            required
          />
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Crosshair weight="duotone" className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Geofencing</h4>
                    <p className="text-[10px] text-zinc-600 font-medium mt-1">Limitar fichajes al radio de la sede.</p>
                 </div>
              </div>
              <Toggle 
                enabled={formData.geofencingEnabled} 
                onChange={(val) => setFormData(p => ({ ...p, geofencingEnabled: val }))} 
              />
           </div>

           {formData.geofencingEnabled && (
             <div className="pt-4 border-t border-white/[0.04] animate-in fade-in slide-in-from-top-2">
                <FormInput 
                  label="Radio de Tolerancia (Metros)" 
                  name="radiusMeters" 
                  value={formData.radiusMeters} 
                  onChange={handleChange} 
                  icon={Crosshair} 
                  type="number" 
                  placeholder="100" 
                  min="10"
                  max="5000"
                />
             </div>
           )}
        </div>
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
          Cancelar
        </button>
        <button type="submit" className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
           {initialData?.id ? 'Actualizar Sede' : 'Registrar Sede'}
        </button>
      </div>
    </form>
  );
}

function FormInput({ label, icon: Icon, value, ...props }) {
  // Aseguramos que el value nunca sea undefined
  const safeValue = value ?? '';
  
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
        <input 
          {...props}
          value={safeValue}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all placeholder:text-zinc-700"
        />
      </div>
    </div>
  );
}
