import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboardData } from './useDashboardData';

/**
 * Mocks centralizados con vi.hoisted para tener las referencias
 * disponibles antes de que se ejecuten los vi.mock.
 * 
 * IMPORTANTE: getClientSession se importa desde @/lib/api (re-export
 * desde ./api/session), por eso mockeamos @/lib/api completo.
 * 
 * useNavigate DEBE devolver una función (vi.fn()) o handleLogout
 * explota y eso propaga la excepción fuera de loadData, evitando
 * que setLoading(false) se ejecute.
 */
const mocks = vi.hoisted(() => ({
  getClientSession: vi.fn().mockReturnValue({ token: 'test-token' }),
  getMe: vi.fn().mockResolvedValue({ role: 'admin', name: 'Test Admin', isTrialExpired: false }),
  getActiveFicha: vi.fn().mockResolvedValue(null),
  listDocuments: vi.fn().mockResolvedValue([]),
  listAbsences: vi.fn().mockResolvedValue([]),
  listFichas: vi.fn().mockResolvedValue([]),
  getDashboardStats: vi.fn().mockResolvedValue({ metrics: {} }),
  listEmployees: vi.fn().mockResolvedValue({ data: [] }),
  listWorkCenters: vi.fn().mockResolvedValue([]),
  listSchedules: vi.fn().mockResolvedValue([]),
  listShiftAssignments: vi.fn().mockResolvedValue([]),
  clearClientSession: vi.fn(),
  navigate: vi.fn(),
}));

// Mock completo del módulo @/lib/api
vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getClientSession: mocks.getClientSession,
  getMe: mocks.getMe,
  getActiveFicha: mocks.getActiveFicha,
  listDocuments: mocks.listDocuments,
  listAbsences: mocks.listAbsences,
  listFichas: mocks.listFichas,
  getDashboardStats: mocks.getDashboardStats,
  listEmployees: mocks.listEmployees,
  listWorkCenters: mocks.listWorkCenters,
  listSchedules: mocks.listSchedules,
  listShiftAssignments: mocks.listShiftAssignments,
  clearClientSession: mocks.clearClientSession,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

describe('useDashboardData', () => {
  /**
   * Objeto ESTABLE para registrosFilters.
   * Si pasamos {} literal, en cada re-render se crea un nuevo objeto,
   * lo que cambia la referencia, recrea loadData (useCallback), y
   * causa un loop infinito de useEffect → setState → re-render.
   */
  const stableFilters = Object.freeze({});

  beforeEach(() => {
    vi.clearAllMocks();
    // Restaurar valores default después del clearAllMocks
    mocks.getClientSession.mockReturnValue({ token: 'test-token' });
    mocks.getMe.mockResolvedValue({ role: 'admin', name: 'Test Admin', isTrialExpired: false });
    mocks.getActiveFicha.mockResolvedValue(null);
    mocks.listDocuments.mockResolvedValue([]);
    mocks.listAbsences.mockResolvedValue([]);
    mocks.listFichas.mockResolvedValue([]);
    mocks.getDashboardStats.mockResolvedValue({ metrics: {} });
    mocks.listEmployees.mockResolvedValue({ data: [] });
    mocks.listWorkCenters.mockResolvedValue([]);
    mocks.listSchedules.mockResolvedValue([]);
    mocks.listShiftAssignments.mockResolvedValue([]);
  });

  it('debería cargar datos core (profile + activeFicha) al montar', async () => {
    const { result } = renderHook(() => useDashboardData(stableFilters));

    // Inicialmente está cargando
    expect(result.current.loading).toBe(true);

    // Esperar a que termine
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.getClientSession).toHaveBeenCalled();
    expect(mocks.getMe).toHaveBeenCalledWith('test-token');
    expect(mocks.getActiveFicha).toHaveBeenCalledWith('test-token');
    expect(result.current.profile).toEqual({ role: 'admin', name: 'Test Admin', isTrialExpired: false });
    expect(result.current.activeFicha).toBeNull();
    expect(result.current.clockedIn).toBe(false);
  });

  it('no debería cargar datos si no hay token de sesión', async () => {
    mocks.getClientSession.mockReturnValue(null);

    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.getMe).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
  });

  it('debería cargar datos de admin (employees, workCenters, schedules, stats) para admin user', async () => {
    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.listEmployees).toHaveBeenCalled();
    expect(mocks.listWorkCenters).toHaveBeenCalled();
    expect(mocks.listSchedules).toHaveBeenCalled();
    expect(mocks.listShiftAssignments).toHaveBeenCalled();
    expect(mocks.getDashboardStats).toHaveBeenCalled();
  });

  it('debería manejar 401 haciendo logout (clearClientSession + navigate)', async () => {
    mocks.getMe.mockRejectedValue({ status: 401 });

    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mocks.clearClientSession).toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('debería manejar errores soft gracefulmente (fallos individuales de API)', async () => {
    // getActiveFicha: error capturado por try/catch en el hook (linea 81)
    mocks.getActiveFicha.mockRejectedValue(new Error('Network error'));
    // listEmployees: error capturado por safeCall (linea 92-99)
    mocks.listEmployees.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Profile cargado (getMe no falló)
    expect(result.current.profile).toBeTruthy();
    // Employees = [] (safeCall capturó el error, data.emp no existe)
    expect(result.current.employees).toEqual([]);
    // activeFicha = null (try/catch capturó)
    expect(result.current.activeFicha).toBeNull();
  });

  it('debería marcar trial como expirado cuando backend responde con isTrialExpired: true', async () => {
    mocks.getMe.mockResolvedValue({ role: 'admin', name: 'Tester', isTrialExpired: true });

    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isTrialExpired).toBe(true);
  });

  it('debería refrescar datos al llamar loadData("all") manualmente', async () => {
    const { result } = renderHook(() => useDashboardData(stableFilters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Resetear contadores
    vi.clearAllMocks();
    // Restaurar mocks después del clear
    mocks.getClientSession.mockReturnValue({ token: 'test-token' });
    mocks.getMe.mockResolvedValue({ role: 'admin', name: 'Test Admin', isTrialExpired: false });
    mocks.listEmployees.mockResolvedValue({ data: [] });

    await act(async () => {
      await result.current.loadData('all');
    });

    expect(mocks.getMe).toHaveBeenCalled();
    expect(mocks.listEmployees).toHaveBeenCalled();
  });
});
