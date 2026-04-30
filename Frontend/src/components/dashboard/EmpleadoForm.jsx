import React, { useState } from 'react';
import { 
  User, 
  EnvelopeSimple, 
  ShieldCheck, 
  IdentificationCard, 
  Phone, 
  MapPin, 
  CurrencyCircleDollar,
  Briefcase,
  Buildings,
  DeviceMobile,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function EmpleadoForm({ initialValues, onSubmit, onCancel, isSubmitting }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState(initialValues ?? {
    displayName: '',
    email: '',
    role: 'employee',
    dni: '',
    phone: '',
    hourlyRate: 0,
    status: 'active',
    workCenterId: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tabs = [
    { id: 'personal', label: 'Personal', icon: User },
    { id: 'laboral', label: 'Laboral', icon: Briefcase },
    { id: 'seguridad', label: 'Seguridad', icon: DeviceMobile },
    { id: 'acceso', label: 'Acceso', icon: ShieldCheck },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mini Tab Navigation */}
      <div className="flex p-1 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <tab.icon weight={activeTab === tab.id ? "fill" : "bold"} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[320px]">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <FormInput 
              label="Nombre Completo" 
              name="displayName" 
              value={formData.displayName} 
              onChange={handleChange} 
              icon={User} 
              placeholder="Juan Pérez" 
            />
            <FormInput 
              label="DNI / NIE" 
              name="dni" 
              value={formData.dni} 
              onChange={handleChange} 
              icon={IdentificationCard} 
              placeholder="12345678X" 
            />
            <FormInput 
              label="Email Personal" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              icon={EnvelopeSimple} 
              placeholder="juan@email.com" 
              type="email" 
            />
            <FormInput 
              label="Teléfono" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              icon={Phone} 
              placeholder="+34 600..." 
            />
          </div>
        )}

        {activeTab === 'laboral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Sede Asignada</label>
              <div className="relative group">
                <Buildings className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
                <select 
                  name="workCenterId" 
                  value={formData.workCenterId} 
                  onChange={handleChange}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 focus:outline-none focus:border-blue-500/40 transition-all appearance-none"
                >
                  <option value="">Seleccionar sede...</option>
                  <option value="main">Sede Principal</option>
                  <option value="madrid">Delegación Madrid</option>
                </select>
              </div>
            </div>
            <FormInput 
              label="Tarifa Hora (€)" 
              name="hourlyRate" 
              value={formData.hourlyRate} 
              onChange={handleChange} 
              icon={CurrencyCircleDollar} 
              placeholder="0.00" 
              type="number" 
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Estado Contractual</label>
              <div className="flex gap-2">
                {['active', 'suspended'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, status: s }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all",
                      formData.status === s 
                        ? (s === 'active' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500") 
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {s === 'active' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {s === 'active' ? 'Vigente' : 'Baja'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SecurityToggle 
                title="Geolocalización"
                subtitle="Obliga al GPS para fichar"
                active={formData.requiresGeolocation}
                onClick={() => setFormData(p => ({ ...p, requiresGeolocation: !p.requiresGeolocation }))}
              />
              <SecurityToggle 
                title="Escaneo QR"
                subtitle="Fichaje presencial físico"
                active={formData.requiresQR}
                onClick={() => setFormData(p => ({ ...p, requiresQR: !p.requiresQR }))}
              />
              <SecurityToggle 
                title="Modo Automático"
                subtitle="David's Zero-Touch Mode"
                active={formData.isAutoClockEnabled}
                onClick={() => setFormData(p => ({ ...p, isAutoClockEnabled: !p.isAutoClockEnabled }))}
              />
            </div>

            <div className="p-6 rounded-2xl bg-[#111114] border border-white/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Vínculo de Dispositivo</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Restringe el fichaje a un único terminal móvil.</p>
                </div>
                {formData.authorizedDeviceId ? (
                   <Badge color="blue">Vinculado</Badge>
                ) : (
                   <Badge color="zinc">Sin Vincular</Badge>
                )}
              </div>
              
              {formData.authorizedDeviceId && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <DeviceMobile className="w-5 h-5 text-zinc-400" />
                    <span className="text-[10px] font-mono text-zinc-500">{formData.authorizedDeviceId}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, authorizedDeviceId: null }))}
                    className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    Desvincular
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'acceso' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 rounded-2xl bg-blue-600/5 border border-blue-600/10 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck weight="duotone" className="w-5 h-5 text-blue-500" />
                Nivel de Permisos
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {['employee', 'manager', 'admin'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role: r }))}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      formData.role === r ? "bg-blue-600 border-blue-600 text-white" : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <div className="flex flex-col items-start">
                       <span className="text-xs font-black uppercase tracking-widest">{r}</span>
                       <span className={cn("text-[10px] font-medium", formData.role === r ? "text-blue-100" : "text-zinc-600")}>
                          {r === 'admin' ? 'Control total sobre el sistema' : r === 'manager' ? 'Gestión de equipos y sedes' : 'Acceso básico a fichajes'}
                       </span>
                    </div>
                    {formData.role === r && <CheckCircle weight="fill" className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isSubmitting ? 'Guardando...' : (initialValues?.id ? 'Actualizar' : 'Guardar Empleado')}
        </button>
      </div>
    </form>
  );
}

function SecurityToggle({ title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-5 rounded-2xl border transition-all text-left",
        active 
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
          : "bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:border-white/10"
      )}
    >
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
        {active ? <CheckCircle weight="fill" className="w-4 h-4" /> : <XCircle className="w-4 h-4 opacity-30" />}
      </div>
      <p className="text-[10px] font-medium opacity-60 leading-tight">{subtitle}</p>
    </button>
  );
}

function FormInput({ label, icon: Icon, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
        <input 
          {...props}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all placeholder:text-zinc-700"
        />
      </div>
    </div>
  );
}
