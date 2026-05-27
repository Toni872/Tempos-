import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAbsenceMutations } from './useAbsenceMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  requestAbsence: vi.fn(),
  approveAbsence: vi.fn(),
  rejectAbsence: vi.fn(),
}));

import { getClientSession, requestAbsence, approveAbsence, rejectAbsence } from '@/lib/api';

describe('useAbsenceMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useAbsenceMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    expect(typeof result.current.handleAbsenceSubmit).toBe('function');
    expect(typeof result.current.actOnAbsence).toBe('function');
  });

  it('should call requestAbsence on submit', async () => {
    requestAbsence.mockResolvedValue({});
    const { result } = renderHook(() => useAbsenceMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleAbsenceSubmit({ type: 'vacation' });
    expect(requestAbsence).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call approveAbsence on approve', async () => {
    approveAbsence.mockResolvedValue({});
    const { result } = renderHook(() => useAbsenceMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.actOnAbsence('1', 'approve');
    expect(approveAbsence).toHaveBeenCalledWith('test-token', '1');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call rejectAbsence on reject', async () => {
    rejectAbsence.mockResolvedValue({});
    const { result } = renderHook(() => useAbsenceMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.actOnAbsence('1', 'reject');
    expect(rejectAbsence).toHaveBeenCalledWith('test-token', '1');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    requestAbsence.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAbsenceMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleAbsenceSubmit({ type: 'vacation' });
    expect(mockShowFeedback).toHaveBeenCalledWith('error', expect.any(String));
  });
});
