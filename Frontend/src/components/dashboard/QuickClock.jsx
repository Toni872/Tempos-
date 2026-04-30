import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Coffee, 
  Play, 
  Stop, 
  Timer,
  Fingerprint
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function QuickClock({ 
  clockedIn, 
  onClockToggle, 
  onBreakToggle,
  isOnBreak,
  elapsedTime = "00:00:00" 
}) {
  return (
    <div className="bg-[#111114] border border-white/[0.06] rounded-[2rem] p-6 shadow-2xl shadow-black/40 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-10 -top-10 w-32 h-32 blur-[60px] rounded-full transition-all duration-700 opacity-20",
        clockedIn && !isOnBreak ? "bg-emerald-500" : isOnBreak ? "bg-amber-500" : "bg-blue-500"
      )} />

      <div className="flex items-center gap-5 z-10">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
          clockedIn && !isOnBreak ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : 
          isOnBreak ? "bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" :
          "bg-blue-500/10 text-blue-500"
        )}>
          {isOnBreak ? <Coffee weight="duotone" size={32} /> : 
           clockedIn ? <Timer weight="duotone" size={32} className="animate-spin-slow" /> : 
           <Fingerprint weight="duotone" size={32} />}
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              clockedIn && !isOnBreak ? "bg-emerald-500 animate-pulse" : 
              isOnBreak ? "bg-amber-500 animate-pulse" : "bg-zinc-600"
            )} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              {isOnBreak ? "En Pausa" : clockedIn ? "Jornada Activa" : "Fuera de Jornada"}
            </span>
          </div>
          <div className="text-3xl font-mono font-black text-white tracking-tighter tabular-nums">
            {elapsedTime}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 z-10 w-full md:w-auto">
        {clockedIn && (
          <button
            onClick={onBreakToggle}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all",
              isOnBreak 
                ? "bg-amber-500 text-black hover:bg-amber-400 active:scale-95" 
                : "bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.06] hover:text-white active:scale-95"
            )}
          >
            {isOnBreak ? <Play weight="fill" /> : <Coffee weight="fill" />}
            {isOnBreak ? "Reanudar" : "Pausa"}
          </button>
        )}

        <button
          onClick={onClockToggle}
          className={cn(
            "flex-[2] md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg",
            clockedIn 
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95" 
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95"
          )}
        >
          {clockedIn ? <Stop weight="fill" /> : <Play weight="fill" />}
          {clockedIn ? "Finalizar Salida" : "Iniciar Entrada"}
        </button>
      </div>
    </div>
  );
}
