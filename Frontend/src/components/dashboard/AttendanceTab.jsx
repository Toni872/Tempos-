import React, { useState, useMemo } from 'react';
import { 
  ClockCountdown, 
  Funnel, 
  MagnifyingGlass, 
  Calendar,
  DownloadSimple,
  User,
  MapPin,
  Clock,
  Timer,
  PencilSimple,
  MagnifyingGlass as FileSearch,
  Fingerprint,
  QrCode,
  SquaresFour,
  Key,
  Warning,
  ArrowRight
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttendanceTab({ 
  registros = [], 
  onExport, 
  filters, 
  setFilters, 
  employees = [], 
  workCenters = [], 
  profile = {},
  onEdit,
  onViewAudit
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredRegistros = useMemo(() => {
    return registros.filter(reg => {
      const matchSearch = 
        (reg.userName || reg.user?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reg.workCenterName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDate = !dateFilter || reg.startTime?.includes(dateFilter);

      return matchSearch && matchDate;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [registros, searchTerm, dateFilter]);

  const columns = useMemo(() => [
    { 
      accessorKey: 'employee',
      header: 'Identidad', 
      cell: ({ row }) => {
        const data = row.original;
        const name = data.userName || data.user?.displayName || 'Personal';
        const initial = name.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/5">
               {initial}
            </div>
            <div className="min-w-0">
               <div className="font-black text-white text-xs tracking-tight uppercase truncate">{name}</div>
               <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest truncate">ID: {data.id?.slice(-8)}</div>
            </div>
          </div>
        )
      }
    },
    { 
      accessorKey: 'date',
      header: 'Fecha', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">
              {new Date(data.startTime).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Año {new Date(data.startTime).getFullYear()}</span>
          </div>
        )
      }
    },
    { 
      accessorKey: 'startTime',
      header: 'Cronología', 
      cell: ({ row }) => {
        const data = row.original;
        const t = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
        return (
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mb-1">IN</span>
               <span className="text-[13px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">{t(data.startTime)}</span>
            </div>
            <ArrowRight size={14} className="text-white/10" weight="bold" />
            <div className="flex flex-col items-center">
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter mb-1">OUT</span>
               <span className={cn(
                 "text-[13px] font-mono font-black px-2 py-0.5 rounded-lg border",
                 data.endTime ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-white/10 bg-white/5 border-white/5"
               )}>{t(data.endTime)}</span>
            </div>
          </div>
        )
      }
    },
    { 
      accessorKey: 'clockInMethod',
      header: 'Evidencia', 
      cell: ({ row }) => {
        const data = row.original;
        const inM = data.clockInMethod || 'password';
        const outM = data.clockOutMethod;
        
        const getIcon = (m) => {
          switch(m) {
            case 'biometric': return <Fingerprint size={16} weight="fill" className="text-blue-400" />;
            case 'qr': return <QrCode size={16} weight="fill" className="text-purple-400" />;
            case 'pin': return <SquaresFour size={16} weight="fill" className="text-amber-400" />;
            default: return <Key size={16} weight="fill" className="text-white/20" />;
          }
        }

        return (
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-help" title={`Método Entrada: ${inM}`}>
                {getIcon(inM)}
             </div>
             {outM && (
                <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-help" title={`Método Salida: ${outM}`}>
                  {getIcon(outM)}
                </div>
             )}
          </div>
        )
      }
    },
    { 
      accessorKey: 'workCenterName',
      header: 'Terminal', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge color="zinc">
              <div className="flex items-center gap-2">
                 <MapPin size={12} weight="fill" className="text-white/40" />
                 <span className="font-black tracking-tight">{data.workCenterName?.toUpperCase() || 'PRINCIPAL'}</span>
              </div>
            </Badge>
          </div>
        )
      }
    },
    { 
      accessorKey: 'duration',
      header: 'Inversión', 
      cell: ({ row }) => {
        const data = row.original;
        if (!data.endTime) return (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">En Curso</span>
          </div>
        );
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        const diffMs = end - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return (
          <div className="flex items-center gap-2">
            <Timer className="text-white/20" size={18} weight="bold" />
            <span className="text-xs font-black text-white tabular-nums tracking-tighter">
              {diffHrs}H {diffMins}M
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Auditoría',
      cell: ({ row }) => {
        const data = row.original;
        const isDisputed = data.status === 'disputed';
        return (
          <Badge color={isDisputed ? 'orange' : data.status === 'confirmed' ? 'emerald' : 'blue'}>
            <span className="font-black tracking-[0.1em]">{isDisputed ? 'REVISIÓN' : data.status.toUpperCase()}</span>
          </Badge>
        );
      }
    }
  ], []);

  const [sorting, setSorting] = useState([]);
  
  const table = useReactTable({
    data: filteredRegistros,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 12 }
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        icon={ClockCountdown}
        title="Historial de Auditoría"
        subtitle="Registro técnico inmutable de jornadas laborales y geoposiciones."
        actionLabel="Generar Reporte PDF"
        actionIcon={DownloadSimple}
        onAction={onExport}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" weight="bold" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por empleado, ID o terminal..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/10 font-bold uppercase tracking-widest text-white shadow-inner"
          />
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" weight="bold" />
             <input 
               type="date" 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[11px] focus:outline-none focus:border-blue-500/40 transition-all font-black uppercase tracking-widest text-white/60 min-w-[200px]"
             />
           </div>
           <button className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-white transition-all">
             <Funnel size={18} weight="fill" />
           </button>
        </div>
      </div>

      <div className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto min-h-[450px]">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-white/[0.03] border-b border-white/5">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Detalles</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.length ? table.getRowModel().rows.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={row.id} 
                    onClick={() => onViewAudit?.(row.original)}
                    className="hover:bg-white/[0.03] cursor-pointer group transition-all"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-8 py-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionBtn onClick={(e) => { e.stopPropagation(); onViewAudit?.(row.original); }} icon={FileSearch} color="blue" />
                        <ActionBtn 
                          onClick={(e) => { e.stopPropagation(); onEdit?.(row.original); }} 
                          icon={PencilSimple} 
                          color="zinc" 
                          disabled={row.original.status === 'disputed'}
                        />
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-32 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-10">
                          <Warning size={64} weight="duotone" />
                          <p className="text-xs font-black uppercase tracking-[0.4em]">Sin registros auditados</p>
                       </div>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="px-10 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
            Hoja {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1} · {filteredRegistros.length} Eventos
          </span>
          <div className="flex gap-2">
             <button 
              onClick={() => table.previousPage()} 
              disabled={!table.getCanPreviousPage()} 
              className="px-6 py-3 rounded-xl bg-white/5 disabled:opacity-10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-transparent hover:border-white/10"
            >
              Anterior
            </button>
            <button 
              onClick={() => table.nextPage()} 
              disabled={!table.getCanNextPage()} 
              className="px-6 py-3 rounded-xl bg-white/5 disabled:opacity-10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-transparent hover:border-white/10"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, color, disabled }) {
  const colors = {
    blue: "text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30",
    zinc: "text-white/20 hover:bg-white/10 hover:border-white/20 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "p-3 rounded-2xl bg-white/[0.03] border border-transparent transition-all disabled:opacity-10",
        colors[color]
      )}
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}
