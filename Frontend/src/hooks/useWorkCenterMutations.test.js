import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWorkCenterMutations } from './useWorkCenterMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  default: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { getClientSession } from '@/lib/api';
import api from '@/lib/api';

describe('useWorkCenterMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useWorkCenterMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));
    expect(typeof result.current.handleWorkCenterSubmit).toBe('function');
    expect(typeof result.current.handleWorkCenterDelete).toBe('function');
  });

  it('should call api.post on submit (create)', async () => {
    api.post.mockResolvedValue({});
    const { result } = renderHook(() => useWorkCenterMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleWorkCenterSubmit({ name: 'Test' }, 'create', null);
    expect(api.post).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call api.put on submit (edit)', async () => {
    api.put.mockResolvedValue({});
    const { result } = renderHook(() => useWorkCenterMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleWorkCenterSubmit({ name: 'Test' }, 'edit', { id: '1' });
    expect(api.put).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call api.delete on delete (with confirm)', async () => {
    api.delete.mockResolvedValue({});
    window.confirm = vi.fn(() => true);
    const { result } = renderHook(() => useWorkCenterMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleWorkCenterDelete({ id: '1', name: 'Test' });
    expect(api.delete).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not delete if confirm is false', async () => {
    window.confirm = vi.fn(() => false);
    const { result } = renderHook(() => useWorkCenterMutations({ 
      showFeedback: mockShowFeedback, 
      refreshAllData: mockRefresh 
    }));

    await result.current.handleWorkCenterDelete({ id: '1' });
    expect(api.delete).not.toHaveBeenCalled();
  });
});
