import React from 'react';
import { 
  Search, 
  Download, 
  Filter, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronRight
} from 'lucide-react';
import ModernTable from './ModernTable';
import { cn } from '@/lib/utils';

export default function AttendanceTab({ 
  registros, 
  filters, 
  setFilters, 
  onExport, 
  employees, 
  workCenters 
}) {
  const columns = [
    { 
      header: 'Empleado', 
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white">{row.userName || 'Sistema'}</span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">{row.userId?.slice(0, 8)}...</span>
        </div>
      )
    },
    { 
      header: 'Fecha', 
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium">{new Date(row.date).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      header: 'Entrada / Salida', 
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 px-2 py-1 rounded-lg">
            <span className="text-emerald-400 font-mono font-bold">{row.startTime || '--:--'}</span>
          </div>
          <span className="text-zinc-600">→</span>
          <div className="bg-red-500/10 px-2 py-1 rounded-lg">
            <span className="text-red-400 font-mono font-bold">{row.endTime || '--:--'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Total Horas', 
      cell: (row) => (
        <span className="font-mono text-blue-400 font-bold bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10">
          {row.hoursWorked ? `${row.hoursWorked}h` : 'En curso'}
        </span>
      )
    },
    { 
      header: 'Sede', 
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-zinc-500">
          <MapPin className="w-3 h-3" />
          <span className="text-xs">{row.workCenterName || 'Principal'}</span>
        </div>
      )
    },
    { 
      header: 'Estado', 
      cell: (row) => (
        <span className={cn(
          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border",
          row.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
          row.status === 'disputed' ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
          "bg-zinc-500/10 text-zinc-500 border-white/5"
        )}>
          {row.status === 'confirmed' ? 'Confirmado' : row.status === 'disputed' ? 'En Disputa' : 'Borrador'}
        </span>
      )
    }
  ];

  const handleApply = () => {
    // onApplyFilters is passed from DashboardPage
    setFilters(filters);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Filters Header */}
      <section className="bg-[#111114] border border-white/5 rounded-[2.5rem] p-6 lg:p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] pl-1">Empleado</label>
            <select 
              value={filters.employeeId || ''}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all cursor-pointer text-zinc-300"
            >
              <option value="">Todos los empleados</option>
              {employees.map(emp => (
                <option key={emp.uid || emp.id} value={emp.uid || emp.id}>{emp.displayName || emp.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] pl-1">Desde</label>
            <input 
              type="date" 
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-mono text-zinc-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] pl-1">Hasta</label>
            <input 
              type="date" 
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all font-mono text-zinc-300"
            />
          </div>

          <div className="flex items-end gap-3">
            <button 
              onClick={handleApply}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={onExport}
              className="p-4 rounded-2xl bg-white/[0.03] text-zinc-400 hover:text-white border border-white/5 hover:bg-white/[0.05] transition-all active:scale-95"
              title="Exportar Reporte"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-[#111114]/50 rounded-[2.5rem] border border-white/5 p-1 overflow-hidden shadow-inner font-inter">
        <ModernTable 
          columns={columns} 
          data={registros} 
          emptyMessage="No hay registros de jornada que coincidan con los filtros"
          onRowClick={(row) => onEdit?.(row)}
          actions={(row) => (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit?.(row); }}
              className="p-2 text-zinc-500 hover:text-blue-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        />
      </section>
    </div>
  );
}
