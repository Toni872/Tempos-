import React from 'react';
import { 
  DownloadSimple, 
  ClockClockwise, 
  ShieldCheck, 
  FunnelSimple, 
  Download,
  FileCsv,
  FileText,
  Clock,
  User,
  Pulse,
  Fingerprint,
  MapPin,
  Certificate,
  ArrowSquareOut,
  XCircle,
  FilePdf,
  TrayArrowDown,
  MagnifyingGlass
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import MapaAuditoria from './MapaAuditoria';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsTab({ 
  auditLogs = [], 
  onExportAudit, 
  onExportInspection, 
  onResetFilters,
  registros = [],
  workCenters = [],
  employees = []
}) {
  const columns = [
    { 
      header: 'Estampa Temporal', 
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-white/20" />
          <span className="font-mono text-[11px] font-black text-white/60 tracking-tighter italic">
            {new Date(row.createdAt).toLocaleString('es-ES')}
          </span>
        </div>
      )
    },
    { 
      header: 'Operador', 
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
            <User size={14} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-[10px] uppercase truncate tracking-tight">{row.userEmail || 'SISTEMA'}</div>
            <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{row.userId?.slice(-8) || 'AUTO-DAEMON'}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Evento de Seguridad', 
      cell: (row) => {
        const action = row.action?.toUpperCase() || 'UNKNOWN';
        const isDelete = action.includes('DELETE') || action.includes('REJECT');
        const isCreate = action.includes('CREATE') || action.includes('APPROVE');
        
        return (
          <Badge color={isDelete ? 'rose' : isCreate ? 'emerald' : 'blue'}>
            <div className="flex items-center gap-2">
              <Fingerprint size={14} weight="fill" />
              <span className="font-black tracking-[0.1em]">{action}</span>
            </div>
          </Badge>
        )
      }
    },
    { 
      header: 'Trazabilidad IP', 
      cell: (row) => (
        <div className="flex items-center gap-2 font-mono text-[10px] font-black text-white/20 tracking-widest italic">
          <Pulse size={12} />
          {row.ipAddress || '127.0.0.1'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ShieldCheck}
        title="Auditoría y Cumplimiento"
        subtitle="Centro de certificación temporal y trazabilidad legal de operaciones de Tempos."
      />

      {/* CERTIFIED EXPORTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ExportCard 
          title="Registro de Inspección"
          subtitle="Cumplimiento Art. 34.9 ET"
          description="Certificado oficial de jornada consolidada con firmas digitales y trazabilidad de sedes para inspecciones de trabajo."
          icon={Certificate}
          onClick={() => onExportInspection?.('pdf')}
          color="blue"
          badge="VALIDADO"
        />
        <ExportCard 
          title="Log de Actividad RBAC"
          subtitle="Auditoría de Seguridad"
          description="Exportación técnica de todas las acciones administrativas realizadas en el ecosistema bajo el protocolo de seguridad de Tempos."
          icon={Fingerprint}
          onClick={() => onExportAudit?.('csv')}
          color="indigo"
          badge="INMUTABLE"
        />
      </div>

      {/* GEOFencing Section */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
             <MapPin size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Vigilancia Geográfica</h3>
            <p className="text-white font-black italic uppercase tracking-tighter">Fichajes en Mapa de Calor</p>
          </div>
        </div>
        <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-4 lg:p-6 shadow-2xl overflow-hidden relative group">
           <MapaAuditoria fichas={registros} workCenters={workCenters} employees={employees} />
        </div>
      </section>

      {/* AUDIT LOG TABLE */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 px-2">
          <div>
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">Caja Negra de Operaciones</h3>
            <p className="text-white font-black italic uppercase tracking-tighter text-xl">Registro de Auditoría Técnica</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={onResetFilters}
               className="px-6 py-3 text-[10px] font-black text-white/20 hover:text-white uppercase tracking-widest transition-all"
             >
               Limpiar Filtros
             </button>
             <button className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all group">
               <FunnelSimple className="w-4 h-4 transition-transform group-hover:rotate-12" weight="fill" />
               Filtrar Trazas
             </button>
          </div>
        </div>

        <div className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/5">
                  {columns.map((col, i) => (
                    <th key={i} className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                      {col.header}
                    </th>
                  ))}
                  <th className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLogs.length ? auditLogs.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-white/[0.03] transition-all group cursor-default">
                    {columns.map((col, i) => (
                      <td key={i} className="px-10 py-5">
                        {col.cell(row)}
                      </td>
                    ))}
                    <td className="px-10 py-5 text-right">
                       <button className="p-3 rounded-2xl bg-white/[0.03] text-white/20 hover:text-white transition-all border border-transparent hover:border-white/10">
                          <MagnifyingGlass size={18} weight="bold" />
                       </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-10">
                          <Activity size={64} weight="duotone" />
                          <p className="text-xs font-black uppercase tracking-[0.4em]">Sin eventos registrados</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExportCard({ title, subtitle, description, icon: Icon, onClick, color, badge }) {
  const themes = {
    blue: "from-blue-600 to-indigo-700 shadow-blue-600/20",
    indigo: "from-purple-600 to-indigo-800 shadow-indigo-600/20"
  };

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-white/10 transition-all shadow-2xl relative overflow-hidden">
      <div className="absolute top-8 right-8">
         <Badge color={color}>{badge}</Badge>
      </div>
      
      <div>
        <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center bg-gradient-to-br text-white shadow-2xl mb-8 group-hover:scale-110 transition-transform", themes[color])}>
          <Icon size={40} weight="fill" />
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">{subtitle}</h4>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
          </div>
          <p className="text-sm text-white/40 font-medium leading-loose pr-6 italic">{description}</p>
        </div>
      </div>

      <div className="pt-10">
        <button 
          onClick={onClick}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-white/[0.03] border border-white/5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all group/btn shadow-xl"
        >
          <TrayArrowDown size={18} weight="bold" className="group-hover/btn:translate-y-0.5 transition-transform" />
          DESCARGAR CERTIFICADO
        </button>
      </div>
    </div>
  );
}
