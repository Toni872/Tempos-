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
  Suitcase,
  User,
  Warning,
  ArrowRight,
  XCircle
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { 
  flexRender, 
  getCoreRowModel, 
  useReactTable, 
  getPaginationRowModel 
} from '@tanstack/react-table';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getClientSession } from '@/lib/api';

export default function AusenciasTab({ absences = [], onAdd, onEdit, onDelete, onActOnAbsence, profile = {} }) {
  const pendingCount = absences.filter(a => a.status?.toLowerCase() === 'pending').length;
  const approvedCount = absences.filter(a => a.status?.toLowerCase() === 'approved').length;
  const rejectedCount = absences.filter(a => a.status?.toLowerCase() === 'rejected').length;

  const columns = React.useMemo(() => [
    { 
      accessorKey: 'employee',
      header: 'Solicitante', 
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
               <div className="font-black text-white text-xs tracking-tight uppercase truncate italic">{name}</div>
               <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest truncate">ID: {data.userId?.slice(-8)}</div>
            </div>
          </div>
        )
      }
    },
    { 
      accessorKey: 'type',
      header: 'Categoría', 
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
            <div className="flex items-center gap-2">
              <Icon size={14} weight="fill" />
              <span className="font-black tracking-widest">{data.type?.toUpperCase()}</span>
            </div>
          </Badge>
        );
      }
    },
    {
      accessorKey: 'date',
      header: 'Ventana Temporal', 
      cell: ({ row }) => {
        const data = row.original;
        const days = Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        return (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-white uppercase italic">
                <span>{new Date(data.startDate).toLocaleDateString()}</span>
                <ArrowRight size={10} className="text-white/20" />
                <span>{new Date(data.endDate).toLocaleDateString()}</span>
              </div>
              <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mt-1">{days} días naturales</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'documentId',
      header: 'Justificante',
      cell: ({ row }) => {
        const data = row.original;
        if (!data.documentId) return <span className="text-[10px] text-white/10 font-bold uppercase tracking-widest">Sin adjunto</span>;
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              // Abrir documento en nueva pestaña
              const session = getClientSession();
              if (session?.token) {
                window.open(`${import.meta.env.VITE_API_URL}/api/v1/documents/${data.documentId}/view?token=${session.token}`, '_blank');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
          >
            <Suitcase size={14} weight="fill" />
            <span className="text-[9px] font-black uppercase tracking-widest">VER DOC</span>
          </button>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Resolución', 
      cell: ({ row }) => {
        const data = row.original;
        const status = data.status?.toLowerCase() || 'pending';
        const isApproved = status === 'approved' || status === 'aprobado';
        const isPending = status === 'pending' || status === 'pendiente';
        const isRejected = status === 'rejected' || status === 'rechazado';
        
        return (
          <div className="flex items-center gap-4">
            <Badge color={isApproved ? 'emerald' : isPending ? 'orange' : 'rose'}>
              <div className="flex items-center gap-2">
                {isApproved ? <CheckCircle size={14} weight="fill" /> : isPending ? <Clock size={14} weight="fill" className="animate-pulse" /> : <XCircle size={14} weight="fill" />}
                <span className="font-black tracking-[0.1em]">{status.toUpperCase()}</span>
              </div>
            </Badge>

            {isPending && profile?.role === 'admin' && (
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); onActOnAbsence?.(data.id, 'approve'); }} 
                  className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
                >
                  <CheckCircle size={14} weight="bold"/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onActOnAbsence?.(data.id, 'reject'); }} 
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10 border border-rose-500/20"
                >
                  <XCircle size={14} weight="bold"/>
                </button>
              </div>
            )}
          </div>
        );
      }
    }
  ], [profile, onActOnAbsence]);

  const table = useReactTable({
    data: absences,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <SectionHeader 
        icon={CalendarX}
        title="Gestión de Disponibilidad"
        subtitle="Auditoría de licencias, vacaciones y ausencias del escuadrón operativo."
        actionLabel="Nueva Solicitud"
        actionIcon={Plus}
        onAction={onAdd}
      />

      {/* Métricas Superiores Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard label="Pendientes" value={pendingCount} icon={Clock} color="orange" />
        <MetricCard label="Aprobadas" value={approvedCount} icon={CheckCircle} color="emerald" />
        <MetricCard label="Rechazadas" value={rejectedCount} icon={XCircle} color="rose" />
      </div>

      <div className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                {table.getHeaderGroups()[0].headers.map(header => (
                  <th key={header.id} className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.length ? table.getRowModel().rows.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.03 }}
                    key={row.id} 
                    className="hover:bg-white/[0.03] transition-all group"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-8 py-5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ActionBtn onClick={() => onEdit(row.original)} icon={PencilSimple} color="zinc" />
                        <ActionBtn onClick={() => onDelete(row.original)} icon={TrashSimple} color="rose" />
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={table.getHeaderGroups()[0].headers.length + 1} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-10">
                        <Warning size={64} weight="duotone" />
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Sin solicitudes registradas</p>
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
            Hoja {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
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

function MetricCard({ label, value, icon: Icon, color }) {
  const themes = {
    orange: "border-orange-500/20 bg-orange-500/5 text-orange-500 shadow-orange-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 shadow-emerald-500/5",
    rose: "border-rose-500/20 bg-rose-500/5 text-rose-500 shadow-rose-500/5"
  };

  return (
    <div className={cn(
      "border rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl transition-all hover:scale-[1.02]",
      themes[color]
    )}>
       <div>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{label}</p>
         <p className="text-4xl font-black text-white mt-2 italic tracking-tighter">{value}</p>
       </div>
       <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner")}>
          <Icon size={28} weight="duotone"/>
       </div>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, color }) {
  const colors = {
    rose: "text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30",
    zinc: "text-white/20 hover:bg-white/10 hover:border-white/20 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "p-3 rounded-2xl bg-white/[0.03] border border-transparent transition-all",
        colors[color]
      )}
    >
      <Icon size={18} weight="bold" />
    </button>
  );
}
