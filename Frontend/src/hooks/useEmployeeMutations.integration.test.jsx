import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { useEmployeeMutations } from './useEmployeeMutations';

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(() => ({ token: 'test-token' })),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  default: { delete: vi.fn() },
}));

function TestForm() {
  const { handleEmployeeSubmit, handleEmployeeDelete } = useEmployeeMutations({
    showFeedback: (type, msg) => {
      document.body.setAttribute('data-feedback-type', type);
      document.body.setAttribute('data-feedback-msg', msg);
    },
    refreshAllData: vi.fn(),
  });

  return (
    <div>
      <button
        onClick={() =>
          handleEmployeeSubmit(
            {
              displayName: 'Test User',
              email: 'test@test.com',
              role: 'employee',
              dni: '12345678Z',
              hourlyRate: '15',
              phone: '',
              workCenterId: '',
              status: 'active',
            },
            'create',
            null,
          )
        }
      >
        Submit Create
      </button>
      <button onClick={() => handleEmployeeDelete({ id: '123', displayName: 'Test' })}>
        Delete Employee
      </button>
    </div>
  );
}

describe('useEmployeeMutations integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.removeAttribute('data-feedback-type');
    document.body.removeAttribute('data-feedback-msg');
    window.confirm = vi.fn(() => true);
  });

  it('should call createEmployee API when submitting a new employee', async () => {
    const { createEmployee } = await import('@/lib/api');
    createEmployee.mockResolvedValue({ message: 'Invitación enviada' });

    render(<TestForm />);

    await act(async () => {
      screen.getByText('Submit Create').click();
    });

    expect(createEmployee).toHaveBeenCalled();
    expect(document.body.getAttribute('data-feedback-type')).toBe('success');
  });

  it('should call delete API when deleting an employee', async () => {
    const api = await import('@/lib/api');
    api.default.delete.mockResolvedValue({});

    render(<TestForm />);

    await act(async () => {
      screen.getByText('Delete Employee').click();
    });

    expect(api.default.delete).toHaveBeenCalled();
    expect(document.body.getAttribute('data-feedback-type')).toBe('success');
  });

  it('should show error feedback on API failure', async () => {
    const { createEmployee } = await import('@/lib/api');
    createEmployee.mockRejectedValue(new Error('API error'));

    render(<TestForm />);

    await act(async () => {
      screen.getByText('Submit Create').click();
    });

    expect(document.body.getAttribute('data-feedback-type')).toBe('error');
  });

  it('should not delete when confirm is cancelled', async () => {
    window.confirm = vi.fn(() => false);
    const api = await import('@/lib/api');

    render(<TestForm />);

    await act(async () => {
      screen.getByText('Delete Employee').click();
    });

    expect(api.default.delete).not.toHaveBeenCalled();
  });
});
