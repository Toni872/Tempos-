import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-11 h-11 rounded-[14px]',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-16 h-16 rounded-[18px]',
};

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const colorMap = {
  blue:    'bg-blue-500/10 text-blue-400',
  indigo:  'bg-indigo-500/10 text-indigo-400',
  violet:  'bg-violet-500/10 text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber:   'bg-amber-500/10 text-amber-400',
  rose:    'bg-rose-500/10 text-rose-400',
  orange:  'bg-orange-500/10 text-orange-400',
  cyan:    'bg-cyan-500/10 text-cyan-400',
  purple:  'bg-purple-500/10 text-purple-400',
  zinc:    'bg-zinc-800 text-zinc-400',
};

export default function IconBox({ icon: Icon, size = 'md', color = 'blue', className, weight = 'duotone' }) {
  return (
    <div className={cn(sizeMap[size], colorMap[color], "flex items-center justify-center shrink-0", className)}>
      <Icon className={iconSizeMap[size]} weight={weight} />
    </div>
  );
}
