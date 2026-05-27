import { useCallback } from 'react';
import { getClientSession, exportReport, exportAuditLog, listAuditLog } from '@/lib/api';

export function useExportActions({ showFeedback, auditFilters, setAuditFilters, setAuditLogRows }) {
  const handleExportReport = useCallback(async (format = 'pdf') => {
    const session = getClientSession();
    try {
      const blob = await exportReport(session.token, { format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe_jornada.${format === 'csv' ? 'csv' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showFeedback('error', 'Error al exportar.');
    }
  }, [showFeedback]);

  const handleExportAudit = useCallback(async (format) => {
    const session = getClientSession();
    try {
      const blob = await exportAuditLog(session.token, { ...auditFilters, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showFeedback('error', 'Error al exportar auditoria.');
    }
  }, [showFeedback, auditFilters]);

  const handleApplyAuditFilters = useCallback(async () => {
    const session = getClientSession();
    try {
      const logs = await listAuditLog(session.token, auditFilters);
      setAuditLogRows(logs);
    } catch (err) {
      console.error(err);
    }
  }, [auditFilters, setAuditLogRows]);

  const handleResetAuditFilters = useCallback(() => {
    setAuditFilters({ action: '', userId: '', startDate: '', endDate: '' });
  }, [setAuditFilters]);

  return { handleExportReport, handleExportAudit, handleApplyAuditFilters, handleResetAuditFilters };
}
