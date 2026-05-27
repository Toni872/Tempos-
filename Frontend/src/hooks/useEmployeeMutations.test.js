import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmployeeMutations } from './useEmployeeMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  default: { delete: vi.fn() },
}));

import { getClientSession, createEmployee, updateEmployee } from '@/lib/api';
import api from '@/lib/api';

describe('useEmployeeMutations', () => {
  const mockShowFeedback = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getClientSession.mockReturnValue({ token: 'test-token' });
  });

  it('should return mutation handlers', () => {
    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));
    expect(typeof result.current.handleEmployeeSubmit).toBe('function');
    expect(typeof result.current.handleEmployeeDelete).toBe('function');
  });

  it('should call createEmployee on submit (create mode)', async () => {
    createEmployee.mockResolvedValue({ message: 'Creado' });
    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleEmployeeSubmit(
      { displayName: 'Test', email: 'test@test.com', role: 'employee', dni: '12345678', hourlyRate: '10', status: 'active' },
      'create',
      null
    );

    expect(createEmployee).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should call updateEmployee on submit (edit mode)', async () => {
    updateEmployee.mockResolvedValue({});
    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleEmployeeSubmit(
      { displayName: 'Test', email: 'test@test.com', role: 'employee', dni: '12345678', hourlyRate: '10', status: 'active' },
      'edit',
      { id: '123' }
    );

    expect(updateEmployee).toHaveBeenCalledWith('test-token', '123', expect.any(Object));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should show error on validation failure', async () => {
    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleEmployeeSubmit(
      { displayName: 'AB', email: 'bad', role: 'invalid', dni: '123', hourlyRate: '-1', status: 'active' },
      'create',
      null
    );

    expect(mockShowFeedback).toHaveBeenCalledWith('error', expect.any(String));
  });

  it('should call delete on handleEmployeeDelete', async () => {
    api.delete.mockResolvedValue({});
    window.confirm = vi.fn(() => true);

    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleEmployeeDelete({ id: '123', displayName: 'Test' });

    expect(api.delete).toHaveBeenCalledWith('/api/v1/employees/123', expect.any(Object));
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should not delete if confirm is false', async () => {
    window.confirm = vi.fn(() => false);

    const { result } = renderHook(() => useEmployeeMutations({
      showFeedback: mockShowFeedback,
      refreshAllData: mockRefresh
    }));

    await result.current.handleEmployeeDelete({ id: '123' });

    expect(api.delete).not.toHaveBeenCalled();
  });
});
