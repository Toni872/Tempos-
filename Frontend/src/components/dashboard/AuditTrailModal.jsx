import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  ArrowDown, 
  ArrowUp, 
  Coffee,
  CheckCircle,
  XCircle,
  MagnifyingGlass as FileSearch
} from '@phosphor-icons/react';
import ModalBase from './ModalBase';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export default function AuditTrailModal({ open, onClose, fichaId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && fichaId) {
      loadAuditTrail();
    }
  }, [open, fichaId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    try {
      const session = api.getClientSession();
      const res = await api.get(`/api/v1/fichas/${fichaId}/audit-trail`, { token: session.token });
      setData(res);
    } catch (err) {
      console.error("Error loading audit trail:", err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'CLOCK_IN': return <ArrowDown weight="bold" className="text-emerald-500" />;
      case 'CLOCK_OUT': return <ArrowUp weight="bold" className="text-rose-500" />;
      case 'BREAK_START': return <Coffee weight="bold" className="text-amber-500" />;
      case 'BREAK_END': return <Play weight="bold" className="text-blue-500" />;
      default: return <Clock weight="bold" />;
    }
  };

  const getEventLabel = (type) => {
    switch (type) {
      case 'CLOCK_IN': return 'Entrada';
      case 'CLOCK_OUT': return 'Salida';
      case 'BREAK_START': return 'Inicio Pausa';
      case 'BREAK_END': return 'Fin Pausa';
      default: return type;
    }
  };

  return (
    <ModalBase 
      open={open} 
      onClose={onClose} 
      title="Trazabilidad Legal del Fichaje"
    >
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
           <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Cargando Auditoría...</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Header Summary */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                <FileSearch size={28} weight="duotone" />
              </div>
              <div>
                <h4 className="text-white font-bold">Resumen de Jornada</h4>
                <p className="text-zinc-500 text-xs font-medium">ID: {data.ficha.id.slice(0, 8)}...</p>
              </div>
            </div>
            <Badge color={data.ficha.status === 'confirmed' ? 'emerald' : 'blue'}>
              {data.ficha.status.toUpperCase()}
            </Badge>
          </div>

          {/* Timeline of Events */}
          <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-white/[0.05]">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-6 pl-12">Eventos Atómicos Registrados</h3>
            
            {data.timeEntries.map((event, idx) => (
              <div key={event.id} className="relative pl-12 group">
                {/* Timeline Dot */}
                <div className="absolute left-[21px] top-1.5 w-[7px] h-[7px] rounded-full bg-zinc-800 border border-white/20 z-10 group-hover:scale-125 group-hover:border-blue-500 transition-all" />
                
                <div className="p-4 rounded-2xl bg-[#111114] border border-white/[0.04] hover:border-white/[0.08] transition-all flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-lg">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-200">{getEventLabel(event.type)}</p>
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
                        {event.ip || '0.0.0.0'} • {event.source}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-black text-white tabular-nums">
                      {new Date(event.timestampUtc).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-600">
                      {new Date(event.timestampUtc).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {/* Sub-changes log for this event if any */}
                {data.changeLog[event.id] && data.changeLog[event.id].map((log) => (
                  <div key={log.id} className="mt-2 ml-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                    <CheckCircle className="text-amber-500 shrink-0 mt-0.5" size={14} weight="fill" />
                    <div className="text-[11px]">
                      <p className="text-amber-200/80 font-bold uppercase tracking-tighter">Corrección Registrada</p>
                      <p className="text-zinc-500 mt-0.5">{log.reason}</p>
                      <p className="text-[9px] text-zinc-700 mt-1 uppercase font-black">Por: {log.changedBy.slice(0, 8)} • {log.metadata?.approvalStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="pt-6 border-t border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              <CheckCircle weight="fill" className="text-emerald-500" />
              Verificado por Autoridad Laboral
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] text-white text-[11px] font-black uppercase tracking-widest transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-zinc-600">No se pudo cargar la trazabilidad.</p>
        </div>
      )}
    </ModalBase>
  );
}

function Play({ weight, className, size }) {
  return <Clock weight={weight} className={className} size={size} />;
}
