import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  MagnifyingGlass, 
  Funnel, 
  Eye,
  UserCircleGear,
  TrashSimple,
  ShieldCheck,
  IdentificationCard,
  User,
  DownloadSimple,
  CheckCircle,
  XCircle,
  UsersThree
} from '@phosphor-icons/react';
import ModernTable from './ModernTable';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
export default function EmployeeTab({ 
  employees = [], 
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee, 
  onViewExpediente 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = 
        (emp.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchRole = roleFilter === 'all' || emp.role === roleFilter;
      const matchStatus = statusFilter === 'all' || emp.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [employees, searchTerm, roleFilter, statusFilter]);

  const columns = useMemo(() => [
    { 
      accessorKey: 'name',
      header: 'Empleado', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-600/20 to-blue-400/5 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg shadow-inner group-hover:scale-105 transition-transform duration-300">
                {data.displayName?.charAt(0).toUpperCase() || data.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#111114]",
                data.isWorking ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-zinc-600"
              )} />
            </div>
            <div>
              <div className="font-bold text-zinc-100 group-hover:text-white transition-colors">{data.displayName || 'Invitado Tempos'}</div>
              <div className="text-[11px] text-zinc-500 font-semibold">{data.email}</div>
            </div>
          </div>
        );
      }
    },
    { 
      accessorKey: 'role',
      header: 'Rol / Autoridad', 
      cell: ({ row }) => {
        const data = row.original;
        const isInternalAdmin = data.role === 'admin';
        const isManager = data.role === 'manager';
        return (
          <Badge color={isInternalAdmin ? 'blue' : isManager ? 'purple' : 'zinc'}>
            {isInternalAdmin ? <ShieldCheck className="w-3.5 h-3.5" weight="duotone" /> : isManager ? <IdentificationCard className="w-3.5 h-3.5" weight="duotone" /> : <User className="w-3.5 h-3.5" weight="duotone" />}
            {isInternalAdmin ? 'Admin' : isManager ? 'Mánager' : 'Personal'}
          </Badge>
        );
      }
    },
    { 
      accessorKey: 'status',
      header: 'Estado', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex flex-col gap-0.5">
             <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  data.status === 'active' ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]"
                )} />
                <span className="text-[11px] font-extrabold text-zinc-300 uppercase tracking-tight">
                  {data.status === 'active' ? 'Vigente' : 'Suspendido'}
                </span>
             </div>
             <span className="text-[10px] text-zinc-600 font-semibold pl-3.5">Alta: {new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
        )
      }
    },
    { 
      accessorKey: 'hourlyRate',
      header: 'Tarifa (H)', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-1 text-sm font-black text-zinc-400 tabular-nums">
            <span>{data.hourlyRate || '0.00'}</span>
            <span className="text-[10px] font-extrabold text-zinc-600 italic tracking-tighter">€/h</span>
          </div>
        );
      }
    }
  ], []);

  const [sorting, setSorting] = useState([]);
  
  const table = useReactTable({
    data: filteredEmployees,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 8 }
    }
  });

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return;
    const headers = ['Nombre', 'Email', 'Rol', 'Estado', 'Sede', 'Tarifa Hora', 'Alta'];
    const rows = filteredEmployees.map(emp => [
      emp.displayName || 'Sin nombre',
      emp.email,
      emp.role,
      emp.status,
      emp.workCenterName || 'Principal',
      emp.hourlyRate || 0,
      new Date(emp.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `empleados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={UsersThree}
        title="Gestión de Equipo"
        subtitle="Administra los perfiles, roles y acceso de tu personal."
        actionLabel="Alta de Empleado"
        actionIcon={UserPlus}
        onAction={onAddEmployee}
      />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 px-1">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-96 group">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" weight="bold" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, email o cargo..." 
              className="w-full bg-[#111114] border border-white/[0.06] rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-zinc-600 font-semibold"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-5 py-3 rounded-2xl bg-[#111114] border transition-all flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider",
                showFilters ? "border-blue-500/30 text-blue-400" : "border-white/[0.06] text-zinc-500 hover:text-white"
              )}
            >
              <Funnel className="w-4 h-4" weight="duotone" />
              Filtros
              {(roleFilter !== 'all' || statusFilter !== 'all') && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}
            </button>
            <button 
              onClick={handleExportCSV}
              className="px-5 py-3 rounded-2xl bg-[#111114] border border-white/[0.06] text-zinc-500 hover:text-white hover:border-white/10 transition-all flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-wider"
              title="Exportar a CSV"
            >
              <DownloadSimple className="w-4 h-4" weight="duotone" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-7 bg-[#111114] border border-white/[0.06] rounded-[24px] grid grid-cols-1 sm:grid-cols-2 gap-8 shadow-inner">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Filtrar por Rol</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'admin', 'manager', 'employee'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all",
                        roleFilter === r ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06]"
                      )}
                    >
                      {r === 'all' ? 'Todos' : r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Vigencia Contractual</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'suspended'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all",
                        statusFilter === s ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06]"
                      )}
                    >
                      {s === 'all' ? 'Cualquiera' : s === 'active' ? 'Activos' : 'De Baja'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#0d0d0f] rounded-[24px] overflow-hidden border border-white/[0.04]">
        <div className="overflow-x-auto min-h-[300px]">
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
              {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={row.id} 
                  onClick={() => onViewExpediente(row.original)}
                  className="hover:bg-white/[0.02] cursor-pointer group transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onViewExpediente(row.original); }} className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Eye className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onEditEmployee(row.original); }} className="p-2 rounded-xl bg-white/[0.03] text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-all"><UserCircleGear className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteEmployee(row.original); }} className="p-2 rounded-xl bg-rose-500/5 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><TrashSimple className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              )) : (
                <tr><td colSpan={columns.length + 1} className="py-12 text-center text-zinc-500 text-sm">No se encontraron empleados.</td></tr>
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
