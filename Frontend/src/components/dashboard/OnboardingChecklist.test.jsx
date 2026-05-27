import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OnboardingChecklist from './OnboardingChecklist';

describe('OnboardingChecklist', () => {
  const allFalse = {
    employees: false,
    workCenters: false,
    schedules: false,
    clock: false,
  };

  it('no renderiza nada cuando todos los pasos están completos', () => {
    const allDone = { employees: true, workCenters: true, schedules: true, clock: true };
    const { container } = render(<OnboardingChecklist steps={allDone} />);
    expect(container.innerHTML).toBe('');
  });

  it('renderiza el título y contador de progreso', () => {
    render(<OnboardingChecklist steps={allFalse} />);
    expect(screen.getByText('Primeros pasos')).toBeInTheDocument();
    expect(screen.getByText('0/4')).toBeInTheDocument();
  });

  it('renderiza los 4 pasos con sus etiquetas', () => {
    render(<OnboardingChecklist steps={allFalse} />);
    expect(screen.getByText('Crear primer empleado')).toBeInTheDocument();
    expect(screen.getByText('Configurar centro de trabajo')).toBeInTheDocument();
    expect(screen.getByText('Definir horarios')).toBeInTheDocument();
    expect(screen.getByText('Hacer un fichaje de prueba')).toBeInTheDocument();
  });

  it('muestra el progreso correcto con 2 pasos completados', () => {
    const halfDone = { employees: true, workCenters: true, schedules: false, clock: false };
    render(<OnboardingChecklist steps={halfDone} />);
    expect(screen.getByText('2/4')).toBeInTheDocument();
  });

  it('marca pasos completados con line-through', () => {
    const oneDone = { employees: true, workCenters: false, schedules: false, clock: false };
    render(<OnboardingChecklist steps={oneDone} />);
    expect(screen.getByText('Crear primer empleado')).toHaveClass('line-through');
    expect(screen.getByText('Configurar centro de trabajo')).not.toHaveClass('line-through');
  });

  it('llama a onNavigate con la pestaña correcta al hacer clic', () => {
    const onNavigate = vi.fn();
    render(<OnboardingChecklist steps={allFalse} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText('Crear primer empleado'));
    expect(onNavigate).toHaveBeenCalledWith('Equipo');

    fireEvent.click(screen.getByText('Definir horarios'));
    expect(onNavigate).toHaveBeenCalledWith('Horarios');
  });
});
