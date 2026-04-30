import { cn } from '@/lib/utils';

export default function Toggle({ enabled, onChange, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 shrink-0",
        enabled ? "bg-blue-600" : "bg-zinc-700",
        className
      )}
    >
      <span className={cn(
        "absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-all duration-300",
        enabled ? "left-[22px]" : "left-[3px]"
      )} />
    </button>
  );
}
