import React from 'react';
import { 
  GearSix, 
  Bell, 
  ShieldCheck, 
  Globe, 
  Eye, 
  UserCircle,
  Clock,
  DeviceMobile,
  CheckCircle,
  FloppyDisk,
  Key,
  CreditCard,
  Database,
  CloudArrowUp
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

export default function ConfiguracionTab() {
  const [settings, setSettings] = React.useState({
    notifications: true,
    emailAlerts: false,
    geofencingStrict: true,
    autoClockOut: false,
    darkMode: true,
    pwaPrompt: true,
    apiEnabled: true,
    autoBackup: true
  });

  const updateSetting = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="space-y-8 pb-10">
      <SectionHeader 
        icon={GearSix}
        title="Configuración de Empresa"
        subtitle="Gestiona los parámetros globales de la organización, integraciones y facturación."
        actionLabel="Guardar Cambios"
        actionIcon={FloppyDisk}
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notificaciones */}
        <SettingsGroup title="Notificaciones del Sistema" icon={Bell}>
          <SettingRow 
            title="Alertas de Fichaje" 
            desc="Notificar cuando un empleado inicie o finalice su turno." 
            enabled={settings.notifications} 
            onChange={() => updateSetting('notifications')}
          />
          <SettingRow 
            title="Reportes Semanales" 
            desc="Enviar resumen de horas por email a administración." 
            enabled={settings.emailAlerts} 
            onChange={() => updateSetting('emailAlerts')}
          />
        </SettingsGroup>

        {/* Seguridad */}
        <SettingsGroup title="Seguridad y Control" icon={ShieldCheck}>
          <SettingRow 
            title="Geofencing Estricto" 
            desc="Impedir fichajes fuera del radio de 200m de la sede." 
            enabled={settings.geofencingStrict} 
            onChange={() => updateSetting('geofencingStrict')}
          />
          <SettingRow 
            title="Cierre de Jornada Forzado" 
            desc="Finalizar fichajes abiertos automáticamente tras 12h." 
            enabled={settings.autoClockOut} 
            onChange={() => updateSetting('autoClockOut')}
          />
        </SettingsGroup>

        {/* API e Integraciones */}
        <SettingsGroup title="API e Integraciones" icon={Key}>
           <div className="space-y-4">
              <SettingRow 
                title="Acceso API Externo" 
                desc="Permitir que otros sistemas consulten datos de fichaje." 
                enabled={settings.apiEnabled} 
                onChange={() => updateSetting('apiEnabled')}
              />
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">API Key de Producción</span>
                    <Badge color="emerald">Activa</Badge>
                 </div>
                 <div className="font-mono text-xs text-blue-400 bg-black/40 p-2 rounded border border-white/[0.05] truncate">
                    tm_prod_8273_kx92_as827162_v91
                 </div>
                 <button className="text-[10px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-colors">Regenerar Clave</button>
              </div>
           </div>
        </SettingsGroup>

        {/* Facturación y Plan */}
        <SettingsGroup title="Suscripción y Plan" icon={CreditCard}>
           <div className="p-8 bg-gradient-to-br from-blue-600/10 via-[#111114] to-transparent border border-blue-500/20 rounded-[24px] space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-colors" />
              <div className="flex items-center justify-between relative z-10">
                 <div>
                    <Badge color="blue" dot className="mb-3">Plan Activo</Badge>
                    <h4 className="text-2xl font-black text-white">Tempos Enterprise</h4>
                    <p className="text-sm text-zinc-500 font-medium mt-1">Soporte 24/7 y SLA garantizado</p>
                 </div>
                 <div className="text-right">
                    <p className="text-4xl font-black text-white">149€<span className="text-sm text-zinc-500 font-bold">/mes</span></p>
                 </div>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                  <span>Licencias en uso</span>
                  <span>325 / 500</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </div>
              </div>
              <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-[0.98] relative z-10">Acceder al Portal de Facturación (Stripe)</button>
           </div>
        </SettingsGroup>

        {/* Backups */}
        <SettingsGroup title="Copias de Seguridad" icon={Database}>
           <SettingRow 
             title="Backup Automático" 
             desc="Copia diaria de la base de datos en la nube (S3)." 
             enabled={settings.autoBackup} 
             onChange={() => updateSetting('autoBackup')}
           />
           <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-3">
                 <CloudArrowUp className="w-5 h-5 text-emerald-500" weight="duotone" />
                 <div>
                    <p className="text-xs font-bold text-white">Última copia realizada</p>
                    <p className="text-[10px] text-zinc-500">Hoy a las 04:00 AM (2.4 GB)</p>
                 </div>
              </div>
              <button className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">Descargar</button>
           </div>
        </SettingsGroup>

        {/* Región */}
        <Card className="bg-[#111114]">
          <CardHeader className="flex items-center gap-3">
             <Globe className="w-5 h-5 text-zinc-500" weight="duotone" />
             <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Localización</span>
          </CardHeader>
          <CardBody className="p-8 space-y-6">
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Zona Horaria</label>
                   <select className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all appearance-none">
                      <option>Europe/Madrid (GMT+2)</option>
                      <option>Atlantic/Canary (GMT+1)</option>
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Idioma de la Plataforma</label>
                   <select className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-sm font-semibold text-zinc-300 outline-none focus:border-blue-500/40 transition-all appearance-none">
                      <option>Español (Castellano)</option>
                      <option>English (UK)</option>
                   </select>
                </div>
             </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function SettingsGroup({ title, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-zinc-500" weight="duotone" />
        <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
      </CardHeader>
      <CardBody className="space-y-6">
        {children}
      </CardBody>
    </Card>
  );
}

function SettingRow({ title, desc, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <h5 className="text-sm font-bold text-white leading-none">{title}</h5>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">{desc}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}
