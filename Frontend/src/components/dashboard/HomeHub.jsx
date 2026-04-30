import React from 'react';
import { 
  MagnifyingGlass, 
  Gear, 
  User, 
  ArrowRight,
  Clock,
  Users,
  CheckCircle,
  ChartLineUp
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export default function HomeHub({ profile, setActiveTab, stats = {} }) {
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Greeting - Minimalist & Professional */}
      <div className="relative p-2 md:p-4">
        <div className="relative z-10 py-10 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] mb-6 text-zinc-500">
            <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            Estatus de Operaciones • {profile?.role === 'admin' ? 'Administrador' : 'Empleado'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
            Buenos días, <span className="text-zinc-500 font-medium">{profile?.displayName?.split(' ')[0] || 'Usuario'}</span>. <br/>
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic serif">Resumen de jornada.</span>
          </h1>
          <p className="text-zinc-500 text-base md:text-lg font-medium max-w-xl leading-relaxed">
            La plataforma de gestión inteligente de capital humano <br className="hidden md:block" />
            está optimizada y lista para procesar tus registros legales.
          </p>
        </div>
        
        {/* Subtle Background Accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* Main Hub Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HubCard 
          icon={MagnifyingGlass}
          title="Panel de Búsqueda"
          description="Localiza empleados, registros históricos o informes de inspección al instante."
          color="blue"
          onClick={() => setActiveTab('Registros')}
        />
        <HubCard 
          icon={Gear}
          title="Configuración"
          description="Ajusta las políticas de la empresa, centros de trabajo y reglas de fichaje."
          color="zinc"
          onClick={() => setActiveTab('Mi Empresa')}
        />
        <HubCard 
          icon={User}
          title="Mi Perfil"
          description="Consulta tus datos personales, histórico de horas y gestión de privacidad."
          color="emerald"
          onClick={() => setActiveTab('Mi Perfil')}
        />
      </div>

      {/* Secondary Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">Estado de la Empresa</h3>
            <ChartLineUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-6">
            <QuickStatItem 
              label="Empleados en activo" 
              value={stats.working || 0} 
              total={stats.totalEmployees || 0} 
              color="blue" 
            />
            <QuickStatItem 
              label="Registros verificados hoy" 
              value={stats.todayRegistros || 0} 
              total={stats.totalEmployees || 0} 
              color="emerald" 
              isDone 
            />
          </div>
          <button 
            onClick={() => setActiveTab('Análisis')}
            className="w-full mt-8 py-4 rounded-2xl bg-white/[0.03] hover:bg-white/5 text-zinc-300 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn"
          >
            Ver Analítica Completa
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center space-y-4">
           <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
             <CheckCircle className="w-8 h-8" weight="fill" />
           </div>
           <h3 className="text-xl font-bold text-white">Cumplimiento Legal OK</h3>
           <p className="text-zinc-500 text-sm max-w-[280px]">
             Tu empresa cumple con la normativa vigente de registro de jornada en España.
           </p>
           <div className="pt-4 flex gap-2">
             <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400">RGPD 2026</div>
             <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400">Ley 8/2019</div>
           </div>
        </div>
      </div>
    </div>
  );
}

function HubCard({ icon: Icon, title, description, color, onClick }) {
  const colors = {
    blue: "from-blue-600/20 to-blue-600/5 text-blue-500 border-blue-500/20 hover:border-blue-500/40",
    zinc: "from-zinc-600/20 to-zinc-600/5 text-zinc-400 border-white/10 hover:border-white/20",
    emerald: "from-emerald-600/20 to-emerald-600/5 text-emerald-500 border-emerald-500/20 hover:border-emerald-500/40"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-8 rounded-[2.5rem] bg-gradient-to-br border transition-all duration-300 text-left group hover:-translate-y-1",
        colors[color] || colors.zinc
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon className="w-7 h-7" weight="duotone" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-1">
        {description}
      </p>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
        Acceder ahora
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

function QuickStatItem({ label, value, total, color, isDone }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const barColors = {
    blue: "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]",
    emerald: "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-zinc-300">{label}</span>
        <span className="text-sm font-mono text-white">
          {value}<span className="text-zinc-700 ml-1">/ {total}</span>
        </span>
      </div>
      <div className="w-full h-2.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000", barColors[color] || barColors.blue)} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
