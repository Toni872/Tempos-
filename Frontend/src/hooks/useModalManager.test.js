import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalManager } from './useModalManager';

describe('useModalManager', () => {
  it('should start with default state', () => {
    const { result } = renderHook(() => useModalManager());

    expect(result.current.modal).toBeNull();
    expect(result.current.modalMode).toBe('create');
    expect(result.current.modalData).toBeNull();
    expect(result.current.auditModalOpen).toBe(false);
    expect(result.current.showGeolocationConsent).toBe(false);
    expect(result.current.selectedEmployee).toBeNull();
    expect(result.current.hasAcceptedLocal).toBe(false);
  });

  it('should open and close a modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openModal('employee', 'edit', { id: '1', name: 'Test' }));

    expect(result.current.modal).toBe('employee');
    expect(result.current.modalMode).toBe('edit');
    expect(result.current.modalData).toEqual({ id: '1', name: 'Test' });

    act(() => result.current.closeModal());

    expect(result.current.modal).toBeNull();
    expect(result.current.modalData).toBeNull();
  });

  it('should open modal with default create mode', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openModal('employee'));

    expect(result.current.modal).toBe('employee');
    expect(result.current.modalMode).toBe('create');
  });

  it('should handle audit modal', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openAudit('ficha-123'));

    expect(result.current.auditModalOpen).toBe(true);
    expect(result.current.selectedAuditFichaId).toBe('ficha-123');

    act(() => result.current.closeAudit());

    expect(result.current.auditModalOpen).toBe(false);
    expect(result.current.selectedAuditFichaId).toBeNull();
  });

  it('should handle geolocation consent', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.setGeolocationConsent(true));
    expect(result.current.showGeolocationConsent).toBe(true);

    act(() => result.current.setGeolocationMode('revoke'));
    expect(result.current.geolocationModalMode).toBe('revoke');

    act(() => result.current.setGeolocationConsent(false));
    expect(result.current.showGeolocationConsent).toBe(false);
  });

  it('should handle selected employee', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.setSelectedEmployee({ id: '1' }));
    expect(result.current.selectedEmployee).toEqual({ id: '1' });

    act(() => result.current.setSelectedEmployee(null));
    expect(result.current.selectedEmployee).toBeNull();
  });

  it('should handle terms acceptance', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.setAcceptedTerms(true));
    expect(result.current.hasAcceptedLocal).toBe(true);

    act(() => result.current.setAcceptedTerms(false));
    expect(result.current.hasAcceptedLocal).toBe(false);
  });

  it('should reset all modal state', () => {
    const { result } = renderHook(() => useModalManager());

    act(() => result.current.openModal('employee', 'edit', { id: '1' }));
    act(() => result.current.openAudit('ficha-123'));

    act(() => result.current.resetModals());

    expect(result.current.modal).toBeNull();
    expect(result.current.modalMode).toBe('create');
    expect(result.current.auditModalOpen).toBe(false);
  });
});
