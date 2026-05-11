import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Stop, 
  MapPin, 
  User, 
  Clock, 
  Calendar,
  Warning
} from '@phosphor-icons/react';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * MobileQuickClock: Interfaz de fichaje optimizada para Android/iOS.
 * Enfocada en la acción crítica y retroalimentación táctica.
 */
export default function MobileQuickClock({ 
  clockedIn, 
  onClockToggle, 
  elapsedTime = "00:00:00" 
}) {
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, checking, success, error
  const [error, setError] = useState(null);

  // Efecto de vibración al interactuar
  const triggerHaptic = async (style = ImpactStyle.Medium) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignorar si no es dispositivo físico
    }
  };

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    setLocationStatus('checking');
    await triggerHaptic(ImpactStyle.Heavy);

    try {
      // 1. Obtener ubicación precisa (Requerimiento legal Art. 34.9 ET)
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      };

      setLocationStatus('success');

      // 2. Ejecutar acción de fichaje
      await onClockToggle({ location: locationData });
      
      await triggerHaptic(ImpactStyle.Light);
    } catch (err) {
      console.error('Error en fichaje móvil:', err);
      setError('No se pudo obtener la ubicación. Activa el GPS.');
      setLocationStatus('error');
      await triggerHaptic(ImpactStyle.Medium);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans overflow-hidden">
      {/* Header Premium */}
      <div className="p-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <User weight="fill" className="text-blue-500" size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Bienvenido</p>
            <p className="text-sm font-bold">Empleado Tempos</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Calendar size={20} className="text-zinc-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        {/* Glow de fondo dinámico */}
        <div className={cn(
          "absolute w-64 h-64 blur-[100px] rounded-full opacity-20 transition-colors duration-1000",
          clockedIn ? "bg-rose-600" : "bg-blue-600"
        )} />

        {/* Ticker de Tiempo */}
        <div className="text-center mb-16 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-black tracking-tighter tabular-nums mb-2"
          >
            {elapsedTime}
          </motion.div>
          <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">
            {clockedIn ? "Tiempo de Jornada Actual" : "Hoy: 08:00 Total"}
          </p>
        </div>

        {/* BOTÓN PRINCIPAL (ACTION HERO) */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleAction}
          disabled={loading}
          className={cn(
            "relative w-72 h-72 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-700 shadow-2xl z-10",
            clockedIn 
              ? "bg-rose-600 shadow-rose-600/30 border-8 border-rose-500/20" 
              : "bg-blue-600 shadow-blue-600/30 border-8 border-blue-500/20",
            loading && "opacity-80 animate-pulse"
          )}
        >
          <AnimatePresence mode="wait">
            {clockedIn ? (
              <motion.div
                key="stop"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <Stop weight="fill" size={64} />
                <span className="font-black text-xs uppercase tracking-[0.2em]">Finalizar Salida</span>
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <Play weight="fill" size={64} />
                <span className="font-black text-xs uppercase tracking-[0.2em]">Iniciar Entrada</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Anillos de animación */}
          <div className={cn(
            "absolute inset-0 rounded-full border border-white/20 animate-ping",
            !clockedIn && "animation-delay-500"
          )} />
        </motion.button>

        {/* Status de Ubicación / Errores */}
        <div className="mt-16 z-10 h-10">
          {error ? (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
              <Warning size={16} weight="bold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
            </div>
          ) : (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500",
              locationStatus === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
              locationStatus === 'checking' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
              "bg-white/5 border-white/10 text-zinc-500"
            )}>
              <MapPin size={16} weight={locationStatus === 'success' ? 'fill' : 'bold'} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {locationStatus === 'checking' ? 'Verificando ubicación...' : 
                 locationStatus === 'success' ? 'Ubicación Confirmada' : 
                 'Listo para fichar'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav (Tab Bar) */}
      <div className="p-6 bg-[#111111] border-t border-white/[0.03] flex justify-around items-center">
        <div className="text-blue-500 flex flex-col items-center gap-1">
          <Clock size={24} weight="fill" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Fichar</span>
        </div>
        <div className="text-zinc-600 flex flex-col items-center gap-1">
          <Play size={24} weight="bold" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Historial</span>
        </div>
        <div className="text-zinc-600 flex flex-col items-center gap-1">
          <User size={24} weight="bold" />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Perfil</span>
        </div>
      </div>
    </div>
  );
}
