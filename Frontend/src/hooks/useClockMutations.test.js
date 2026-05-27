import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClockMutations } from './useClockMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  getActiveFicha: vi.fn(),
  clockIn: vi.fn(),
  clockOut: vi.fn(),
  breakStart: vi.fn(),
  breakEnd: vi.fn(),
}));

import { getClientSession, getActiveFicha, clockIn, clockOut, breakStart, breakEnd } from '@/lib/api';

describe('useClockMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();
  const mockSetClockedIn = vi.fn();
  const mockSetIsOnBreak = vi.fn();
  const mockSetActiveFicha = vi.fn();
  const mockRequestLocation = vi.fn();
  const defaultOptions = {
    showFeedback: mockShowFeedback,
    refreshAllData: mockRefresh,
    setClockedIn: mockSetClockedIn,
    setIsOnBreak: mockSetIsOnBreak,
    setActiveFicha: mockSetActiveFicha,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useClockMutations(defaultOptions));
    expect(typeof result.current.handleClockToggle).toBe('function');
    expect(typeof result.current.handleBreakToggle).toBe('function');
  });

  it('should clock in when not clocked in', async () => {
    clockIn.mockResolvedValue({ data: { id: 'new-ficha' } });
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    await result.current.handleClockToggle({
      requestLocation: mockRequestLocation,
      consentGiven: false,
      requiresGeo: false,
      isCurrentlyClockedIn: false
    });

    expect(clockIn).toHaveBeenCalled();
    expect(mockSetClockedIn).toHaveBeenCalledWith(true);
    expect(mockSetActiveFicha).toHaveBeenCalled();
    expect(mockShowFeedback).toHaveBeenCalledWith('success', 'Turno iniciado.');
  });

  it('should clock out when clocked in', async () => {
    clockOut.mockResolvedValue({});
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    await result.current.handleClockToggle({
      requestLocation: mockRequestLocation,
      consentGiven: false,
      requiresGeo: false,
      isCurrentlyClockedIn: true
    });

    expect(clockOut).toHaveBeenCalled();
    expect(mockSetClockedIn).toHaveBeenCalledWith(false);
    expect(mockSetActiveFicha).toHaveBeenCalledWith(null);
  });

  it('should return requires_consent when geo needed', async () => {
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    const r = await result.current.handleClockToggle({
      requestLocation: mockRequestLocation,
      consentGiven: false,
      requiresGeo: true,
      isCurrentlyClockedIn: false
    });

    expect(r).toBe('requires_consent');
    expect(clockIn).not.toHaveBeenCalled();
  });

  it('should start break', async () => {
    breakStart.mockResolvedValue({});
    getActiveFicha.mockResolvedValue({ id: 'ficha-1' });
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    await result.current.handleBreakToggle({ isCurrentlyOnBreak: false });

    expect(breakStart).toHaveBeenCalled();
    expect(mockSetIsOnBreak).toHaveBeenCalledWith(true);
  });

  it('should end break', async () => {
    breakEnd.mockResolvedValue({});
    getActiveFicha.mockResolvedValue({ id: 'ficha-1' });
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    await result.current.handleBreakToggle({ isCurrentlyOnBreak: true });

    expect(breakEnd).toHaveBeenCalled();
    expect(mockSetIsOnBreak).toHaveBeenCalledWith(false);
  });

  it('should handle errors', async () => {
    clockIn.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useClockMutations(defaultOptions));

    await result.current.handleClockToggle({
      requestLocation: mockRequestLocation,
      consentGiven: false,
      requiresGeo: false,
      isCurrentlyClockedIn: false
    });

    expect(mockShowFeedback).toHaveBeenCalledWith('error', expect.any(String));
  });
});
