import { useCallback } from 'react';
import { getClientSession, getActiveFicha, clockIn, clockOut, breakStart, breakEnd } from '@/lib/api';

export function useClockMutations({ showFeedback, refreshAllData, setClockedIn, setIsOnBreak, setActiveFicha }) {
  const handleClockToggle = useCallback(async ({ requestLocation, consentGiven, requiresGeo, isCurrentlyClockedIn }) => {
    const session = getClientSession();
    if (!session?.token) return 'error';

    if (requiresGeo && !consentGiven) return 'requires_consent';

    try {
      let payload = {};
      if (requiresGeo && consentGiven) {
        const coords = await requestLocation();
        if (coords) {
          payload = { location: { lat: coords.latitude, lng: coords.longitude } };
        }
      }

      if (isCurrentlyClockedIn) {
        await clockOut(session.token, { ...payload, authMethod: 'password' });
        setClockedIn(false);
        setIsOnBreak(false);
        setActiveFicha(null);
        showFeedback('success', 'Turno finalizado.');
      } else {
        const res = await clockIn(session.token, { ...payload, authMethod: 'password' });
        const newFicha = res?.data ?? res?.ficha ?? res;
        setActiveFicha(newFicha);
        setClockedIn(true);
        setIsOnBreak(false);
        showFeedback('success', 'Turno iniciado.');
      }
      await refreshAllData();
      return 'ok';
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error en fichaje.';
      showFeedback('error', msg);
      return 'error';
    }
  }, [showFeedback, refreshAllData, setClockedIn, setIsOnBreak, setActiveFicha]);

  const handleBreakToggle = useCallback(async ({ isCurrentlyOnBreak }) => {
    const session = getClientSession();
    if (!session?.token) return;

    try {
      if (isCurrentlyOnBreak) {
        await breakEnd(session.token);
        setIsOnBreak(false);
        showFeedback('success', 'Pausa finalizada. Reanudando jornada.');
      } else {
        await breakStart(session.token);
        setIsOnBreak(true);
        showFeedback('success', 'Pausa iniciada.');
      }
      const ficha = await getActiveFicha(session.token);
      const extractFicha = (res) => {
        if (!res) return null;
        if (res.data !== undefined) return res.data;
        if (res.ficha) return res.ficha;
        if (res.id) return res;
        return null;
      };
      setActiveFicha(extractFicha(ficha));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al cambiar estado de pausa.';
      showFeedback('error', msg);
    }
  }, [showFeedback, setIsOnBreak, setActiveFicha]);

  return { handleClockToggle, handleBreakToggle };
}
