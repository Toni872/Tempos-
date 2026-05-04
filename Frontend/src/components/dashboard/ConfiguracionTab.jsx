import React, { useState } from 'react';
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
  CloudArrowUp,
  Fingerprint,
  Cpu,
  ArrowsClockwise,
  Browsers,
  Translate,
  Buildings,
  Gavel,
  Image as ImageIcon,
  FileText
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfiguracionTab() {
  const [activeSubTab, setActiveSubTab] = useState('empresa'); // 'empresa', 'sistema', 'legal'
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    geofencingStrict: true,
    autoClockOut: false,
    apiEnabled: true,
    autoBackup: true
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: 'Tempos B2B Solutions S.L.',
    cif: 'B-12345678',
    address: 'Calle de la Innovación, 42, 28001 Madrid, España',
    industry: 'Tecnología / Recursos Humanos',
    website: 'https://tempos.es'
  });

  const updateSetting = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <SectionHeader 
        icon={GearSix}
        title="Centro de Configuración Global"
        subtitle="Gestión de identidad corporativa, protocolos operativos y cumplimiento normativo legal."
        actionLabel="GUARDAR CAMBIOS"
        actionIcon={FloppyDisk}
        onAction={() => {}}
      />

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-[2rem] w-fit">
        {[
          { id: 'empresa', label: 'Mi Empresa', icon: Buildings },
          { id: 'sistema', label: 'Protocolos de Sistema', icon: Cpu },
          { id: 'legal', label: 'Legal & Compliance', icon: Gavel },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group",
              activeSubTab === tab.id 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon size={16} weight={activeSubTab === tab.id ? "fill" : "regular"} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MI EMPRESA TAB */}
        {activeSubTab === 'empresa' && (
          <motion.div 
            key="empresa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-10"
          >
            <div className="xl:col-span-2 space-y-10">
              <SettingsGroup title="Identidad Corporativa" icon={Buildings} badge="FISCAL">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <InputGroup 
                    label="Nombre Legal / Razón Social" 
                    name="name" 
                    value={companyInfo.name} 
                    onChange={handleInputChange} 
                  />
                  <InputGroup 
                    label="CIF / NIF" 
                    name="cif" 
                    value={companyInfo.cif} 
                    onChange={handleInputChange} 
                  />
                  <div className="sm:col-span-2">
                    <InputGroup 
                      label="Dirección Social (Sede Central)" 
                      name="address" 
                      value={companyInfo.address} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <InputGroup 
                    label="Sector de Actividad" 
                    name="industry" 
                    value={companyInfo.industry} 
                    onChange={handleInputChange} 
                  />
                  <InputGroup 
                    label="Sitio Web Corporativo" 
                    name="website" 
                    value={companyInfo.website} 
                    onChange={handleInputChange} 
                  />
                </div>
              </SettingsGroup>
            </div>

            <div className="space-y-10">
              <SettingsGroup title="Branding Visual" icon={ImageIcon} badge="LOGO">
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.01] hover:border-blue-500/30 transition-all group/logo cursor-pointer">
                  <div className="w-24 h-24 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 group-hover/logo:scale-110 transition-transform shadow-2xl">
                    <CloudArrowUp size={40} weight="fill" />
                  </div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-center">Arrastra el logo corporativo</p>
                  <p className="text-[9px] text-white/10 font-bold uppercase mt-2 tracking-widest">PNG / SVG (Máx. 2MB)</p>
                </div>
                <div className="mt-6 p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                  <p className="text-[9px] text-blue-400 font-bold uppercase leading-relaxed text-center italic">
                    Este logo se utilizará automáticamente en todos los informes de auditoría y nóminas generadas por el sistema.
                  </p>
                </div>
              </SettingsGroup>
            </div>
          </motion.div>
        )}

        {/* SISTEMA TAB (Antigua configuración) */}
        {activeSubTab === 'sistema' && (
          <motion.div 
            key="sistema"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-10"
          >
            <SettingsGroup title="Protocolos de Notificación" icon={Bell} badge="SISTEMA">
              <SettingRow 
                title="Alertas de Evento Temporal" 
                desc="Notificaciones push instantáneas sobre fluctuaciones en fichajes de escuadrón." 
                enabled={settings.notifications} 
                onChange={() => updateSetting('notifications')}
              />
              <SettingRow 
                title="Despacho de Auditoría" 
                desc="Envío automático de resúmenes consolidados a la terminal de administración." 
                enabled={settings.emailAlerts} 
                onChange={() => updateSetting('emailAlerts')}
              />
            </SettingsGroup>

            <SettingsGroup title="Blindaje Perimetral" icon={ShieldCheck} badge="AUDITORÍA">
              <SettingRow 
                title="Geofencing de Precisión" 
                desc="Restricción de operaciones fuera de los vectores de seguridad de la sede (200m)." 
                enabled={settings.geofencingStrict} 
                onChange={() => updateSetting('geofencingStrict')}
              />
              <SettingRow 
                title="Purga de Sesiones Abiertas" 
                desc="Cierre forzado de jornadas de trabajo tras un ciclo de 12 horas de inactividad." 
                enabled={settings.autoClockOut} 
                onChange={() => updateSetting('autoClockOut')}
              />
            </SettingsGroup>

            <SettingsGroup title="Respaldo de Sistema" icon={Database} badge="INFRA">
              <div className="space-y-6">
                  <SettingRow 
                    title="Réplica Automática" 
                    desc="Sincronización diaria del núcleo de datos en nodos de redundancia segura." 
                    enabled={settings.autoBackup} 
                    onChange={() => updateSetting('autoBackup')}
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                          <CloudArrowUp size={24} weight="fill" />
                      </div>
                      <div>
                          <p className="text-xs font-black text-white uppercase italic tracking-tight">Respaldo Activo</p>
                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1">Hoy, 04:00 AM</p>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto px-6 py-2 bg-white/[0.03] hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-all">
                      DESCARGAR
                    </button>
                  </div>
              </div>
            </SettingsGroup>

            <SettingsGroup title="Interfaz de Desarrollo (API)" icon={Key} badge="DESARROLLO">
               <div className="space-y-6">
                  <SettingRow 
                    title="Acceso de Integración" 
                    desc="Habilitar el túnel de datos para sistemas externos certificados." 
                    enabled={settings.apiEnabled} 
                    onChange={() => updateSetting('apiEnabled')}
                  />
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/40" />
                     <div className="font-mono text-[11px] text-blue-400/80 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04] truncate tracking-widest italic select-all">
                        tm_prod_8273_kx92_as827162_v91
                     </div>
                  </div>
               </div>
            </SettingsGroup>
          </motion.div>
        )}

        {/* LEGAL & COMPLIANCE TAB */}
        {activeSubTab === 'legal' && (
          <motion.div 
            key="legal"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 xl:grid-cols-2 gap-10"
          >
            <SettingsGroup title="Marco Normativo Local" icon={Gavel} badge="RGPD">
              <div className="space-y-8">
                <div className="flex items-center gap-5 p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <CheckCircle size={28} weight="fill" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tight">Cumplimiento RGPD Nivel 3</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Última Auditoría: Hace 2 días</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <LegalDocumentRow 
                    title="Política de Privacidad" 
                    status="Personalizada" 
                    updated="12 May 2026" 
                  />
                  <LegalDocumentRow 
                    title="Términos de Servicio" 
                    status="Activa" 
                    updated="10 May 2026" 
                  />
                  <LegalDocumentRow 
                    title="Política de Cookies" 
                    status="Estándar Tempos" 
                    updated="01 May 2026" 
                  />
                </div>
              </div>
            </SettingsGroup>

            <SettingsGroup title="Delegado de Protección (DPO)" icon={UserCircle} badge="LEGAL">
              <div className="space-y-8">
                 <p className="text-[11px] text-white/40 italic leading-relaxed">
                   Es obligatorio designar un DPO si se procesan datos sensibles a gran escala. Tempos incluye asesoría legal básica en el plan Enterprise.
                 </p>
                 <div className="space-y-6">
                   <InputGroup label="Nombre del Responsable" value="Antonio Jurídico" readOnly />
                   <InputGroup label="Email de Contacto Legal" value="legal@tempos.es" readOnly />
                   <button className="w-full py-4 border border-white/5 bg-white/[0.02] hover:bg-white/5 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all">
                      SOLICITAR CONSULTA LEGAL
                   </button>
                 </div>
              </div>
            </SettingsGroup>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center pt-10">
         <div className="flex items-center gap-4 text-white/10 grayscale opacity-40 group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <Cpu size={24} weight="fill" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Infraestructura administrada por Tempos • Software Legal 2026</span>
         </div>
      </div>
    </div>
  );
}

