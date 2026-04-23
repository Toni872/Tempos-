import React from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';

export default function AusenciasTab({ 
  pendingAbsences = [], 
  isAdmin = false, 
  onActOnAbsence, 
  onRequestAbsence 
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#111114] border border-white/5 p-6 rounded-[2rem] shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Gestión de Ausencias</h2>
            <p className="text-zinc-500 text-sm font-medium">Control de vacaciones, permisos y bajas médicas</p>
          </div>
        </div>
        <button 
          onClick={onRequestAbsence} 
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-orange-600/20 transition-all flex items-center gap-2"
        >
          <span>Nueva Solicitud</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white px-2">Solicitudes Pendientes</h3>
          {pendingAbsences.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-zinc-600 mb-3 opacity-50" />
              <p className="font-bold">Todo al día</p>
              <p className="text-sm">No hay solicitudes pendientes de revisión.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingAbsences.map((a) => (
                <div key={a.id} className="bg-[#111114] border border-white/5 rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{a.type || a.motivo || 'Ausencia'}</h4>
                      <p className="text-sm text-zinc-500 font-mono mt-0.5">
                        {new Date(a.startDate).toLocaleDateString('es-ES')} <span className="text-zinc-700">→</span> {new Date(a.endDate).toLocaleDateString('es-ES')}
                      </p>
                      {a.employee && (
                        <p className="text-xs text-blue-400 font-medium mt-1">
                          👤 {a.employee.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex sm:flex-col gap-2">
                      <button 
                        onClick={() => onActOnAbsence(a.id, 'approve')} 
                        className="px-5 py-2.5 bg-emerald-500/10 rounded-xl text-emerald-500 font-black text-xs hover:bg-emerald-500/20 transition-all border border-emerald-500/20 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Autorizar
                      </button>
                      <button 
                        onClick={() => onActOnAbsence(a.id, 'reject')} 
                        className="px-5 py-2.5 bg-rose-500/10 rounded-xl text-rose-500 font-black text-xs hover:bg-rose-500/20 transition-all border border-rose-500/20 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1">
           <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-6 lg:sticky top-6">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Resumen Anual</h3>
              
              <div className="space-y-6">
                 <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-zinc-400 font-bold">Días Disponibles</span>
                     <span className="text-white font-mono">22</span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                     <div className="w-[30%] h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full" />
                   </div>
                   <p className="text-[10px] text-zinc-500 mt-2 font-medium">8 días consumidos de 30 totales (Ref. España)</p>
                 </div>

                 <div className="pt-6 border-t border-white/5">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-zinc-400 font-bold">Bajas Médicas</span>
                     <span className="text-rose-400 font-mono">0</span>
                   </div>
                 </div>

                 <div className="pt-6 border-t border-white/5">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-zinc-400 font-bold">Asuntos Propios</span>
                     <span className="text-amber-400 font-mono">1</span>
                   </div>
                 </div>
              </div>

              <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                 <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                 <p className="text-[10px] text-orange-200 leading-relaxed font-medium">
                   Las solicitudes deben realizarse con al menos 15 días de antelación según convenio colectivo.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
