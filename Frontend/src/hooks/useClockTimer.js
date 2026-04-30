import { useState, useEffect, useRef } from 'react';

/**
 * useClockTimer Hook
 * Gestiona el cronómetro de la jornada considerando pausas.
 * @param {Object} activeFicha La ficha activa con sus eventos
 * @param {boolean} clockedIn Si está fichado
 * @param {boolean} isOnBreak Si está en pausa
 */
export function useClockTimer(activeFicha, clockedIn, isOnBreak) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!clockedIn || !activeFicha) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime('00:00:00');
      return;
    }

    const updateTimer = () => {
      let totalMs = 0;
      let lastStartTime = null;

      // Usar la lista de eventos si está disponible (precisión absoluta con pausas)
      if (activeFicha.events && activeFicha.events.length > 0) {
        for (const event of activeFicha.events) {
          const timestamp = new Date(event.timestampUtc).getTime();
          switch (event.type) {
            case 'CLOCK_IN':
            case 'BREAK_END':
              if (lastStartTime === null) lastStartTime = timestamp;
              break;
            case 'BREAK_START':
            case 'CLOCK_OUT':
              if (lastStartTime !== null) {
                totalMs += (timestamp - lastStartTime);
                lastStartTime = null;
              }
              break;
          }
        }
      } else {
        // Fallback si no hay eventos (por compatibilidad o carga inicial lenta)
        let start;
        if (activeFicha.date && activeFicha.startTime) {
          const datePart = activeFicha.date.split('T')[0];
          start = new Date(`${datePart}T${activeFicha.startTime}:00`).getTime();
        } else {
          start = new Date(activeFicha.startTime).getTime();
        }
        if (!isNaN(start)) {
          lastStartTime = start;
        }
      }

      // Sumar el tiempo del bloque actual si está corriendo (no pausado)
      if (lastStartTime !== null && !isOnBreak) {
        totalMs += Math.max(0, Date.now() - lastStartTime);
      }

      const h = Math.floor(totalMs / 3600000);
      const m = Math.floor((totalMs % 3600000) / 60000);
      const s = Math.floor((totalMs % 60000) / 1000);

      setElapsedTime(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    
    // Solo actualizamos el reloj si no estamos en pausa
    if (!isOnBreak) {
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clockedIn, activeFicha, isOnBreak]);

  return elapsedTime;
}
