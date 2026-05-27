import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { useModalManager } from './useModalManager';

function TestModal() {
  const mm = useModalManager();
  return (
    <div>
      <button onClick={() => mm.openModal('test_modal')}>Open Modal</button>
      <button onClick={() => mm.closeModal()}>Close Modal</button>
      <button onClick={() => mm.openModal('edit_modal', 'edit', { id: 1 })}>Open Edit</button>

      {mm.modal && (
        <div data-testid="modal-overlay">
          <div data-testid="modal-title">{mm.modal}</div>
          <div data-testid="modal-mode">{mm.modalMode}</div>
          {mm.modalData && <div data-testid="modal-data">{JSON.stringify(mm.modalData)}</div>}
          <button onClick={mm.closeModal}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

describe('useModalManager integration', () => {
  it('should open and display modal when openModal is called', () => {
    render(<TestModal />);

    act(() => {
      screen.getByText('Open Modal').click();
    });

    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('modal-title')).toHaveTextContent('test_modal');
    expect(screen.getByTestId('modal-mode')).toHaveTextContent('create');
  });

  it('should close modal when closeModal is called', () => {
    render(<TestModal />);

    act(() => {
      screen.getByText('Open Modal').click();
    });
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();

    act(() => {
      screen.getByText('Close Modal').click();
    });
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  it('should pass mode and data correctly', () => {
    render(<TestModal />);

    act(() => {
      screen.getByText('Open Edit').click();
    });

    expect(screen.getByTestId('modal-mode')).toHaveTextContent('edit');
    expect(screen.getByTestId('modal-data')).toHaveTextContent('{"id":1}');
  });

  it('should handle audit modal state', () => {
    function AuditTest() {
      const mm = useModalManager();
      return (
        <div>
          <button onClick={() => mm.openAudit('ficha-42')}>View Audit</button>
          {mm.auditModalOpen && <div data-testid="audit-modal">Audit: {mm.selectedAuditFichaId}</div>}
          {mm.auditModalOpen && <button onClick={mm.closeAudit}>Close Audit</button>}
        </div>
      );
    }

    render(<AuditTest />);

    act(() => screen.getByText('View Audit').click());
    expect(screen.getByTestId('audit-modal')).toHaveTextContent('Audit: ficha-42');

    act(() => screen.getByText('Close Audit').click());
    expect(screen.queryByTestId('audit-modal')).not.toBeInTheDocument();
  });
});
