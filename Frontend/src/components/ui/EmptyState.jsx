import { cn } from '@/lib/utils';

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction, className }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-8 text-center",
      className
    )}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-zinc-600" weight="duotone" />
        </div>
      )}
      {title && <h4 className="text-lg font-extrabold text-zinc-400 mb-1.5">{title}</h4>}
      {subtitle && <p className="text-sm text-zinc-600 max-w-xs leading-relaxed">{subtitle}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 text-xs font-extrabold text-blue-400 hover:text-blue-300 uppercase tracking-wider transition-colors"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
