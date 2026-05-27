import React from 'react';
import { Check, Circle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'employees', label: 'Crear primer empleado', tab: 'Equipo' },
  { key: 'workCenters', label: 'Configurar centro de trabajo', tab: 'Sedes' },
  { key: 'schedules', label: 'Definir horarios', tab: 'Horarios' },
  { key: 'clock', label: 'Hacer un fichaje de prueba', tab: 'Inicio' },
];

export default function OnboardingChecklist({ steps = {}, onNavigate }) {
  const completedCount = Object.values(steps).filter(Boolean).length;
  const totalSteps = STEPS.length;
  const progress = (completedCount / totalSteps) * 100;
  const allDone = completedCount === totalSteps;

  if (allDone) return null;

  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Primeros pasos
        </h3>
        <span className="text-[10px] font-bold text-zinc-600">
          {completedCount}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {STEPS.map((step) => {
          const done = !!steps[step.key];
          return (
            <button
              key={step.key}
              onClick={() => onNavigate(step.tab)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200",
                done ? "opacity-60" : "hover:bg-white/[0.03]"
              )}
            >
              {/* Status icon */}
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                done
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "border border-zinc-600"
              )}>
                {done ? (
                  <Check className="w-3 h-3 text-emerald-400" weight="bold" />
                ) : (
                  <Circle className="w-2 h-2 text-zinc-600" weight="fill" />
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[12px] font-semibold transition-colors",
                done ? "text-zinc-500 line-through" : "text-zinc-300"
              )}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
