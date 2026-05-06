import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CaretRight, DotsThree } from '@phosphor-icons/react';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';

export default function ModernTable({ 
  columns, 
  data, 
  onRowClick, 
  actions,
  isLoading = false,
  emptyMessage = "No se encontraron registros",
  emptyIcon
}) {
  if (isLoading) {
    return <SkeletonTable rows={6} cols={columns.length + (actions ? 1 : 0)} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState 
        icon={emptyIcon} 
        title="Sin registros" 
        subtitle={emptyMessage} 
      />
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 lg:mx-0">
      <table className="w-full border-separate border-spacing-y-2.5 px-1">
        <thead>
          <tr className="text-left">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "px-6 pb-2 text-[10px] font-extrabold text-zinc-500 uppercase tracking-[0.2em]",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
            {actions && <th className="px-6 pb-2 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <motion.tr
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(rowIdx * 0.04, 0.4), duration: 0.3, ease: "easeOut" }}
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "group bg-[#111114] hover:bg-[#16161a] border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md",
                "rounded-2xl"
              )}
            >
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className={cn(
                    "px-6 py-4 text-sm font-semibold text-zinc-300 first:rounded-l-2xl last:rounded-r-2xl group-hover:text-white transition-colors",
                    colIdx === 0 && "text-white",
                    col.className
                  )}
                >
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 text-right rounded-r-2xl">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-2">
                      {actions(row)}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/[0.02] group-hover:bg-blue-500/10 flex items-center justify-center text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300">
                      <CaretRight className="w-4 h-4" weight="bold" />
                    </div>
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
