import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFichaMutations } from './useFichaMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  default: { put: vi.fn(), post: vi.fn() },
}));

import { getClientSession } from '@/lib/api';
import api from '@/lib/api';

describe('useFichaMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return all three handlers', () => {
    const { result } = renderHook(() => useFichaMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    expect(typeof result.current.handleFichaSubmit).toBe('function');
    expect(typeof result.current.handleCorrectionSubmit).toBe('function');
    expect(typeof result.current.handleReviewCorrection).toBe('function');
  });

  it('should call api.put on ficha submit (edit)', async () => {
    api.put.mockResolvedValue({});
    const { result } = renderHook(() => useFichaMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleFichaSubmit({ startTime: '09:00' }, 'edit', { id: '1' });
    expect(api.put).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call api.post on correction submit', async () => {
    api.post.mockResolvedValue({});
    const { result } = renderHook(() => useFichaMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleCorrectionSubmit({ reason: 'error' }, 'create', { id: '1' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/fichas/1/request-correction', { reason: 'error' }, expect.any(Object));
  });

  it('should call api.post on review correction', async () => {
    api.post.mockResolvedValue({});
    const { result } = renderHook(() => useFichaMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleReviewCorrection('approved', 'Looks good', { id: '1' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/fichas/1/review-correction', { decision: 'approved', comment: 'Looks good' }, expect.any(Object));
  });

  it('should handle errors', async () => {
    api.put.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useFichaMutations({ showFeedback: mockShowFeedback, refreshAllData: mockRefresh }));
    await result.current.handleFichaSubmit({}, 'edit', { id: '1' });
    expect(mockShowFeedback).toHaveBeenCalledWith('error', expect.any(String));
  });
});
