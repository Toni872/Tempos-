import { useCallback } from 'react';
import { getClientSession } from '@/lib/api';
import api from '@/lib/api';

export function useFichaMutations({ showFeedback, refreshAllData }) {
  const handleFichaSubmit = useCallback(async (data, mode, modalData) => {
    const session = getClientSession();
    try {
      if (mode === 'edit') {
        await api.put(`/api/v1/fichas/${modalData.id}`, data, { token: session.token });
        showFeedback('success', 'Fichaje actualizado.');
      }
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al guardar fichaje.');
    }
  }, [showFeedback, refreshAllData]);

  const handleCorrectionSubmit = useCallback(async (values, mode, modalData) => {
    const session = getClientSession();
    try {
      await api.post(`/api/v1/fichas/${modalData.id}/request-correction`, values, { token: session.token });
      showFeedback('success', 'Solicitud de corrección enviada al administrador.');
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al enviar solicitud de corrección.');
    }
  }, [showFeedback, refreshAllData]);

  const handleReviewCorrection = useCallback(async (decision, comment, modalData) => {
    const session = getClientSession();
    try {
      await api.post(`/api/v1/fichas/${modalData.id}/review-correction`, { decision, comment }, { token: session.token });
      showFeedback('success', decision === 'approved' ? 'Corrección aprobada y aplicada.' : 'Corrección rechazada.');
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al procesar la revisión.');
    }
  }, [showFeedback, refreshAllData]);

  return { handleFichaSubmit, handleCorrectionSubmit, handleReviewCorrection };
}
