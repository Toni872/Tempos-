import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScheduleMutations } from './useScheduleMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  createSchedule: vi.fn(),
  assignShift: vi.fn(),
  default: { put: vi.fn(), delete: vi.fn() },
}));

import { getClientSession, createSchedule, assignShift } from '@/lib/api';
import api from '@/lib/api';

describe('useScheduleMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));
    expect(typeof result.current.handleScheduleSubmit).toBe('function');
    expect(typeof result.current.handleScheduleDelete).toBe('function');
    expect(typeof result.current.handleAssignShift).toBe('function');
  });

  it('should call createSchedule on submit (create)', async () => {
    createSchedule.mockResolvedValue({});
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleScheduleSubmit({ name: 'Test' }, 'create', null);
    expect(createSchedule).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call api.put on submit (edit)', async () => {
    api.put.mockResolvedValue({});
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleScheduleSubmit({ name: 'Test' }, 'edit', { id: '1' });
    expect(api.put).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call assignShift', async () => {
    assignShift.mockResolvedValue({});
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleAssignShift({ userId: '1', scheduleId: '2' });
    expect(assignShift).toHaveBeenCalledWith('test-token', { userId: '1', scheduleId: '2' });
  });

  it('should call api.delete on delete (with confirm)', async () => {
    api.delete.mockResolvedValue({});
    window.confirm = vi.fn(() => true);
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleScheduleDelete({ id: '1', name: 'Test' });
    expect(api.delete).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not delete if confirm is false', async () => {
    window.confirm = vi.fn(() => false);
    const { result } = renderHook(() => useScheduleMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleScheduleDelete({ id: '1' });
    expect(api.delete).not.toHaveBeenCalled();
  });
});
