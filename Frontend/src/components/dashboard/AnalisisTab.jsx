import React, { useState, useEffect } from 'react';
import { 
  ChartLineUp, 
  Clock, 
  UsersThree, 
  TrendUp, 
  TrendDown, 
  ChartPieSlice,
  MagicWand,
  Monitor,
  Warning,
  Sparkle,
  Cpu
} from '@phosphor-icons/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import Badge from '../ui/Badge';
import { getAiInsights } from '../../lib/api';

const dataWeekly = [
  { day: 'LUN', val: 45 },
  { day: 'MAR', val: 52 },
  { day: 'MIE', val: 48 },
  { day: 'JUE', val: 61 },
  { day: 'VIE', val: 55 },
  { day: 'SAB', val: 32 },
  { day: 'DOM', val: 28 },
];

const dataHours = [
  { sede: 'MADRID HQ', hrs: 840 },
  { sede: 'BARCELONA', hrs: 620 },
  { sede: 'VALENCIA', hrs: 410 },
  { sede: 'REMOTO', hrs: 1250 },
];

export default function AnalisisTab() {
  const [showAI, setShowAI] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (showAI && insights.length === 0) {
      fetchAI();
    }
  }, [showAI]);

  const fetchAI = async () => {
    setIsLoadingAI(true);
    try {
      const data = await getAiInsights();
      setInsights(data);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Business <span className="text-blue-500">Intelligence</span>
          </h2>
          <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
            Análisis avanzado de métricas de rendimiento y asistencia operativa
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">Sincronización en tiempo real</span>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticStat label="Puntualidad" value="98.2%" trend="+2.4%" color="emerald" icon={TrendUp} />
        <AnalyticStat label="Horas Promedio" value="38.5H" trend="-0.8%" color="blue" icon={Clock} />
        <AnalyticStat label="Carga Laboral" value="1.4K" trend="+12%" color="indigo" icon={UsersThree} />
        <AnalyticStat label="Incidencias" value="04" trend="-15%" color="rose" icon={TrendDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO DE ASISTENCIA */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-8 shadow-2xl overflow-hidden relative group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                <ChartLineUp size={20} weight="fill" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Asistencia</h3>
                <p className="text-white font-black italic uppercase tracking-tighter">Histórico Semanal</p>
              </div>
            </div>
            <Badge color="blue">DATOS EN VIVO</Badge>
          </div>
          
          {/* Fijamos altura para evitar error de ResponsiveContainer */}
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataWeekly}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: '900', color: '#fff'}}
                    itemStyle={{color: '#3b82f6'}}
                    cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* GRÁFICO DE DISTRIBUCIÓN */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-8 shadow-2xl overflow-hidden relative group">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <ChartPieSlice size={20} weight="fill" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Distribución</h3>
                <p className="text-white font-black italic uppercase tracking-tighter">Carga por Sede</p>
              </div>
            </div>
            <Badge color="emerald">AUDITORÍA ACTIVA</Badge>
          </div>
          
          {/* Fijamos altura para evitar error de ResponsiveContainer */}
          <div className="h-[300px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataHours} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="sede" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900}}
                    width={100}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}}
                    contentStyle={{backgroundColor: '#111114', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: '900', color: '#fff'}}
                    itemStyle={{color: '#fbbf24'}}
                  />
                  <Bar dataKey="hrs" radius={[0, 10, 10, 0]}>
                    {dataHours.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : 'rgba(255,255,255,0.05)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* AI ANALYSIS SECTION */}
      <div className={cn(
        "bg-white/[0.01] border rounded-[3rem] overflow-hidden transition-all duration-700 shadow-2xl",
        showAI ? "border-blue-500/30 ring-1 ring-blue-500/20" : "border-white/5"
      )}>
        <div className="p-10 flex flex-col xl:flex-row items-center gap-10 bg-gradient-to-br from-blue-600/5 to-transparent">
          <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-600/30 shrink-0 relative overflow-hidden group">
             <Cpu className="w-12 h-12 relative z-10" weight="fill" />
             <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="absolute inset-0 bg-blue-400/20 animate-pulse" />
          </div>
          <div className="flex-1 text-center xl:text-left">
            <h4 className="text-2xl font-black text-white mb-2 flex items-center justify-center xl:justify-start gap-3 italic">
              ANÁLISIS PREDICTIVO
              <Sparkle className="w-6 h-6 text-blue-400 animate-pulse" weight="fill" />
            </h4>
            <p className="text-sm text-white/40 font-bold uppercase tracking-widest max-w-2xl leading-loose">
              Análisis automático de patrones de asistencia y optimización del flujo operativo empresarial.
            </p>
          </div>
          <button 
            onClick={() => setShowAI(!showAI)}
            className={cn(
              "px-10 py-5 font-black text-[11px] uppercase tracking-[0.2em] rounded-[2rem] transition-all active:scale-95 shadow-2xl",
              showAI ? "bg-white text-black" : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20"
            )}
          >
            {showAI ? 'OCULTAR ANÁLISIS' : 'VER PREDICCIONES'}
          </button>
        </div>

        <AnimatePresence>
          {showAI && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-10 border-t border-white/5 bg-black/20">
                {isLoadingAI ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Consultando a Gemini AI...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {insights.length > 0 ? (
                      insights.map((insight, idx) => (
                        <div key={idx} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative group hover:border-blue-500/30 transition-all">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center mb-6",
                            insight.type === 'efficiency' ? "bg-blue-500/10 text-blue-400" : 
                            insight.type === 'technical' ? "bg-emerald-500/10 text-emerald-400" :
                            "bg-rose-500/10 text-rose-400"
                          )}>
                             {insight.type === 'efficiency' ? <MagicWand size={20} weight="fill" /> : 
                              insight.type === 'technical' ? <Monitor size={20} weight="fill" /> :
                              <Warning size={20} weight="fill" />}
                          </div>
                          <h5 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">{insight.title}</h5>
                          <p className="text-sm text-white/80 font-medium leading-relaxed italic">"{insight.text}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-10">
                        <p className="text-white/40 text-xs italic">No hay suficientes datos para generar insights en este momento.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnalyticStat({ label, value, trend, color, icon: Icon }) {
  const themes = {
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10"
  };

  return (
    <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] group hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl border transition-colors", themes[color])}>
          <Icon size={20} weight="fill" />
        </div>
        <div className={cn(
          "text-[10px] font-black px-3 py-1 rounded-full",
          trend.startsWith('+') ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
        )}>
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">{label}</p>
      <p className="text-2xl font-black text-white italic">{value}</p>
    </div>
  );
}
