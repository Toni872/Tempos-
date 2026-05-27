import { useCallback } from 'react';
import { getClientSession, requestAbsence, approveAbsence, rejectAbsence } from '@/lib/api';

export function useAbsenceMutations({ showFeedback, refreshAllData }) {
  const handleAbsenceSubmit = useCallback(async (values) => {
    const session = getClientSession();
    try {
      await requestAbsence(session.token, values);
      await refreshAllData();
      showFeedback('success', 'Solicitud de ausencia enviada.');
    } catch (err) {
      showFeedback('error', 'Error al solicitar ausencia.');
    }
  }, [showFeedback, refreshAllData]);

  const actOnAbsence = useCallback(async (id, action) => {
    const session = getClientSession();
    try {
      if (action === 'approve') await approveAbsence(session.token, id);
      else await rejectAbsence(session.token, id);
      await refreshAllData();
      showFeedback('success', action === 'approve' ? 'Ausencia aprobada.' : 'Ausencia rechazada.');
    } catch (err) {
      showFeedback('error', 'Error al procesar ausencia.');
    }
  }, [showFeedback, refreshAllData]);

  return { handleAbsenceSubmit, actOnAbsence };
}
