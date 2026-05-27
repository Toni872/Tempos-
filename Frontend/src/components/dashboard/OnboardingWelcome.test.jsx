import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingWelcome from './OnboardingWelcome';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const Div = React.forwardRef(function Div({ children, ...props }, ref) {
    const { initial, animate, exit, transition, layoutId, ...rest } = props;
    return React.createElement('div', { ...rest, ref }, children);
  });
  return {
    motion: { div: Div },
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

describe('OnboardingWelcome', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(<OnboardingWelcome isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renderiza las 3 tarjetas de acción', () => {
    render(<OnboardingWelcome isOpen={true} />);
    expect(screen.getByText('Invitar empleados')).toBeInTheDocument();
    expect(screen.getByText('Configurar sedes')).toBeInTheDocument();
    expect(screen.getByText('Ver manual de usuario')).toBeInTheDocument();
  });

  it('renderiza el título de bienvenida', () => {
    render(<OnboardingWelcome isOpen={true} />);
    expect(screen.getByText('¡Bienvenido a Tempos!')).toBeInTheDocument();
  });

  it('llama a onDismiss al hacer clic en "Comenzar"', () => {
    const onDismiss = vi.fn();
    render(<OnboardingWelcome isOpen={true} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Comenzar'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('llama a onAction con la key correcta al hacer clic en una tarjeta', () => {
    const onAction = vi.fn();
    render(<OnboardingWelcome isOpen={true} onAction={onAction} />);

    fireEvent.click(screen.getByText('Invitar empleados'));
    expect(onAction).toHaveBeenCalledWith('employees');

    fireEvent.click(screen.getByText('Ver manual de usuario'));
    expect(onAction).toHaveBeenCalledWith('manual');
  });
});
