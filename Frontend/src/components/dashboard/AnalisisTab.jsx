import React from 'react';
import { 
  ChartLineUp, 
  TrendUp, 
  TrendDown, 
  Clock, 
  Calendar, 
  UsersThree,
  ArrowRight,
  DownloadSimple,
  ChartPieSlice
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function AnalisisTab() {
  return (
    <div className="space-y-8">
      <SectionHeader 
        icon={ChartLineUp}
        title="Panel Analítico"
        subtitle="Visualización de KPIs, tendencias de asistencia y costes de personal."
        actionLabel="Generar Reporte"
        actionIcon={DownloadSimple}
        onAction={() => {}}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tasa de Asistencia" value="98.2%" icon={TrendUp} color="emerald" trend={2.4} />
        <StatCard label="Horas Promedio" value="38.5h" icon={Clock} color="blue" trend={-0.8} />
        <StatCard label="Nuevas Altas" value="12" icon={UsersThree} color="indigo" trend={15} />
        <StatCard label="Incidencias" value="4" icon={TrendDown} color="rose" trend={-12} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[380px]">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <ChartLineUp className="w-5 h-5 text-blue-500" weight="duotone" />
               <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Asistencia Semanal</span>
            </div>
            <Badge color="blue">Tiempo Real</Badge>
          </CardHeader>
          <CardBody className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 opacity-30">
               <ChartLineUp className="w-16 h-16 mx-auto text-zinc-700" weight="duotone" />
               <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Renderizando Gráficos...</p>
            </div>
          </CardBody>
        </Card>

        <Card className="min-h-[380px]">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <ChartPieSlice className="w-5 h-5 text-emerald-500" weight="duotone" />
               <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Distribución por Sedes</span>
            </div>
            <button className="text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest flex items-center gap-1.5">
              Detalles <ArrowRight weight="bold" />
            </button>
          </CardHeader>
          <CardBody className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 opacity-30">
               <ChartPieSlice className="w-16 h-16 mx-auto text-zinc-700" weight="duotone" />
               <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Calculando Proporciones...</p>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <Card>
        <CardBody className="p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-blue-600/5 to-transparent">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 shrink-0">
             <Calendar className="w-8 h-8" weight="duotone" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-black text-white mb-1">Planificación Inteligente</h4>
            <p className="text-sm text-zinc-500 font-medium leading-relaxed">Analiza los picos de trabajo y optimiza tus plantillas de horarios para reducir horas extra no deseadas.</p>
          </div>
          <button className="px-8 py-3.5 bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5">
            Explorar IA
          </button>
        </CardBody>
      </Card>
    </div>
  );
}
