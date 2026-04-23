import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export default function ModernTable({ 
  columns, 
  data, 
  onRowClick, 
  actions,
  isLoading = false,
  emptyMessage = "No se encontraron registros"
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10 text-zinc-500">
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 lg:mx-0">
      <table className="w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left">
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={cn(
                  "px-6 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
            {actions && <th className="px-6 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <motion.tr
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIdx * 0.05, duration: 0.3 }}
              key={row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "group bg-[#111114] hover:bg-[#19191c] border border-white/5 transition-all duration-200 cursor-pointer",
                "rounded-[1.25rem]"
              )}
            >
              {columns.map((col, colIdx) => (
                <td 
                  key={colIdx} 
                  className={cn(
                    "px-6 py-4 text-sm font-medium text-zinc-300 first:rounded-l-[1.25rem] last:rounded-r-[1.25rem] group-hover:text-white transition-colors",
                    colIdx === 0 && "text-white",
                    col.className
                  )}
                >
                  {col.cell ? col.cell(row) : row[col.accessor]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 text-right rounded-r-[1.25rem]">
                  <div className="flex items-center justify-end gap-2">
                    {actions(row)}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
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
