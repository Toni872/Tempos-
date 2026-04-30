import React, { useState } from 'react';
import { 
  ChartLineUp, 
  TrendUp, 
  TrendDown, 
  Clock, 
  Calendar, 
  UsersThree,
  ArrowRight,
  DownloadSimple,
  ChartPieSlice,
  MagicWand,
  Sparkle
} from '@phosphor-icons/react';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function AnalisisTab() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simular generación de PDF
    setTimeout(() => {
      setIsGenerating(false);
      alert('Reporte consolidado generado con éxito. Iniciando descarga...');
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        icon={ChartLineUp}
        title="Panel Analítico"
        subtitle="Visualización de KPIs, tendencias de asistencia y costes de personal."
        actionLabel={isGenerating ? "Procesando..." : "Generar Reporte"}
        actionIcon={DownloadSimple}
        onAction={handleGenerateReport}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tasa de Asistencia" value="98.2%" icon={TrendUp} color="emerald" trend={2.4} />
        <StatCard label="Horas Promedio" value="38.5h" icon={Clock} color="blue" trend={-0.8} />
        <StatCard label="Nuevas Altas" value="12" icon={UsersThree} color="indigo" trend={15} />
        <StatCard label="Incidencias" value="4" icon={TrendDown} color="rose" trend={-12} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[380px] bg-[#111114]">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <ChartLineUp className="w-5 h-5 text-blue-500" weight="duotone" />
               <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Asistencia Semanal</span>
            </div>
            <Badge color="blue">Tiempo Real</Badge>
          </CardHeader>
          <CardBody className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 opacity-40">
               <div className="flex justify-center gap-1 items-end h-16">
                 {[40, 70, 45, 90, 65, 30, 20].map((h, i) => (
                   <div key={i} className="w-2 bg-blue-500/40 rounded-full" style={{ height: `${h}%` }} />
                 ))}
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Datos consolidados de la última semana</p>
            </div>
          </CardBody>
        </Card>

        <Card className="min-h-[380px] bg-[#111114]">
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
            <div className="text-center space-y-4 opacity-40">
               <div className="w-24 h-24 rounded-full border-8 border-emerald-500/20 border-t-emerald-500 mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sede Central: 64% | Remoto: 36%</p>
            </div>
          </CardBody>
        </Card>
      </div>
      
      <Card className={cn("transition-all duration-500 overflow-hidden", showAI ? "ring-1 ring-blue-500/30" : "")}>
        <CardBody className="p-0">
          <div className="p-8 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-blue-600/5 to-transparent">
            <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 shrink-0 relative overflow-hidden group">
               <MagicWand className="w-8 h-8 relative z-10" weight="duotone" />
               <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-lg font-black text-white mb-1 flex items-center justify-center md:justify-start gap-2">
                Asistente de Inteligencia Predictiva
                <Sparkle className="w-4 h-4 text-blue-400 animate-pulse" weight="fill" />
              </h4>
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                Nuestra IA analiza patrones de absentismo y picos de carga para sugerir optimizaciones en tus turnos.
              </p>
            </div>
            <button 
              onClick={() => setShowAI(!showAI)}
              className="px-8 py-3.5 bg-white text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5"
            >
              {showAI ? 'Cerrar Análisis' : 'Explorar IA'}
            </button>
          </div>

          {showAI && (
            <div className="p-8 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Insight de Productividad</h5>
                    <p className="text-sm text-zinc-300">Se detecta un aumento del 14% en la puntualidad los martes tras el ajuste de horarios en la Sede Central.</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Recomendación Estratégica</h5>
                    <p className="text-sm text-zinc-300">Considera implementar un turno flexible de 15 min los viernes para reducir el estrés térmico de entrada.</p>
                 </div>
               </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
