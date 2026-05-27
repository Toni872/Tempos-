import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentMutations } from './useDocumentMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  uploadDocument: vi.fn(),
  downloadDocument: vi.fn(),
  signDocument: vi.fn(),
  deleteDocument: vi.fn(),
}));

import { getClientSession, uploadDocument, downloadDocument, signDocument, deleteDocument } from '@/lib/api';

describe('useDocumentMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
    window.URL.createObjectURL = vi.fn(() => 'blob:url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));
    expect(typeof result.current.handleDocumentSubmit).toBe('function');
    expect(typeof result.current.handleDocumentDelete).toBe('function');
    expect(typeof result.current.handleDownloadDocument).toBe('function');
    expect(typeof result.current.handleSignDocument).toBe('function');
  });

  it('should call uploadDocument on submit', async () => {
    uploadDocument.mockResolvedValue({});
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleDocumentSubmit({ title: 'Test', type: 'contract', file: new File([], 'test.pdf') });
    expect(uploadDocument).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call deleteDocument on delete (with confirm)', async () => {
    deleteDocument.mockResolvedValue({});
    window.confirm = vi.fn(() => true);
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleDocumentDelete({ id: '1', title: 'Test Doc' });
    expect(deleteDocument).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call signDocument on sign', async () => {
    signDocument.mockResolvedValue({});
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleSignDocument({ id: '1' });
    expect(signDocument).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should handle download document', async () => {
    downloadDocument.mockResolvedValue(new Blob(['test']));
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleDownloadDocument({ id: '1', name: 'test.pdf' });
    expect(downloadDocument).toHaveBeenCalledWith('test-token', '1');
  });

  it('should not delete if confirm is false', async () => {
    window.confirm = vi.fn(() => false);
    const { result } = renderHook(() => useDocumentMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleDocumentDelete({ id: '1' });
    expect(deleteDocument).not.toHaveBeenCalled();
  });
});
