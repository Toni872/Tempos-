import React from 'react';
import { 
  FileDown, 
  History, 
  ShieldCheck, 
  Filter, 
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import ModernTable from './ModernTable';
import MapaAuditoria from './MapaAuditoria';
import { cn } from '@/lib/utils';

export default function ReportsTab({ 
  auditLogs, 
  onExportAudit, 
  onExportInspection, 
  filters, 
  setFilters,
  onApplyFilters,
  onResetFilters,
  registros,
  workCenters,
  employees
}) {
  const columns = [
    { header: 'Fecha / Hora', cell: (row) => <span className="font-mono text-zinc-400">{new Date(row.createdAt).toLocaleString('es-ES')}</span> },
    { 
      header: 'Usuario', 
      cell: (row) => (
        <div className="font-bold text-white">{row.userEmail || row.userId || 'Sistema'}</div>
      )
    },
    { 
      header: 'Acción', 
      cell: (row) => (
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
          row.action?.includes('DELETE') ? "bg-red-500/10 text-red-400" : 
          row.action?.includes('CREATE') ? "bg-emerald-500/10 text-emerald-400" :
          "bg-blue-500/10 text-blue-400"
        )}>
          {row.action}
        </span>
      )
    },
    { header: 'Detalles', accessor: 'details', className: 'max-w-xs truncate text-zinc-500' },
    { header: 'IP', accessor: 'ipAddress', className: 'font-mono text-[11px] text-zinc-600' }
  ];

  return (
    <div className="space-y-10">
      {/* Quick Export Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ExportCard 
          title="Informe de Inspección de Trabajo"
          description="Genera el documento oficial PDF con el registro de jornada consolidado de todos los empleados para inspecciones."
          icon={ShieldCheck}
          onClick={() => onExportInspection('pdf')}
          color="blue"
        />
        <ExportCard 
          title="Registro Completo de Actividad"
          description="Exporta el log completo de auditoría (RBAC) con todas las acciones realizadas en el sistema por administradores."
          icon={History}
          onClick={() => onExportAudit('csv')}
          color="indigo"
        />
      </section>

      {/* Mapa de Geofichaje */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Mapa de Geofichaje</h3>
          <p className="text-sm text-zinc-500">Visualización geográfica de entradas y salidas con sedes autorizadas</p>
        </div>
        <MapaAuditoria fichas={registros} workCenters={workCenters} employees={employees} />
      </section>

      {/* Audit Logs Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Registro de Auditoría</h3>
            <p className="text-sm text-zinc-500">Trazabilidad completa de acciones y seguridad (S1+S2-01)</p>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
               onClick={onResetFilters}
               className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
             >
               Limpiar Filtros
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
               <Filter className="w-4 h-4" />
               Filtrar por Acción
             </button>
          </div>
        </div>

        <div className="bg-[#111114]/50 border border-white/5 rounded-[2rem] p-4 lg:p-8">
          <ModernTable 
            columns={columns} 
            data={auditLogs} 
            emptyMessage="No hay registros de auditoría disponibles."
          />
        </div>
      </section>
    </div>
  );
}

function ExportCard({ title, description, icon: Icon, onClick, color }) {
  const colors = {
    blue: "from-blue-600 to-blue-800 shadow-blue-600/20",
    indigo: "from-indigo-600 to-indigo-800 shadow-indigo-600/20"
  };

  return (
    <div className="bg-[#111114] border border-white/5 rounded-[2.5rem] p-8 space-y-6 group hover:border-white/10 transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-xl", colors[color])}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-2">
        <h4 className="text-lg font-bold text-white">{title}</h4>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
      <div className="pt-2">
        <button 
          onClick={onClick}
          className="flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors group/btn"
        >
          <Download className="w-4 h-4 transition-transform group-hover/btn:translate-y-0.5" />
          Descargar ahora
        </button>
      </div>
    </div>
  );
}
