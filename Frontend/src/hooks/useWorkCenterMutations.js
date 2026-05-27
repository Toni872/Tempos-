import { useCallback } from 'react';
import { getClientSession } from '@/lib/api';
import api from '@/lib/api';

export function useWorkCenterMutations({ showFeedback, refreshAllData }) {
  const handleWorkCenterSubmit = useCallback(async (values, mode, modalData) => {
    const session = getClientSession();
    try {
      if (mode === 'edit') {
        await api.put(`/api/v1/work-centers/${modalData.id}`, values, { token: session?.token });
      } else {
        await api.post('/api/v1/work-centers', values, { token: session?.token });
      }
      await refreshAllData();
      showFeedback('success', 'Sede guardada correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al guardar centro.');
    }
  }, [showFeedback, refreshAllData]);

  const handleWorkCenterDelete = useCallback(async (wc) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la sede "${wc.name}"?`)) return;
    try {
      const session = getClientSession();
      await api.delete(`/api/v1/work-centers/${wc.id}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', 'Sede eliminada correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar centro.');
    }
  }, [showFeedback, refreshAllData]);

  return { handleWorkCenterSubmit, handleWorkCenterDelete };
}
