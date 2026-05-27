import { useCallback } from 'react';
import { getClientSession, createSchedule, assignShift } from '@/lib/api';
import api from '@/lib/api';

export function useScheduleMutations({ showFeedback, refreshAllData }) {
  const handleScheduleSubmit = useCallback(async (data, mode, modalData) => {
    const session = getClientSession();
    try {
      if (mode === 'edit') {
        await api.put(`/api/v1/schedules/${modalData.id}`, data, { token: session?.token });
        showFeedback('success', 'Plantilla actualizada.');
      } else {
        await createSchedule(session.token, data);
        showFeedback('success', 'Nueva plantilla creada.');
      }
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al guardar horario.');
    }
  }, [showFeedback, refreshAllData]);

  const handleScheduleDelete = useCallback(async (sch) => {
    if (!confirm(`¿Borrar plantilla de horario "${sch.name}"?`)) return;
    try {
      const session = getClientSession();
      await api.delete(`/api/v1/schedules/${sch.id}`, { token: session?.token });
      await refreshAllData();
      showFeedback('success', 'Plantilla eliminada.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar horario.');
    }
  }, [showFeedback, refreshAllData]);

  const handleAssignShift = useCallback(async (data) => {
    try {
      const session = getClientSession();
      await assignShift(session.token, data);
      await refreshAllData();
      showFeedback('success', 'Turno asignado.');
    } catch (err) {
      showFeedback('error', 'Error al asignar turno.');
    }
  }, [showFeedback, refreshAllData]);

  return { handleScheduleSubmit, handleScheduleDelete, handleAssignShift };
}
