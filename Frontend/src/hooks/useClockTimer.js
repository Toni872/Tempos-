import { useState, useEffect, useRef, useMemo } from 'react';

/**
 * useClockTimer Hook - Optimizado para rendimiento y precisión
 * @param {Object} activeFicha La ficha activa con sus eventos
 * @param {boolean} clockedIn Si está fichado
 * @param {boolean} isOnBreak Si está en pausa
 */
export function useClockTimer(activeFicha, clockedIn, isOnBreak) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef(null);

  /**
   * Calculamos el tiempo acumulado de bloques CERRADOS.
   * Solo se recalcula cuando cambia la ficha o el estado de pausa.
   */
  const baseAccumulatedMs = useMemo(() => {
    let total = 0;
    let currentStart = null;

    // DIAGNÓSTICO SENIOR: Ver qué campos tiene el objeto realmente
    console.log("🔍 [TIMER_DEBUG] Keys en activeFicha:", activeFicha ? Object.keys(activeFicha) : "null");
    
    if (!activeFicha) return { total, currentStart };

    // INGENIERÍA SENIOR: Buscar la hora de inicio en cualquier propiedad posible
    const rawStart = activeFicha.startTime || activeFicha.start_time || activeFicha.date || activeFicha.createdAt;
    console.log("🔍 [TIMER_DEBUG] rawStart detectado:", rawStart);

    if (rawStart && typeof rawStart === 'string') {
      // Si es un formato HH:mm...
      if (rawStart.includes(':')) {
        const [hours, minutes] = rawStart.split(':');
        const start = new Date();
        start.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        currentStart = start.getTime();
      } else {
        // Si es un ISO string o timestamp
        currentStart = new Date(rawStart).getTime();
      }
    }

    // EMERGENCIA: Si seguimos sin tener inicio pero estamos fichados, usar "ahora" para que el contador no sea 0
    if (!currentStart) {
      console.warn("⚠️ [TIMER] No se detectó hora de inicio, usando fallback 'ahora'");
      currentStart = Date.now();
    }

    if (activeFicha.events && activeFicha.events.length > 0) {
      total = 0;
      currentStart = null;
      const sortedEvents = [...activeFicha.events].sort(
        (a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime()
      );

      for (const event of sortedEvents) {
        const ts = new Date(event.timestampUtc).getTime();
        if (isNaN(ts)) continue;

        if (event.type === 'CLOCK_IN' || event.type === 'BREAK_END') {
          currentStart = ts;
        } else if (event.type === 'BREAK_START' || event.type === 'CLOCK_OUT') {
          if (currentStart) {
            total += (ts - currentStart);
            currentStart = null;
          }
        }
      }
    }
    
    return { total, currentStart };
  }, [activeFicha?.id, activeFicha?.startTime, activeFicha?.events?.length]); // Dependencias más específicas para evitar reinicios constantes

  useEffect(() => {
    if (!clockedIn || !activeFicha) {
      setElapsedTime('00:00:00');
      return;
    }

    const updateDisplay = () => {
      let currentTotal = baseAccumulatedMs.total;
      
      if (!isOnBreak && baseAccumulatedMs.currentStart) {
        const diff = Date.now() - baseAccumulatedMs.currentStart;
        currentTotal += Math.max(1000, diff);
      }

      const h = Math.floor(currentTotal / 3600000);
      const m = Math.floor((currentTotal % 3600000) / 60000);
      const s = Math.floor((currentTotal % 60000) / 1000);

      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
      // Log de depuración para ver el latido del reloj
      if (s % 10 === 0) console.log(`⏱️ [TIMER] Tick: ${timeStr} | Start: ${baseAccumulatedMs.currentStart}`);
      
      setElapsedTime(timeStr);
    };

    updateDisplay();

    if (clockedIn && !isOnBreak) {
      console.log("🚀 [TIMER] Iniciando intervalo de 1s");
      timerRef.current = setInterval(updateDisplay, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        console.log("⏹️ [TIMER] Limpiando intervalo");
        clearInterval(timerRef.current);
      }
    };
  }, [clockedIn, isOnBreak, baseAccumulatedMs]); // Quitamos activeFicha de dependencias ya que baseAccumulatedMs ya depende de ella

  return elapsedTime;
}
