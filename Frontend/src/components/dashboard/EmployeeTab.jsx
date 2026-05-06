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
  UsersThree,
  Warning
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
      header: 'Identidad', 
      cell: ({ row }) => {
        const data = row.original;
        const name = data.displayName || data.name || data.email?.split('@')[0] || '?';
        const initial = name.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-4 py-2">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-600/10 group-hover:scale-105 transition-transform duration-300">
                {initial}
              </div>
              {data.isWorking && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-[3px] border-[#0a0a0c] shadow-[0_0_10px_#10b981]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-black text-white text-sm tracking-tight truncate group-hover:text-blue-400 transition-colors uppercase italic">{name}</div>
              <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest truncate">{data.email}</div>
            </div>
          </div>
        );
      }
    },
    { 
      accessorKey: 'role',
      header: 'Autoridad', 
      cell: ({ row }) => {
        const data = row.original;
        const isAdmin = data.role === 'admin';
        const isManager = data.role === 'manager';
        return (
          <Badge color={isAdmin ? 'emerald' : isManager ? 'blue' : 'zinc'}>
            <div className="flex items-center gap-2">
              {isAdmin ? <ShieldCheck weight="fill" /> : isManager ? <IdentificationCard weight="fill" /> : <User weight="fill" />}
              <span className="font-black tracking-[0.1em]">{isAdmin ? 'ADMIN' : isManager ? 'MÁNAGER' : 'PERSONAL'}</span>
            </div>
          </Badge>
        );
      }
    },
    { 
      accessorKey: 'status',
      header: 'Contrato', 
      cell: ({ row }) => {
        const data = row.original;
        const isActive = data.status === 'active';
        return (
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                )} />
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isActive ? "text-emerald-500" : "text-rose-500"
                )}>
                  {isActive ? 'VIGENTE' : 'BAJA'}
                </span>
             </div>
             <span className="text-[9px] text-white/20 font-bold uppercase pl-3.5 italic">Alta: {new Date(data.createdAt).toLocaleDateString()}</span>
          </div>
        )
      }
    },
    { 
      accessorKey: 'hourlyRate',
      header: 'Inversión / H', 
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-white/60">
            <span className="text-white font-black">{parseFloat(data.hourlyRate || 0).toFixed(2)}</span>
            <span className="text-[9px] font-black text-white/20 uppercase">€/h</span>
          </div>
        );
      }
    }
  ], []);

  const [sorting, setSorting] = useState([]);
  
  const table = useReactTable({
    data: filteredEmployees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return;
    const headers = ['Nombre', 'Email', 'Rol', 'Estado', 'Sede', 'Tarifa Hora', 'Alta'];
    const rows = filteredEmployees.map(emp => [
      emp.displayName || emp.name || 'Sin nombre',
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
    link.href = url;
    link.download = `tempos_nomina_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <SectionHeader 
        icon={UsersThree}
        title="Escuadrón de Trabajo"
        subtitle="Auditoría técnica de personal, roles y registros de seguridad."
        actionLabel="Alta de Empleado"
        actionIcon={UserPlus}
        onAction={onAddEmployee}
      />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-96 group">
            <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-500 transition-colors" weight="bold" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por identidad o contacto..." 
              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-xs focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-white/10 font-bold uppercase tracking-widest text-white shadow-inner"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]",
                showFilters ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/20" : "bg-white/[0.03] border-white/5 text-white/30 hover:text-white"
              )}
            >
              <Funnel weight="fill" />
              Filtros
              {(roleFilter !== 'all' || statusFilter !== 'all') && (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </button>
            <button 
              onClick={handleExportCSV}
              className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <DownloadSimple weight="fill" />
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
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] grid grid-cols-1 sm:grid-cols-2 gap-10 shadow-inner">
              <div className="space-y-5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Rango de Autoridad</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'admin', label: 'Admin' },
                    { id: 'manager', label: 'Mánager' },
                    { id: 'employee', label: 'Personal' }
                  ].map(r => (
                    <button 
                      key={r.id}
                      onClick={() => setRoleFilter(r.id)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        roleFilter === r.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-white/5 border-transparent text-white/30 hover:bg-white/10"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-5">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 ml-2">Vigencia Contractual</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all', label: 'Cualquiera' },
                    { id: 'active', label: 'Activos' },
                    { id: 'suspended', label: 'Bajas' }
                  ].map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={cn(
                        "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        statusFilter === s.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-white/5 border-transparent text-white/30 hover:bg-white/10"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/[0.01] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-white/[0.03] border-b border-white/5">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} onClick={header.column.getToggleSortingHandler()} className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] cursor-pointer hover:text-white transition-colors">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                  <th className="px-8 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right">Acciones</th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/5">
              {table.getRowModel().rows.length ? table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => onViewExpediente(row.original)}
                  className="hover:bg-white/[0.03] cursor-pointer group transition-all"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-8 py-5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ActionBtn onClick={(e) => { e.stopPropagation(); onViewExpediente(row.original); }} icon={Eye} color="blue" />
                      <ActionBtn onClick={(e) => { e.stopPropagation(); onEditEmployee(row.original); }} icon={UserCircleGear} color="zinc" />
                      <ActionBtn onClick={(e) => { e.stopPropagation(); onDeleteEmployee(row.original); }} icon={TrashSimple} color="rose" />
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={columns.length + 1} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Warning size={64} weight="duotone" />
                      <p className="text-xs font-black uppercase tracking-[0.4em]">Sin coincidencias encontradas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-10 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">
            Ficha {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
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

function ActionBtn({ onClick, icon: Icon, color }) {
  const colors = {
    blue: "text-blue-500 hover:bg-blue-500/10 hover:border-blue-500/30",
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
