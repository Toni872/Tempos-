import React, { useState } from 'react';
import { 
  CurrencyCircleDollar, 
  FileArrowDown, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  FilePdf,
  LockKey,
  SealCheck,
  ArrowRight
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function NominasTab({ employees = [], payrolls = [], onUpload }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  const getPayrollStatus = (employeeId, monthIndex) => {
    const monthName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][monthIndex];
    return payrolls.find(p => p.employeeId === employeeId && p.month === monthName && p.year === currentYear);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <SectionHeader 
        icon={CurrencyCircleDollar}
        title="Libro de Salarios Digital"
        subtitle="Consola de liquidación mensual, distribución de devengos y auditoría de retenciones."
        actionLabel="CARGA MASIVA (ZIP/PDF)"
        actionIcon={FileArrowDown}
        onAction={() => {}}
      />

      <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        {/* YEAR SELECTOR BAR */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <Calendar size={20} weight="fill" />
             </div>
             <div>
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Ejercicio Fiscal</h3>
               <p className="text-white font-black italic uppercase tracking-tighter">Periodo de Devengo</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6 bg-black/40 border border-white/10 rounded-[2rem] p-1.5 shadow-inner">
            <button 
              onClick={() => setCurrentYear(y => y - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/20 hover:text-white transition-all group"
            >
              <CaretLeft size={20} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <span className="text-lg font-mono font-black text-white px-4 tracking-tighter italic">{currentYear}</span>
            <button 
              onClick={() => setCurrentYear(y => y + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/20 hover:text-white transition-all group"
            >
              <CaretRight size={20} weight="bold" className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="sticky left-0 z-20 bg-[#0d0d0f] px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] border-r border-white/5 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">Estructura Escuadrón</th>
                {months.map(m => (
                  <th key={m} className="px-6 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center border-white/5 min-w-[100px] italic">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map((emp, empIdx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: empIdx * 0.05 }}
                  key={emp.id} 
                  className="hover:bg-white/[0.02] transition-all group"
                >
                  <td className="sticky left-0 z-10 bg-[#0d0d0f] px-10 py-5 border-r border-white/5 group-hover:bg-[#111114] transition-colors shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-600/5">
                        {emp.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-white text-xs tracking-tight uppercase italic truncate max-w-[150px]">{emp.displayName || emp.email}</div>
                        <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest truncate">REF: {emp.id?.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  {months.map((m, idx) => {
                    const payroll = getPayrollStatus(emp.id, idx);
                    return (
                      <td key={m} className="px-4 py-5 text-center">
                        <button 
                          onClick={() => onUpload(emp, m, currentYear)}
                          className={cn(
                            "w-12 h-12 rounded-[1.25rem] mx-auto flex items-center justify-center transition-all duration-500 border relative group/seal",
                            payroll 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-xl shadow-emerald-500/10 scale-105" 
                              : "bg-white/[0.02] border-white/5 text-white/10 hover:border-blue-500/30 hover:text-blue-500 hover:bg-blue-500/10"
                          )}
                        >
                          {payroll ? (
                            <SealCheck size={24} weight="fill" className="animate-in zoom-in duration-500" />
                          ) : (
                            <FileArrowDown size={22} weight="duotone" />
                          )}
                          
                          {/* TOOLTIP PREVIEW */}
                          {payroll && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/seal:opacity-100 transition-all pointer-events-none scale-95 group-hover/seal:scale-100">
                               <div className="bg-[#111114] border border-white/10 rounded-xl p-3 shadow-2xl whitespace-nowrap">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase italic">
                                     <ShieldCheck size={12} className="text-emerald-500" />
                                     Legajo Verificado
                                  </div>
                               </div>
                               <div className="w-2 h-2 bg-[#111114] border-r border-b border-white/10 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45" />
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* SECURITY FOOTER */}
      <div className="flex flex-col sm:flex-row items-center gap-8 px-10 py-6 border border-white/5 bg-white/[0.01] rounded-[2rem] w-full xl:w-fit animate-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center gap-4">
           <LockKey size={24} weight="fill" className="text-white/10" />
           <div className="h-8 w-px bg-white/5 hidden sm:block" />
        </div>
        
        <div className="flex items-center gap-3 group">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <SealCheck size={14} className="text-emerald-500" weight="fill"/>
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Nómina Liquidada y Encriptada (SHA-256)</span>
        </div>
        
        <div className="flex items-center gap-3 group">
          <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileArrowDown size={14} className="text-white/20" weight="fill"/>
          </div>
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Pendiente de Certificación Temporal</span>
        </div>
      </div>
    </div>
  );
}
