import React from 'react';
import { 
  CalendarX, 
  Plus, 
  AirplaneTilt, 
  ThermometerHot, 
  WarningCircle, 
  CheckCircle,
  Clock,
  TrashSimple,
  PencilSimple,
  Suitcase
} from '@phosphor-icons/react';
import ModernTable from './ModernTable';
import SectionHeader from '@/components/ui/SectionHeader';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel 
} from '@tanstack/react-table';
import { motion } from 'framer-motion';

export default function AusenciasTab({ absences = [], onAdd, onEdit, onDelete, profile = {} }) {
  const pendingCount = absences.filter(a => a.status?.toLowerCase() === 'pending').length;
  const approvedCount = absences.filter(a => a.status?.toLowerCase() === 'approved').length;
  const rejectedCount = absences.filter(a => a.status?.toLowerCase() === 'rejected').length;
  const columns = React.useMemo(() => [
    { 
      accessorKey: 'employee',
      header: 'Empleado Solicitante', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
               {data.userName?.charAt(0) || 'U'}
            </div>
            <span className="font-bold text-zinc-200">{data.userName || data.user?.displayName || 'Empleado'}</span>
          </div>
        )
      }
    },
    { 
      accessorKey: 'type',
      header: 'Tipo de Ausencia', 
      cell: ({ row }) => {
        const data = row.original;
        const type = data.type?.toLowerCase();
        let color = 'zinc';
        let Icon = Suitcase;
        
        if (type?.includes('vaca')) { color = 'emerald'; Icon = AirplaneTilt; }
        else if (type?.includes('enfer')) { color = 'rose'; Icon = ThermometerHot; }
        else if (type?.includes('perso')) { color = 'blue'; Icon = User; }
        
        return (
          <Badge color={color}>
            <Icon className="w-3.5 h-3.5" weight="duotone" />
            {data.type}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'date',
      header: 'Periodo', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-300">
              {new Date(data.startDate).toLocaleDateString()} — {new Date(data.endDate).toLocaleDateString()}
            </div>
            <span className="text-[10px] text-zinc-600 font-extrabold uppercase tracking-tighter">
              {Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1} días naturales
            </span>
          </div>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Estado de Aprobación', 
      cell: ({ row }) => {
        const data = row.original;
        const status = data.status?.toLowerCase() || 'pending';
        const isApproved = status === 'approved' || status === 'aprobado';
        const isPending = status === 'pending' || status === 'pendiente';
        
        return (
          <div className="flex items-center gap-3">
            <Badge color={isApproved ? 'emerald' : isPending ? 'amber' : 'rose'} className="animate-in fade-in zoom-in">
              {isApproved ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : isPending ? <Clock className="w-3.5 h-3.5 animate-pulse" weight="fill" /> : <WarningCircle className="w-3.5 h-3.5" weight="fill" />}
              {status.toUpperCase()}
            </Badge>
            {isPending && profile?.role === 'admin' && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onEdit({...data, status: 'approved'}); }} className="p-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors" title="Aprobar"><CheckCircle className="w-3 h-3" weight="bold"/></button>
                <button onClick={(e) => { e.stopPropagation(); onEdit({...data, status: 'rejected'}); }} className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Rechazar"><WarningCircle className="w-3 h-3" weight="bold"/></button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [profile]);

  const table = useReactTable({
    data: absences,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } }
  });

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={CalendarX}
        title="Control de Ausencias"
        subtitle="Gestiona vacaciones, bajas médicas y permisos especiales."
        actionLabel="Registrar Ausencia"
        actionIcon={Plus}
        onAction={onAdd}
      />

      {/* Métricas Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111114] border border-amber-500/20 rounded-[20px] p-5 flex items-center justify-between shadow-[0_0_20px_rgba(245,158,11,0.05)]">
           <div><p className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest">Pendientes</p><p className="text-3xl font-black text-white mt-1">{pendingCount}</p></div>
           <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center"><Clock className="w-6 h-6 text-amber-500" weight="duotone"/></div>
        </div>
        <div className="bg-[#111114] border border-emerald-500/20 rounded-[20px] p-5 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)]">
           <div><p className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest">Aprobadas</p><p className="text-3xl font-black text-white mt-1">{approvedCount}</p></div>
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-emerald-500" weight="duotone"/></div>
        </div>
        <div className="bg-[#111114] border border-rose-500/20 rounded-[20px] p-5 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.05)]">
           <div><p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest">Rechazadas</p><p className="text-3xl font-black text-white mt-1">{rejectedCount}</p></div>
           <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center"><WarningCircle className="w-6 h-6 text-rose-500" weight="duotone"/></div>
        </div>
      </div>

      <div className="bg-[#0d0d0f] rounded-[24px] overflow-hidden border border-white/[0.04]">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead className="bg-[#111114]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-white/[0.06]">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {table.getRowModel().rows.length ? table.getRowModel().rows.map((row, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  key={row.id} 
                  className="hover:bg-white/[0.02] cursor-default group transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(row.original); }} className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white transition-all"><PencilSimple className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(row.original); }} className="p-2 rounded-xl bg-rose-500/5 text-rose-500/40 hover:text-rose-500 transition-all"><TrashSimple className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan={columns.length + 1} className="py-12 text-center text-zinc-500 text-sm">No hay solicitudes de ausencia registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="px-6 py-4 border-t border-white/[0.04] bg-[#111114] flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-semibold">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
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
