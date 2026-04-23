import React from 'react';
import { Clock, Calendar, LayoutGrid, Plus, Users, Settings2, Trash2, Edit3 } from 'lucide-react';
import SchedulingGrid from './SchedulingGrid';

export default function HorariosTab({ employees, schedules, assignments, onAssign, onAddTemplate, onEditTemplate, onDeleteTemplate, isAdmin, profile }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#111114]/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Gestión de Horarios</h2>
          </div>
          <p className="text-zinc-500 font-medium max-w-md">
            Planifica turnos, asigna jornadas y define patrones de trabajo para tu equipo.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={onAddTemplate}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] uppercase tracking-[0.2em] px-8 py-4 rounded-[1.5rem] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus className="w-4 h-4" />
            Nueva Plantilla de Horario
          </button>
        )}
      </div>

      {/* Main Content Areas */}
      <div className="space-y-12">
        {/* Scheduling Grid Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-zinc-600" />
            <h3 className="text-xl font-bold text-white">Planificación de Turnos</h3>
          </div>
          
          {isAdmin ? (
            <div className="bg-[#0d0d0f] border border-white/5 rounded-[3rem] p-2 shadow-2xl relative group">
              <div className="absolute -inset-1 bg-blue-600/5 rounded-[3rem] blur opacity-25" />
              <SchedulingGrid 
                employees={employees}
                schedules={schedules}
                assignments={assignments}
                onAssign={onAssign}
              />
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-[#111114] border border-white/5 p-10 rounded-[2.5rem] text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Tu Horario Asignado</h3>
                <p className="text-zinc-500 text-sm mb-8">Consulta tus turnos y patrones de jornada para esta semana.</p>
                
                <div className="space-y-3 text-left">
                  {assignments.filter(a => a.userId === profile?.uid || a.userId === profile?.id).length > 0 ? (
                    assignments.filter(a => a.userId === profile?.uid || a.userId === profile?.id).map(a => (
                      <div key={a.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-blue-400">{a.schedule?.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full">Activo</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                          <Clock className="w-3 h-3" />
                          {a.schedule?.startTime} - {a.schedule?.endTime}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 border border-dashed border-white/10 rounded-2xl text-zinc-600 text-center italic">
                      No tienes turnos asignados por el momento.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Templates Section - Admin Only */}
        {isAdmin && (
          <section className="animate-in fade-in duration-1000">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-zinc-600" />
                <h3 className="text-xl font-bold text-white">Plantillas Disponibles</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {schedules.map(sch => (
                <div 
                  key={sch.id} 
                  className="group bg-[#111114] border border-white/5 p-6 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden shadow-xl"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button 
                      onClick={() => onEditTemplate(sch)}
                      className="p-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteTemplate(sch)}
                      className="p-2 rounded-xl bg-red-500/10 text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{sch.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Jornada Estándar</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Horario</span>
                      <span className="text-sm font-mono font-black text-blue-400">{sch.startTime} - {sch.endTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 flex-wrap">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, idx) => {
                      const isActive = sch.daysOfWeek.includes(idx + 1);
                      return (
                        <div 
                          key={idx} 
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                            isActive 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                              : 'bg-white/5 text-zinc-600'
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {schedules.length === 0 && (
                <div className="col-span-full py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] text-center flex flex-col items-center justify-center">
                   <Clock className="w-8 h-8 text-zinc-700 mb-4" />
                   <p className="text-zinc-500 font-medium">No se han definido plantillas de horarios aún.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
