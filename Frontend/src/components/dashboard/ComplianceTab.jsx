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
  Eye
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function ComplianceTab({ onExportInspection }) {
  const [activeSection, setActiveSection] = useState('overview');

  const subprocessors = [
    { name: 'Google Cloud Platform (Firebase)', activity: 'Hosting y Base de Datos NoSQL', location: 'Bélgica (UE)', security: 'ISO 27001, SOC 2' },
    { name: 'Railway App', activity: 'Hosting Backend (Docker)', location: 'EE.UU. (Privacy Framework)', security: 'SOC 2' },
    { name: 'PostgreSQL (Railway Managed)', activity: 'Base de Datos Relacional', location: 'EE.UU. (Privacy Framework)', security: 'Encryption at Rest' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ShieldCheck}
        title="Centro de Cumplimiento Legal"
        subtitle="Gestión de RGPD, Auditoría de Control Horario y Transparencia."
        actionLabel="Simulación Inspección"
        actionIcon={MagnifyingGlass}
        onAction={onExportInspection}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'overview', name: 'Estado General', icon: ChartLineUp },
            { id: 'privacy', name: 'Política Privacidad', icon: FileText },
            { id: 'dpa', name: 'DPA y Seguridad', icon: ShieldCheck },
            { id: 'subprocessors', name: 'Subencargados', icon: UserList },
            { id: 'retention', name: 'Política Retención', icon: ClockClockwise },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeSection === item.id 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
              )}
            >
              {item.name}
            </button>
          ))}

          <div className="pt-6">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <WarningCircle weight="fill" size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Aviso Legal</span>
              </div>
              <p className="text-[11px] text-amber-200/60 leading-relaxed">
                Este software cumple con el RDL 8/2019. Recuerde que el registro debe estar disponible para empleados y representantes.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 min-h-[500px]">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-[24px] bg-[#111114] border border-white/[0.04] space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle weight="duotone" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200">Trazabilidad Atómica</h4>
                    <p className="text-xs text-zinc-500 mt-1">Todos los eventos son inalterables y auditables según Art 34.9 ET.</p>
                  </div>
                  <Badge color="emerald">Activo</Badge>
                </div>
                <div className="p-6 rounded-[24px] bg-[#111114] border border-white/[0.04] space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <ClockClockwise weight="duotone" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200">Purga GDPR</h4>
                    <p className="text-xs text-zinc-500 mt-1">Los registros se eliminan automáticamente tras 4 años de antigüedad.</p>
                  </div>
                  <Badge color="blue">Configurado</Badge>
                </div>
              </div>

              <div className="p-10 rounded-[32px] bg-gradient-to-br from-blue-900 to-[#111114] text-white relative overflow-hidden border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)] group">
                <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
                <div className="relative z-10 space-y-5">
                  <Badge color="blue" dot className="shadow-[0_0_15px_rgba(59,130,246,0.3)] border-blue-500/30">Protocolo de Inspección</Badge>
                  <h3 className="text-3xl font-black tracking-tight text-white leading-tight">Simulador Oficial de Inspección</h3>
                  <p className="text-zinc-400 text-sm max-w-lg leading-relaxed font-medium">
                    Ejecute una simulación en tiempo real del motor de recolección de datos y certifique que toda la información que extraería un Inspector de Trabajo cumple rigurosamente con el RD 8/2019.
                  </p>
                  <button 
                    onClick={onExportInspection}
                    className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
                  >
                    <MagnifyingGlass weight="bold" className="w-5 h-5" />
                    Ejecutar Simulación Ahora
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="prose prose-invert max-w-none bg-[#111114] p-8 rounded-[24px] border border-white/[0.04]">
              <h2 className="text-xl font-bold text-zinc-100 mb-4">Política de Privacidad - Tempos HR</h2>
              <div className="text-sm text-zinc-400 space-y-4">
                <p><strong>1. Responsable:</strong> Su Empresa (vía Tempos HR).</p>
                <p><strong>2. Finalidad:</strong> Control de jornada laboral obligatoria según Art. 34.9 ET.</p>
                <p><strong>3. Base Legal:</strong> Obligación legal del empresario según el Estatuto de los Trabajadores.</p>
                <p><strong>4. Datos Tratados:</strong> Nombre, email, registros de entrada/salida y geolocalización (si se ha activado específicamente).</p>
                <p><strong>5. Conservación:</strong> Los datos se conservarán durante 4 años.</p>
                <p><strong>6. Derechos:</strong> Puede solicitar el acceso, rectificación o supresión de sus datos en cualquier momento enviando un email a su departamento de RRHH.</p>
              </div>
            </div>
          )}

          {activeSection === 'subprocessors' && (
            <div className="bg-[#111114] rounded-[24px] border border-white/[0.04] overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 border-b border-white/[0.04]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Proveedor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Actividad</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {subprocessors.map(sub => (
                    <tr key={sub.name}>
                      <td className="px-6 py-4 font-bold text-zinc-200">{sub.name}</td>
                      <td className="px-6 py-4 text-zinc-400">{sub.activity}</td>
                      <td className="px-6 py-4">
                        <Badge color="zinc">{sub.location}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
