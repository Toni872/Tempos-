import { cn } from '@/lib/utils';

export default function Card({ children, className, hover = true, glow, ...props }) {
  return (
    <div
      className={cn(
        "bg-[#111114] border border-white/[0.06] rounded-[20px] shadow-sm",
        hover && "transition-all duration-300 hover:border-white/[0.1] hover:bg-[#131317]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("px-7 py-5 border-b border-white/[0.04]", className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }) {
  return (
    <div className={cn("px-7 py-6", className)}>
      {children}
    </div>
  );
}
