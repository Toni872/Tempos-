import React, { useState } from 'react';
import { 
  CurrencyCircleDollar, 
  FileArrowDown, 
  CheckCircle, 
  Clock, 
  User,
  Calendar,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function NominasTab({ employees = [], payrolls = [], onUpload }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getPayrollStatus = (employeeId, monthIndex) => {
    const month = months[monthIndex];
    return payrolls.find(p => p.employeeId === employeeId && p.month === month && p.year === currentYear);
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        icon={CurrencyCircleDollar}
        title="Gestión de Nóminas y Devengos"
        subtitle="Distribución mensual de recibos de salarios, justificantes encriptados y retenciones."
        actionLabel="Carga Masiva (ZIP/PDF)"
        actionIcon={FileArrowDown}
        onAction={() => {}}
      />

      <Card>
        <CardBody className="p-0">
          <div className="flex items-center justify-between p-6 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
               <Calendar className="w-5 h-5 text-blue-500" weight="duotone" />
               <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">Periodo de Devengo</span>
            </div>
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1">
              <button 
                onClick={() => setCurrentYear(y => y - 1)}
                className="p-1.5 hover:bg-white/[0.04] rounded-lg text-zinc-500 hover:text-white transition-all"
              >
                <CaretLeft weight="bold" />
              </button>
              <span className="text-sm font-black text-white px-4">{currentYear}</span>
              <button 
                onClick={() => setCurrentYear(y => y + 1)}
                className="p-1.5 hover:bg-white/[0.04] rounded-lg text-zinc-500 hover:text-white transition-all"
              >
                <CaretRight weight="bold" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[#111114] px-6 py-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-r border-white/[0.04]">Empleado</th>
                  {months.map(m => (
                    <th key={m} className="px-4 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center border-b border-white/[0.04] min-w-[80px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="sticky left-0 z-10 bg-[#111114] px-6 py-4 border-r border-white/[0.04] group-hover:bg-[#16161a] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-black">
                          {emp.displayName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white truncate max-w-[140px]">{emp.displayName || emp.email}</span>
                      </div>
                    </td>
                    {months.map((m, idx) => {
                      const payroll = getPayrollStatus(emp.id, idx);
                      return (
                        <td key={m} className="px-2 py-4 text-center">
                          <button 
                            onClick={() => onUpload(emp, m, currentYear)}
                            className={cn(
                              "w-10 h-10 rounded-xl mx-auto flex items-center justify-center transition-all duration-300 border",
                              payroll 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:scale-110 shadow-lg shadow-emerald-500/5" 
                                : "bg-white/[0.02] border-white/[0.04] text-zinc-700 hover:border-blue-500/30 hover:text-blue-500"
                            )}
                          >
                            {payroll ? <CheckCircle className="w-5 h-5" weight="fill" /> : <FileArrowDown className="w-5 h-5" weight="duotone" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      
      <div className="flex items-center gap-6 px-4 py-2 border border-white/[0.04] bg-white/[0.01] rounded-2xl w-fit">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border-2 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-500" weight="fill"/></div>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nómina disponible y Encriptada</span>
        </div>
        <div className="w-px h-4 bg-white/[0.06]" />
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-white/[0.04] border-2 border-white/[0.08] flex items-center justify-center"><FileArrowDown className="w-2.5 h-2.5 text-zinc-500" weight="fill"/></div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pendiente de subir</span>
        </div>
      </div>
    </div>
  );
}
