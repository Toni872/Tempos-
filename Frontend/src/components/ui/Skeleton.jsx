import { cn } from '@/lib/utils';

export function SkeletonLine({ className }) {
  return <div className={cn("h-4 bg-white/[0.04] rounded-lg animate-pulse", className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("bg-[#111114] border border-white/[0.04] rounded-[20px] p-6 space-y-4 animate-pulse", className)}>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-[14px] bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-white/[0.04] rounded-lg" />
          <div className="h-3 w-1/3 bg-white/[0.03] rounded-lg" />
        </div>
      </div>
      <div className="h-3 w-full bg-white/[0.03] rounded-lg" />
      <div className="h-3 w-4/5 bg-white/[0.03] rounded-lg" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-[14px] animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04]" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-white/[0.04] rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
