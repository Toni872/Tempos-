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
  Key
} from '@phosphor-icons/react';
import ModernTable from './ModernTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
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
      header: 'Empleado', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-500">
               <User weight="duotone" />
            </div>
            <span className="font-bold text-zinc-200">{data.userName || data.user?.displayName || 'Empleado'}</span>
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
          <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            {new Date(data.startTime).toLocaleDateString()}
          </div>
        )
      }
    },
    { 
      accessorKey: 'startTime',
      header: 'Horario', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">Entrada</span>
              <span className="text-[13px] font-mono font-bold text-emerald-400">
                {new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="h-6 w-px bg-white/[0.06]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">Salida</span>
              <span className="text-[13px] font-mono font-bold text-zinc-400">
                {data.endTime ? new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
          </div>
        )
      }
    },
    { 
      accessorKey: 'clockInMethod',
      header: 'Método', 
      cell: ({ row }) => {
        const data = row.original;
        const method = data.clockInMethod || 'password';
        
        const getIcon = (m) => {
          switch(m) {
            case 'biometric': return <Fingerprint className="w-4 h-4 text-blue-400" weight="duotone" />;
            case 'qr': return <QrCode className="w-4 h-4 text-purple-400" weight="duotone" />;
            case 'pin': return <SquaresFour className="w-4 h-4 text-amber-400" weight="duotone" />;
            default: return <Key className="w-4 h-4 text-zinc-500" weight="duotone" />;
          }
        }

        return (
          <div className="flex items-center gap-1.5">
             <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center" title={`Entrada: ${method}`}>
                {getIcon(method)}
             </div>
             {data.clockOutMethod && (
                <>
                  <span className="text-[10px] text-zinc-700">→</span>
                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center" title={`Salida: ${data.clockOutMethod}`}>
                    {getIcon(data.clockOutMethod)}
                  </div>
                </>
             )}
          </div>
        )
      }
    },
    { 
      accessorKey: 'workCenterName',
      header: 'Sede', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge color="zinc">
              <MapPin className="w-3.5 h-3.5" weight="duotone" />
              {data.workCenterName || 'Principal'}
            </Badge>
          </div>
        )
      }
    },
    { 
      accessorKey: 'duration',
      header: 'Total', 
      cell: ({ row }) => {
        const data = row.original;
        if (!data.endTime) return <Badge color="blue" dot>Activo</Badge>;
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        const diffMs = end - start;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return (
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-zinc-600" />
            <span className="text-sm font-black text-zinc-300 tabular-nums">
              {diffHrs}h {diffMins}m
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const data = row.original;
        const isDisputed = data.status === 'disputed';
        if (isDisputed) return <Badge color="orange" dot>En Revisión</Badge>;
        return <Badge color={data.status === 'confirmed' ? 'emerald' : 'blue'}>{data.status.toUpperCase()}</Badge>;
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
    <div className="space-y-6">
      <SectionHeader 
        icon={ClockCountdown}
        title="Registros de Jornada"
        subtitle="Auditoría en tiempo real de entradas, salidas y ubicaciones."
        actionLabel="Exportar Histórico"
        actionIcon={DownloadSimple}
        onAction={onExport}
      />

      <div className="flex flex-col md:flex-row gap-4 px-1">
        <div className="relative flex-1 group">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por empleado o sede..." 
            className="w-full bg-[#111114] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-semibold"
          />
        </div>
        <div className="flex gap-2">
           <div className="relative">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" weight="bold" />
             <input 
               type="date" 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="bg-[#111114] border border-white/[0.06] rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-semibold text-zinc-300"
             />
           </div>
           <button className="px-5 py-3.5 rounded-2xl bg-[#111114] border border-white/[0.06] text-zinc-500 hover:text-white transition-all">
             <Funnel className="w-4 h-4" weight="duotone" />
           </button>
        </div>
      </div>

      <div className="bg-[#0d0d0f] rounded-[24px] overflow-hidden border border-white/[0.04]">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-[#111114]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-white/[0.06]">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {table.getRowModel().rows.length ? table.getRowModel().rows.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    key={row.id} 
                    onClick={() => onViewAudit?.(row.original)}
                    className="hover:bg-white/[0.02] cursor-pointer group transition-colors"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onViewAudit?.(row.original); }} className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><FileSearch className="w-4 h-4" /></button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit?.(row.original); }} 
                          className={cn("p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white transition-all", row.original.status === 'disputed' && "opacity-50 pointer-events-none")}
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan={columns.length + 1} className="py-12 text-center text-zinc-500 text-sm">No se encontraron registros.</td></tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-white/[0.04] bg-[#111114] flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-semibold">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1} ({filteredRegistros.length} resultados)
          </span>
          <div className="flex gap-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-4 py-2 rounded-xl bg-white/[0.03] disabled:opacity-30 text-xs font-bold text-zinc-400 hover:text-white">Anterior</button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-4 py-2 rounded-xl bg-white/[0.03] disabled:opacity-30 text-xs font-bold text-zinc-400 hover:text-white">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
