import { useCallback } from 'react';
import { getClientSession, uploadDocument, downloadDocument, signDocument, deleteDocument } from '@/lib/api';

export function useDocumentMutations({ showFeedback, refreshAllData }) {
  const handleDocumentSubmit = useCallback(async (values) => {
    const session = getClientSession();
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('type', values.type || 'other');
      if (values.file) fd.append('file', values.file);
      await uploadDocument(session.token, fd);
      await refreshAllData();
      showFeedback('success', 'Documento subido correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al subir documento.');
    }
  }, [showFeedback, refreshAllData]);

  const handleDocumentDelete = useCallback(async (doc) => {
    const session = getClientSession();
    if (!session?.token || !doc?.id) return;
    if (!confirm(`¿Eliminar el documento "${doc.title}"?`)) return;
    try {
      await deleteDocument(session.token, doc.id);
      await refreshAllData();
      showFeedback('success', 'Documento eliminado correctamente.');
    } catch (err) {
      showFeedback('error', 'Error al eliminar el documento.');
    }
  }, [showFeedback, refreshAllData]);

  const handleDownloadDocument = useCallback(async (doc) => {
    const session = getClientSession();
    if (!session?.token || !doc?.id) return;
    try {
      const blob = await downloadDocument(session.token, doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || `document-${doc.id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      showFeedback('error', 'Error al descargar el documento.');
    }
  }, [showFeedback]);

  const handleSignDocument = useCallback(async (doc) => {
    const session = getClientSession();
    if (!session?.token || !doc?.id) return;
    try {
      await signDocument(session.token, doc.id, { signedAt: new Date().toISOString() });
      showFeedback('success', 'Documento firmado correctamente.');
      await refreshAllData();
    } catch (err) {
      showFeedback('error', 'Error al firmar el documento.');
    }
  }, [showFeedback, refreshAllData]);

  return { handleDocumentSubmit, handleDocumentDelete, handleDownloadDocument, handleSignDocument };
}
