import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye,
  UserCog,
  UserMinus,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import ModernTable from './ModernTable';
import { cn } from '@/lib/utils';

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

  // Filtrado local para máxima velocidad
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

  const columns = [
    { 
      header: 'Empleado', 
      cell: (row) => (
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shadow-inner">
              {row.displayName?.charAt(0) || row.email?.charAt(0) || '?'}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0c]",
              row.isWorking ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-zinc-600"
            )} />
          </div>
          <div>
            <div className="font-bold text-zinc-100">{row.displayName || 'Invitado Tempos'}</div>
            <div className="text-[11px] text-zinc-500 font-medium">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Rol / Autoridad', 
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] w-fit",
            row.role === 'admin' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
            row.role === 'manager' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : 
            "bg-zinc-500/10 text-zinc-400 border border-white/5"
          )}>
            {row.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
            {row.role === 'admin' ? 'Administrador' : row.role === 'manager' ? 'Mánager' : 'Personal'}
          </div>
        </div>
      )
    },
    { 
      header: 'Control Horario', 
      cell: (row) => (
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full",
                row.status === 'active' ? "bg-emerald-500" : "bg-red-500"
              )} />
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tighter">
                {row.status === 'active' ? 'En Alta' : 'Suspendido'}
              </span>
           </div>
           <span className="text-[10px] text-zinc-600 font-medium">Desde: {new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      header: 'Tarifa (H)', 
      cell: (row) => (
        <div className="flex items-center gap-1 text-sm font-black text-zinc-400">
          <span>{row.hourlyRate || '0.00'}</span>
          <span className="text-[10px] font-bold text-zinc-600 italic">€/h</span>
        </div>
      )
    }
  ];

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

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Search */}
      <section className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o cargo..." 
              className="w-full bg-[#111114] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-600 font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-3.5 rounded-2xl bg-[#111114] border transition-all flex items-center gap-2 text-sm font-bold",
                showFilters ? "border-blue-500/50 text-blue-400" : "border-white/5 text-zinc-500 hover:text-white"
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(roleFilter !== 'all' || statusFilter !== 'all') && (
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              )}
            </button>
            <button 
              onClick={handleExportCSV}
              className="p-3.5 rounded-2xl bg-[#111114] border border-white/5 text-zinc-500 hover:text-white hover:border-white/10 transition-all flex items-center gap-2 text-sm font-bold"
              title="Exportar a CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1m8-12v12m0 0l-4-4m4 4l4-4" /></svg>
              Exportar
            </button>
          </div>
        </div>

        <button 
          onClick={onAddEmployee}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-[0.1em] px-8 py-4 rounded-2xl shadow-xl shadow-blue-600/10 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <UserPlus className="w-4 h-4" />
          Alta de Empleado
        </button>
      </section>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-[#111114] border border-white/5 rounded-[2rem] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Filtrar por Rol</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'admin', 'manager', 'employee'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                        roleFilter === r ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                      )}
                    >
                      {r === 'all' ? 'Todos' : r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Estado de Seguridad</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'active', 'suspended'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all",
                        statusFilter === s ? "bg-blue-600 text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                      )}
                    >
                      {s === 'all' ? 'Indiferente' : s === 'active' ? 'Vigente' : 'Suspendido'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main Table */}
      <section className="bg-[#111114] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <ModernTable 
          columns={columns} 
          data={filteredEmployees} 
          onRowClick={onViewExpediente}
          actions={(row) => (
            <div className="flex items-center gap-3 pr-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onViewExpediente(row); }}
                className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                title="Ver Expediente"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onEditEmployee(row); }}
                className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                title="Editar Perfil"
              >
                <UserCog className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteEmployee(row); }}
                className="p-2.5 rounded-xl bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Dar de Baja"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
        {filteredEmployees.length === 0 && (
           <div className="py-32 flex flex-col items-center justify-center text-center px-10">
              <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6">
                 <Search className="w-8 h-8 text-zinc-700" />
              </div>
              <h4 className="text-xl font-bold text-zinc-400 mb-2">Sin resultados</h4>
              <p className="text-sm text-zinc-600 max-w-xs">No hemos encontrado empleados que coincidan con los filtros aplicados en tu organización.</p>
           </div>
        )}
      </section>
    </div>
  );
}
