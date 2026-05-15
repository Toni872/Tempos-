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
   * Usamos una clave de dependencia estable para evitar recálculos innecesarios.
   */
  const baseAccumulatedMs = useMemo(() => {
    let total = 0;
    let currentStart = null;
    
    if (!activeFicha) return { total, currentStart };

    // Buscamos la hora de inicio (startTime es HH:MM o ISO)
    const rawStart = activeFicha.startTime || activeFicha.start_time || activeFicha.createdAt;
    
    if (rawStart) {
      if (typeof rawStart === 'string' && rawStart.includes(':')) {
        const [hours, minutes] = rawStart.split(':');
        const start = new Date();
        // Si el servidor nos da solo HH:MM, asumimos que es de HOY
        start.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        currentStart = start.getTime();
      } else {
        currentStart = new Date(rawStart).getTime();
      }
    }

    // Si hay eventos, reconstruimos la línea de tiempo exacta
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
    
    // Si al final no tenemos currentStart pero estamos fichados, fallback SEGURO:
    // Usamos el createdAt de la ficha como inicio real.
    if (!currentStart && clockedIn) {
      currentStart = new Date(activeFicha.createdAt).getTime() || Date.now();
    }

    return { total, currentStart };
  }, [activeFicha?.id, activeFicha?.startTime, activeFicha?.events?.length, clockedIn]);

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
      timerRef.current = setInterval(updateDisplay, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clockedIn, isOnBreak, baseAccumulatedMs.total, baseAccumulatedMs.currentStart]);

  return elapsedTime;
}
