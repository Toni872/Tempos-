import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardShell from './DashboardShell';

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

vi.mock('@/components/dashboard/ManualUsuarioModal', () => ({
  default: () => null,
}));

describe('DashboardShell', () => {
  const defaultProps = {
    activeTab: 'Inicio',
    setActiveTab: vi.fn(),
    onLogout: vi.fn(),
    profile: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza los children en el área principal', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Test Child</div>
      </DashboardShell>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('renderiza el título del activeTab en el header', () => {
    render(
      <DashboardShell {...defaultProps} activeTab="Equipo">
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByRole('heading', { name: 'Equipo' })).toBeInTheDocument();
  });

  it('renderiza los grupos de navegación del sidebar', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Análisis' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
  });

  it('renderiza items del sidebar', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByRole('button', { name: 'Equipo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GeoMapa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sedes' })).toBeInTheDocument();
  });

  it('llama a setActiveTab al hacer clic en un item del sidebar', () => {
    const setActiveTab = vi.fn();
    render(
      <DashboardShell {...defaultProps} setActiveTab={setActiveTab}>
        <div>Content</div>
      </DashboardShell>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Equipo' }));
    expect(setActiveTab).toHaveBeenCalledWith('Equipo');
  });

  it('renderiza botón MANUAL DE USUARIO', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText('MANUAL DE USUARIO')).toBeInTheDocument();
  });

  it('renderiza el componente UserMenu', () => {
    render(
      <DashboardShell {...defaultProps}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText('Salir')).toBeInTheDocument();
  });

  it('muestra el banner de trial cuando isTrial es true', () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const profile = { isTrial: true, isTrialExpired: false, trialExpiresAt: futureDate };
    render(
      <DashboardShell {...defaultProps} profile={profile}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.getByText('Periodo de Prueba Activo')).toBeInTheDocument();
    expect(screen.getByText('Días restantes')).toBeInTheDocument();
    expect(screen.getByText('Actualizar a Pro')).toBeInTheDocument();
  });

  it('no muestra el banner de trial cuando profile es null', () => {
    render(
      <DashboardShell {...defaultProps} profile={null}>
        <div>Content</div>
      </DashboardShell>
    );
    expect(screen.queryByText('Periodo de Prueba Activo')).not.toBeInTheDocument();
  });
});