function SettingsGroup({ title, icon: Icon, badge, children }) {
  return (
    <Card className="bg-[#0d0d0f]/40 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all group overflow-hidden shadow-2xl">
      <CardHeader className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-500 transition-colors border border-white/5 shadow-inner">
            <Icon size={20} weight="fill" />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] italic">{title}</span>
        </div>
        <Badge color="zinc" className="opacity-40 group-hover:opacity-100 transition-opacity tracking-[0.2em] font-black">{badge}</Badge>
      </CardHeader>
      <CardBody className="p-10 space-y-8">
        {children}
      </CardBody>
    </Card>
  );
}

function SettingRow({ title, desc, enabled, onChange }) {
  return (
    <div className="flex items-start justify-between gap-10 group/row">
      <div className="space-y-2 flex-1">
        <h5 className="text-sm font-black text-white italic uppercase tracking-tighter group-hover/row:text-blue-400 transition-colors">{title}</h5>
        <p className="text-[11px] text-white/40 font-medium leading-relaxed italic pr-6">{desc}</p>
      </div>
      <div className="pt-1">
        <Toggle enabled={enabled} onChange={onChange} />
      </div>
    </div>
  );
}

function InputGroup({ label, ...props }) {
  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">{label}</label>
      <input 
        {...props}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-xs font-black text-white outline-none focus:border-blue-500/40 transition-all uppercase tracking-widest placeholder:text-white/10"
      />
    </div>
  );
}

function LegalDocumentRow({ title, status, updated }) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl group/doc hover:bg-white/[0.03] transition-all cursor-pointer">
       <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover/doc:text-blue-500 transition-colors">
             <FileText size={20} weight="fill" />
          </div>
          <div>
             <p className="text-[10px] font-black text-white uppercase italic tracking-tight">{title}</p>
             <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">Actualizado: {updated}</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">{status}</span>
          <Eye size={16} className="text-white/10 group-hover/doc:text-white transition-colors" />
       </div>
    </div>
  );
}
