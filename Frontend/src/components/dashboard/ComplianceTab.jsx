import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  UserList, 
  ClockClockwise, 
  MagnifyingGlass,
  ArrowSquareOut,
  DownloadSimple,
  WarningCircle,
  CheckCircle,
  Eye,
  ChartLineUp,
  Fingerprint,
  Scales,
  ListChecks,
  LockKey,
  Buildings,
  Certificate,
  UsersThree
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComplianceTab({ onExportInspection }) {
  const [activeSection, setActiveSection] = useState('overview');

  const subprocessors = [
    { name: 'Google Cloud Platform (Firebase)', activity: 'Hosting y Base de Datos NoSQL', location: 'Bélgica (UE)', security: 'ISO 27001, SOC 2' },
    { name: 'Railway App', activity: 'Hosting Backend (Docker)', location: 'EE.UU. (Privacy Framework)', security: 'SOC 2' },
    { name: 'PostgreSQL (Railway Managed)', activity: 'Base de Datos Relacional', location: 'EE.UU. (Privacy Framework)', security: 'Encryption at Rest' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ShieldCheck}
        title="Centro de Autoridad Legal"
        subtitle="Gestión avanzada de RGPD, Auditoría de Control Horario y Transparencia Normativa."
        actionLabel="SIMULACIÓN INSPECCIÓN"
        actionIcon={MagnifyingGlass}
        onAction={onExportInspection}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* SIDEBAR DE PROTOCOLOS */}
        <div className="lg:col-span-1 space-y-8">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 ml-2 italic">Protocolos de Auditoría</h3>
            {[
              { id: 'overview', name: 'Estado General', icon: ChartLineUp },
              { id: 'privacy', name: 'Política Privacidad', icon: FileText },
              { id: 'dpa', name: 'DPA y Seguridad', icon: LockKey },
              { id: 'subprocessors', name: 'Subencargados', icon: UsersThree },
              { id: 'retention', name: 'Política Retención', icon: ClockClockwise },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group",
                  activeSection === item.id 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 italic" 
                    : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon size={18} weight={activeSection === item.id ? "fill" : "bold"} className={cn("transition-transform", activeSection === item.id && "scale-110")} />
                {item.name}
              </button>
            ))}
          </div>

          <div className="pt-4">
            <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-3xl" />
              <div className="flex items-center gap-3 text-amber-500 relative z-10">
                <WarningCircle weight="fill" size={24} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Aviso Legal</span>
              </div>
              <p className="text-[11px] text-amber-200/40 leading-relaxed font-bold italic relative z-10 uppercase tracking-tighter">
                Este ecosistema cumple con el RDL 8/2019. El registro de jornada debe estar disponible permanentemente para empleados y representantes.
              </p>
            </div>
          </div>
        </div>

        {/* ÁREA DE DOCUMENTACIÓN */}
        <div className="lg:col-span-3 min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {activeSection === 'overview' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <StatusCard 
                      title="Trazabilidad Atómica"
                      desc="Eventos inalterables registrados bajo el protocolo SHA-256 (Art 34.9 ET)."
                      icon={Fingerprint}
                      badge="VERIFICADO"
                      color="emerald"
                    />
                    <StatusCard 
                      title="Protocolo GDPR"
                      desc="Purga automática y cifrado de datos tras el ciclo legal de 4 años."
                      icon={Scales}
                      badge="NORMATIVO"
                      color="blue"
                    />
                  </div>

                  {/* INSPECTION TERMINAL */}
                  <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-900/40 to-[#0d0d0f] text-white relative overflow-hidden border border-blue-500/20 shadow-2xl group">
                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-blue-600/10 blur-[120px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
                    <div className="absolute bottom-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                       <Certificate size={200} weight="thin" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                      <Badge color="blue" className="shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30 font-black tracking-widest italic">SISTEMA CERTIFICADO</Badge>
                      <div className="space-y-3">
                        <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-none">Simulador de Inspección de Trabajo</h3>
                        <p className="text-white/40 text-sm max-w-xl leading-relaxed font-medium italic">
                          Ejecute una auditoría sintética del motor de recolección de datos. Este proceso valida que la extracción de registros cumple rigurosamente con los requerimientos técnicos del RD 8/2019.
                        </p>
                      </div>
                      <button 
                        onClick={onExportInspection}
                        className="flex items-center gap-4 bg-white text-black hover:bg-blue-500 hover:text-white px-10 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 group/btn"
                      >
                        <MagnifyingGlass weight="bold" className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                        INICIAR PROTOCOLO DE AUDITORÍA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'privacy' && (
                <div className="bg-white/[0.01] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <FileText size={120} weight="thin" />
                  </div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-10 border-b border-white/5 pb-6">Política de Privacidad Integral</h2>
                  <div className="text-sm text-white/40 space-y-8 font-medium italic leading-loose">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Responsable del Tratamiento</p>
                          <p className="text-white font-bold uppercase tracking-tight">Su Organización / Entidad Legal (vía Ecosistema Tempos HR)</p>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Base Legal del Proceso</p>
                          <p className="text-white font-bold uppercase tracking-tight">Obligación legal según Art. 34.9 del Estatuto de los Trabajadores.</p>
                       </div>
                    </div>
                    <div className="space-y-4 pt-4">
                       <p><strong>Cláusula de Transparencia:</strong> Los datos recolectados (Identidad, Geofencing, Timestamps) se procesan exclusivamente para el cumplimiento normativo. No existe tratamiento para perfiles comerciales ni cesión a terceros fuera de los subencargados certificados.</p>
                       <p><strong>Derechos de Interesado:</strong> El ejercicio de los derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) puede realizarse directamente a través de la terminal de "Mi Perfil" o vía RRHH.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'subprocessors' && (
                <div className="bg-white/[0.01] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="px-10 py-8 bg-white/[0.02] border-b border-white/5">
                     <h3 className="text-sm font-black text-white italic uppercase tracking-tighter">Certificación de Infraestructura (Subencargados)</h3>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-white/[0.01]">
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Proveedor Certificado</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Actividad Técnica</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Ubicación / Seguridad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {subprocessors.map(sub => (
                        <tr key={sub.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-3">
                                <Buildings size={18} className="text-blue-500" />
                                <span className="font-black text-white italic uppercase tracking-tight">{sub.name}</span>
                             </div>
                          </td>
                          <td className="px-10 py-6 text-white/40 font-medium italic">{sub.activity}</td>
                          <td className="px-10 py-6">
                            <div className="flex flex-col gap-1">
                               <Badge color="zinc">{sub.location}</Badge>
                               <span className="text-[9px] font-mono text-white/20 tracking-tighter mt-1">{sub.security}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, desc, icon: Icon, badge, color }) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 space-y-6 group hover:border-white/10 transition-all shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:rotate-0 transition-transform duration-700" />
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl", 
        color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
      )}>
        <Icon weight="fill" size={28} />
      </div>
      <div>
        <h4 className="font-black text-white italic uppercase tracking-tighter text-lg">{title}</h4>
        <p className="text-[11px] text-white/40 mt-2 font-medium italic leading-relaxed">{desc}</p>
      </div>
      <Badge color={color} className="tracking-widest font-black italic">{badge}</Badge>
    </div>
  );
}
