import React, { useState, useEffect } from 'react';
import { Warning, MapPin, Clock, CaretRight, ShieldCheck } from '@phosphor-icons/react';
import { getAnomalies, getClientSession } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnomalyMonitor() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAnomalies = async () => {
      try {
        const session = getClientSession();
        if (!session?.token) return;
        const res = await getAnomalies(session.token);
        if (mounted) setAnomalies(res.data || []);
      } catch (err) {
        console.error("Error fetching anomalies:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && anomalies.length === 0) return null;
  if (anomalies.length === 0) return (
    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
        <ShieldCheck size={24} weight="fill" />
      </div>
      <div>
        <p className="text-[10px] font-black text-white uppercase tracking-widest">Estado del Sistema: Seguro</p>
        <p className="text-[9px] text-emerald-500/60 font-bold uppercase tracking-widest mt-0.5">No se detectan anomalías operativas hoy.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-rose-500">
           <Warning size={18} weight="fill" className="animate-pulse" />
           <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Monitor de Anomalías ({anomalies.length})</h3>
        </div>
        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest italic">Tiempo Real</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {anomalies.map((anomaly, idx) => (
            <motion.div 
              key={`${anomaly.userId}-${anomaly.type}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-[#111114] border border-rose-500/20 rounded-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all">
                {anomaly.type === 'out_of_bounds' ? <MapPin size={48} /> : <Clock size={48} />}
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                    anomaly.severity === 'high' ? "bg-rose-500 text-white" : "bg-amber-500 text-black"
                  )}>
                    {anomaly.severity === 'high' ? 'CRÍTICO' : 'AVISO'}
                  </span>
                  <span className="text-[9px] font-mono text-white/20 font-bold italic">
                    {new Date(anomaly.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{anomaly.userName}</p>
                <p className="text-[10px] text-white/40 font-medium leading-relaxed italic">{anomaly.details}</p>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{anomaly.type.replace(/_/g, ' ')}</span>
                   <CaretRight size={12} className="text-white/10 group-hover:text-white transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
