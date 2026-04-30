import React from 'react';
import { cn } from '@/lib/utils';

export default function Logo({ className, size = "md", showText = true }) {
  const sizes = {
    sm: { svg: 20, font: "text-lg" },
    md: { svg: 28, font: "text-2xl" },
    lg: { svg: 40, font: "text-4xl" }
  };

  const config = sizes[size] || sizes.md;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg width={config.svg} height={config.svg} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.2"/>
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2.8"/>
        <circle cx="50" cy="12" r="2.2" fill="currentColor"/>
        <circle cx="88" cy="50" r="2.2" fill="currentColor"/>
        <circle cx="50" cy="88" r="2.2" fill="currentColor"/>
        <circle cx="12" cy="50" r="2.2" fill="currentColor"/>
        <line x1="50" y1="50" x2="50" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
        <line x1="50" y1="50" x2="68" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        <circle cx="50" cy="50" r="3.5" fill="currentColor"/>
      </svg>
      {showText && (
        <div className={cn("font-['Space_Grotesk'] font-bold tracking-widest text-white", config.font)}>
          Tem<span className="text-blue-500">pos</span>
        </div>
      )}
    </div>
  );
}
