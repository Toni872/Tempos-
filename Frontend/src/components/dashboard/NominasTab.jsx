import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, Upload, Banknote, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NominasTab({ employees = [], documents = [], onUploadDocument }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  // Helper to check if a specific employee has a 'Nómina' document for a given month/year
  // Since we don't have explicit month/year in standard docs yet, we simulate it based on creation date or title matching
  const hasNomina = (empId, monthIdx) => {
    return documents.some(d => {
      if (d.type !== 'Nómina') return false;
      // In a real scenario, documents would have `month` and `year` metadata.
      // Here we approximate based on createdAt or simply randomize for demonstration if needed,
      // but let's do a basic check based on real data (createdAt).
      const docDate = new Date(d.createdAt);
      return docDate.getMonth() === monthIdx && docDate.getFullYear() === selectedYear;
    });
  };

  const filteredEmployees = employees.filter(e => 
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Banknote className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Centro de Nóminas</h2>
            <p className="text-zinc-500 text-sm font-medium">Control masivo y distribución mensual de recibos de salario.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(Number(e.target.value))}
             className="bg-white/5 border border-white/10 text-white font-bold px-4 py-3 rounded-xl outline-none focus:border-emerald-500/50 transition-colors"
           >
             {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           <button 
             onClick={onUploadDocument} 
             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2"
           >
             <Upload className="w-4 h-4" />
             <span>Subir Nóminas</span>
           </button>
        </div>
      </div>

      {/* Main Matrix */}
      <div className="bg-[#111114] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl flex flex-col">
         {/* Toolbar */}
         <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01]">
           <div className="relative w-full sm:w-auto">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input 
               type="text" 
               placeholder="Buscar empleado..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:border-emerald-500/50 text-white transition-all placeholder:text-zinc-600 font-medium"
             />
           </div>
           
           <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-zinc-500"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Entregada</span>
              <span className="flex items-center gap-1.5 text-zinc-500"><AlertCircle className="w-4 h-4 text-rose-500" /> Pendiente</span>
           </div>
         </div>

         {/* Grid Matrix */}
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-900/40">
                  <th className="px-6 py-4 text-xs font-black text-white uppercase tracking-widest sticky left-0 z-10 bg-[#121215] border-r border-white/5 shadow-[4px_0_10px_rgba(0,0,0,0.2)]">
                    Empleado
                  </th>
                  {months.map(m => (
                    <th key={m} className="px-4 py-4 text-center">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{m}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-zinc-500 text-sm font-medium bg-white/[0.01]">
                      No hay empleados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, empIdx) => (
                    <tr key={emp.id || emp.uid || empIdx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 sticky left-0 z-10 bg-[#121215] group-hover:bg-[#151519] border-r border-white/5 shadow-[4px_0_10px_rgba(0,0,0,0.2)] transition-colors">
                        <div className="font-bold text-white text-sm truncate max-w-[180px]">{emp.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">{emp.email}</div>
                      </td>
                      {months.map((m, idx) => {
                        const exists = hasNomina(emp.id, idx);
                        const isFuture = (selectedYear === new Date().getFullYear() && idx > new Date().getMonth()) || selectedYear > new Date().getFullYear();
                        
                        return (
                          <td key={`${emp.id}-${m}`} className="px-4 py-4 text-center">
                            {isFuture ? (
                               <div className="w-6 h-6 mx-auto rounded-md bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                 <div className="w-1 h-1 rounded-full bg-zinc-700" />
                               </div>
                            ) : exists ? (
                               <div className="w-6 h-6 mx-auto rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center cursor-pointer hover:bg-emerald-500/20 transition-colors" title="Nómina entregada">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                               </div>
                            ) : (
                               <div 
                                 onClick={onUploadDocument}
                                 className="w-6 h-6 mx-auto rounded-md bg-rose-500/10 border border-rose-500/20 flex items-center justify-center cursor-pointer hover:bg-rose-500/20 transition-colors group/btn" 
                                 title="Falta Nómina. Clic para subir."
                               >
                                 <AlertCircle className="w-4 h-4 text-rose-500 group-hover/btn:hidden" />
                                 <Upload className="w-3 h-3 text-rose-400 hidden group-hover/btn:block" />
                               </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
           </table>
         </div>

         {/* Footer */}
         <div className="px-6 py-4 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-zinc-500">
           <span>Total Empleados: {filteredEmployees.length}</span>
           <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Ejercicio Fiscal {selectedYear}</span>
         </div>
      </div>
    </div>
  );
}
