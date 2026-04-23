import React from 'react';
import { 
  History, 
  ShieldCheck, 
  Filter, 
  Download,
  AlertOctagon,
  FileText
} from 'lucide-react';
import ModernTable from './ModernTable';
import { cn } from '@/lib/utils';

export default function InformesTab({ 
  auditLogs, 
  onExportAudit, 
  onExportInspection, 
  onResetFilters 
}) {
  const columns = [
    { header: 'Fecha / Hora', cell: (row) => <span className="font-mono text-zinc-400">{new Date(row.createdAt).toLocaleString('es-ES')}</span> },
    { 
      header: 'Usuario', 
      cell: (row) => (
        <div className="font-bold text-white flex items-center gap-2">
           <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-zinc-400">
             {row.userEmail?.charAt(0).toUpperCase() || 'S'}
           </div>
           {row.userEmail || row.userId || 'Sistema'}
        </div>
      )
    },
    { 
      header: 'Acción', 
      cell: (row) => {
        const isDelete = row.action?.includes('DELETE') || row.action?.includes('ELIMINAR');
        const isCreate = row.action?.includes('CREATE') || row.action?.includes('CREAR');
        const isWarning = row.action?.includes('FAIL') || row.action?.includes('ERROR');
        
        return (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border",
            isDelete ? "bg-red-500/10 text-red-400 border-red-500/20" : 
            isCreate ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            isWarning ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-blue-500/10 text-blue-400 border-blue-500/20"
          )}>
            {row.action}
          </span>
        );
      }
    },
    { header: 'Detalles', accessor: 'details', className: 'max-w-xs truncate text-zinc-500 text-xs font-medium' },
    { header: 'IP Origen', cell: (row) => <span className="font-mono text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">{row.ipAddress || '127.0.0.1'}</span> }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(243,24,96,0.15)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Auditoría Legal y Exportación</h2>
            <p className="text-zinc-500 text-sm font-medium">Cumplimiento normativo, registro horario oficial y trazabilidad de acciones.</p>
          </div>
        </div>
      </div>

      {/* Export Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExportCard 
          title="Registro de Jornada Oficial"
          description="Genera el documento en formato PDF requerido por Inspección de Trabajo, consolidando las horas de todos los empleados en el periodo actual."
          icon={FileText}
          onClick={() => onExportInspection('pdf')}
          color="blue"
          badge="Obligatorio"
        />
        <ExportCard 
          title="Trazabilidad del Sistema (RBAC)"
          description="Descarga el historial inmutable de acciones realizadas en el panel (altas, bajas, modificaciones críticas) en formato procesable."
          icon={History}
          onClick={() => onExportAudit('csv')}
          color="rose"
          badge="Seguridad"
        />
      </section>

      {/* Audit Logs Table */}
      <section className="bg-[#111114] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4 text-zinc-400" />
             </div>
             <div>
               <h3 className="text-sm font-black text-white uppercase tracking-wider">Log de Auditoría</h3>
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Control de Trazabilidad Total</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={onResetFilters}
               className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
             >
               Restaurar Vista
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-colors shadow-sm">
               <Filter className="w-4 h-4" />
               Filtrar Trazas
             </button>
          </div>
        </div>

        <div className="p-6">
          <ModernTable 
            columns={columns} 
            data={auditLogs} 
            emptyMessage="El registro de auditoría está vacío o cargando..."
          />
        </div>
      </section>
    </div>
  );
}

function ExportCard({ title, description, icon: Icon, onClick, color, badge }) {
  const colors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]"
  };

  const btnColors = {
    blue: "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20",
    rose: "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
  };

  return (
    <div className={`bg-[#111114] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between group transition-all duration-300 ${colors[color]}`}>
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          {badge && (
             <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
               {badge}
             </span>
          )}
        </div>
        <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
        <p className="text-sm text-zinc-400 leading-relaxed font-medium">{description}</p>
      </div>
      <div className="pt-8">
        <button 
          onClick={onClick}
          className={`w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white py-4 rounded-xl transition-all shadow-lg ${btnColors[color]}`}
        >
          <Download className="w-4 h-4" />
          Generar y Descargar
        </button>
      </div>
    </div>
  );
}
