import IconBox from './IconBox';
import { cn } from '@/lib/utils';

export default function SectionHeader({ 
  icon, 
  iconColor = 'blue', 
  title, 
  subtitle, 
  action, 
  actionLabel, 
  actionIcon: ActionIcon,
  onAction,
  className 
}) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#111114] border border-white/[0.06] p-7 rounded-[20px] shadow-[0_1px_3px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.15)]",
      className
    )}>
      <div className="flex items-center gap-4">
        <IconBox icon={icon} size="lg" color={iconColor} />
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-zinc-500 text-sm font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      
      {(action || onAction) && (
        <button
          onClick={onAction}
          className="flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] uppercase tracking-[0.12em] px-7 py-3.5 rounded-[14px] transition-all duration-200 shadow-lg shadow-blue-600/15 hover:shadow-blue-500/25 active:scale-[0.97] whitespace-nowrap"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" weight="bold" />}
          {actionLabel || action}
        </button>
      )}
    </div>
  );
}
