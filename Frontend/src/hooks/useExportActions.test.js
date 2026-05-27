import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportActions } from './useExportActions';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  exportReport: vi.fn(),
  exportAuditLog: vi.fn(),
  listAuditLog: vi.fn(),
}));

import { getClientSession, exportReport, exportAuditLog, listAuditLog } from '@/lib/api';

describe('useExportActions', () => {
  const mockShowFeedback = vi.fn();
  const mockSetAuditFilters = vi.fn();
  const mockSetAuditLogRows = vi.fn();
  const auditFilters = { action: '', userId: '', startDate: '', endDate: '' };

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
    URL.createObjectURL = vi.fn(() => 'blob:url');
    URL.revokeObjectURL = vi.fn();
  });

  it('should return export handlers', () => {
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters,
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));
    expect(typeof result.current.handleExportReport).toBe('function');
    expect(typeof result.current.handleExportAudit).toBe('function');
    expect(typeof result.current.handleApplyAuditFilters).toBe('function');
    expect(typeof result.current.handleResetAuditFilters).toBe('function');
  });

  it('should call exportReport', async () => {
    exportReport.mockResolvedValue(new Blob(['test']));
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters,
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));

    await result.current.handleExportReport('pdf');
    expect(exportReport).toHaveBeenCalled();
  });

  it('should call exportAuditLog with filters', async () => {
    exportAuditLog.mockResolvedValue(new Blob(['test']));
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters: { action: 'login', userId: '123', startDate: '2024-01-01', endDate: '' },
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));

    await result.current.handleExportAudit('csv');
    expect(exportAuditLog).toHaveBeenCalledWith('test-token', expect.objectContaining({ action: 'login', userId: '123' }));
  });

  it('should call listAuditLog on apply filters', async () => {
    listAuditLog.mockResolvedValue([{ id: '1' }]);
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters,
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));

    await result.current.handleApplyAuditFilters();
    expect(listAuditLog).toHaveBeenCalled();
    expect(mockSetAuditLogRows).toHaveBeenCalledWith([{ id: '1' }]);
  });

  it('should reset audit filters', () => {
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters,
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));

    result.current.handleResetAuditFilters();
    expect(mockSetAuditFilters).toHaveBeenCalledWith({ action: '', userId: '', startDate: '', endDate: '' });
  });

  it('should handle export errors', async () => {
    exportReport.mockRejectedValue(new Error('Export failed'));
    const { result } = renderHook(() => useExportActions({
      showFeedback: mockShowFeedback,
      auditFilters,
      setAuditFilters: mockSetAuditFilters,
      setAuditLogRows: mockSetAuditLogRows,
    }));

    await result.current.handleExportReport('pdf');
    expect(mockShowFeedback).toHaveBeenCalledWith('error', expect.any(String));
  });
});
