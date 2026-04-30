import IconBox from './IconBox';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon, color = 'blue', trend, className }) {
  return (
    <div className={cn(
      "relative overflow-hidden p-6 rounded-[20px] border border-white/[0.06] bg-[#111114] transition-all duration-300 hover:border-white/[0.1] group",
      className
    )}>
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
          <p className="text-3xl font-extrabold text-white tabular-nums">{value}</p>
          {trend && (
            <p className={cn(
              "text-[11px] font-bold flex items-center gap-1",
              trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-zinc-500"
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs anterior
            </p>
          )}
        </div>
        <IconBox icon={icon} size="md" color={color} />
      </div>
    </div>
  );
}
