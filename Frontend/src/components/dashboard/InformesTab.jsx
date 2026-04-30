import React from 'react';
import { 
  ClipboardText, 
  FileCsv, 
  FilePdf, 
  Funnel, 
  DownloadSimple, 
  ArrowRight,
  ClockCounterClockwise,
  UsersThree,
  MapPin
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

import MapaAuditoria from './MapaAuditoria';

export default function InformesTab({ auditLogs, onExportAudit, onExportInspection, onResetFilters, registros, workCenters, employees }) {
  const reportTypes = [
    // ... reportTypes logic (keep as is or update icons/colors)
    { 
      id: 'asistencia', 
      title: 'Registro de Jornada', 
      desc: 'Histórico completo de entradas y salidas por empleado.',
      icon: ClockCounterClockwise,
      color: 'blue'
    },
    { 
      id: 'nominas', 
      title: 'Resumen de Costes', 
      desc: 'Desglose mensual de salarios y devengos por sede.',
      icon: FileCsv,
      color: 'emerald'
    },
    { 
      id: 'ausencias', 
      title: 'Informe de Absentismo', 
      desc: 'Días de baja, vacaciones y permisos disfrutados.',
      icon: ClipboardText,
      color: 'rose'
    },
    { 
      id: 'sedes', 
      title: 'Actividad por Sede', 
      desc: 'Distribución de personal y ocupación por centros.',
      icon: MapPin,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-8">
      <SectionHeader 
        icon={ClipboardText}
        title="Centro de Informes"
        subtitle="Genera y descarga reportes detallados para auditorías e inspecciones."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="group cursor-pointer">
            <CardBody className="p-8 flex items-start gap-6">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 border border-white/[0.04]",
                report.color === 'blue' && "bg-blue-600/10 text-blue-500",
                report.color === 'emerald' && "bg-emerald-600/10 text-emerald-500",
                report.color === 'rose' && "bg-rose-600/10 text-rose-500",
                report.color === 'amber' && "bg-amber-600/10 text-amber-500",
              )}>
                <report.icon weight="duotone" className="w-7 h-7" />
              </div>
              <div className="flex-1 space-y-2">
                <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{report.title}</h4>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">{report.desc}</p>
                <div className="pt-4 flex items-center gap-3">
                   <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all">
                      <FileCsv className="w-4 h-4 text-emerald-500" weight="fill" />
                      CSV
                   </button>
                   <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all">
                      <FilePdf className="w-4 h-4 text-rose-500" weight="fill" />
                      PDF
                   </button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="p-10 rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-[#111114] to-blue-900/10 relative overflow-hidden group shadow-[0_0_50px_rgba(37,99,235,0.05)]">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
         <div className="relative z-10 space-y-6 max-w-2xl">
            <Badge color="blue" dot className="shadow-[0_0_15px_rgba(59,130,246,0.3)]">Certificación Legal</Badge>
            <h3 className="text-3xl font-black text-white leading-tight">Generación de Certificados para Inspección de Trabajo</h3>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed">
              Descarga un archivo ZIP consolidado con todos los registros horarios firmados, auditorías de ubicación GPS y documentos laborales encriptados. Cumplimiento 100% garantizado con el RD 8/2019.
            </p>
            <button className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98]">
               Generar Pack Consolidado (PDF) <DownloadSimple weight="bold" className="w-5 h-5" />
            </button>
         </div>
      </div>
    </div>
  );
}
