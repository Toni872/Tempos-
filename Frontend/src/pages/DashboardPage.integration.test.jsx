import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const mockUseDashboardData = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: mockUseDashboardData,
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@/lib/api', () => ({
  getClientSession: vi.fn(() => ({ token: 'test-token' })),
  acceptTerms: vi.fn(),
  clockIn: vi.fn(),
  clockOut: vi.fn(),
}));

vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    location: null,
    error: null,
    loading: false,
    consentGiven: false,
    requestLocation: vi.fn(),
    revokeConsent: vi.fn(),
  }),
}));

vi.mock('@/hooks/useClockTimer', () => ({
  useClockTimer: () => '00:00:00',
}));

vi.mock('@/hooks/useAutoClock', () => ({
  useAutoClock: () => ({
    autoClockStatus: null,
    lastCheck: null,
    nearestCenter: null,
    distanceMeters: null,
  }),
}));

vi.mock('@/components/dashboard/DashboardShell', () => ({
  default: ({ children }) => <div data-testid="dashboard-shell">{children}</div>,
}));

vi.mock('@/components/dashboard/HomeHub', () => ({
  default: () => <div>HomeHub</div>,
}));

vi.mock('@/components/dashboard/EmployeeTab', () => ({
  default: () => <div>EmployeeTab</div>,
}));

vi.mock('@/components/dashboard/SedesTab', () => ({
  default: () => <div>SedesTab</div>,
}));

vi.mock('@/components/dashboard/Loader', () => ({
  default: () => <div>Loading...</div>,
}));

vi.mock('@/components/dashboard/Error', () => ({
  default: ({ message }) => <div>{message}</div>,
}));

vi.mock('@/components/dashboard/QuickClock', () => ({
  default: () => <div>QuickClock</div>,
}));

vi.mock('@/components/dashboard/ModalBase', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/components/dashboard/EmployeeDashboard', () => ({
  default: () => <div>EmployeeDashboard</div>,
}));

vi.mock('@/components/dashboard/MobileQuickClock', () => ({
  default: () => <div>MobileQuickClock</div>,
}));

const defaultDashboardData = {
  profile: { role: 'admin', email: 'admin@test.com', displayName: 'Admin' },
  setProfile: vi.fn(),
  activeFicha: null,
  setActiveFicha: vi.fn(),
  clockedIn: false,
  setClockedIn: vi.fn(),
  isOnBreak: false,
  setIsOnBreak: vi.fn(),
  employees: [],
  setEmployees: vi.fn(),
  documents: [],
  setDocuments: vi.fn(),
  absences: [],
  setAbsences: vi.fn(),
  registros: [],
  setRegistros: vi.fn(),
  workCenters: [],
  setWorkCenters: vi.fn(),
  dashboardStats: null,
  setDashboardStats: vi.fn(),
  schedules: [],
  setSchedules: vi.fn(),
  shiftAssignments: [],
  setShiftAssignments: vi.fn(),
  loading: false,
  setLoading: vi.fn(),
  isTrialExpired: false,
  loadData: vi.fn(),
  handleLogout: vi.fn(),
};

import DashboardPage from './DashboardPage';

describe('DashboardPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDashboardData.mockReturnValue(defaultDashboardData);
  });

  it('should render admin dashboard without crashing', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument();
  });

  it('should render Loader when data is loading', () => {
    mockUseDashboardData.mockReturnValueOnce({
      ...defaultDashboardData,
      profile: null,
      loading: true,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render employee view for non-admin users', () => {
    mockUseDashboardData.mockReturnValueOnce({
      ...defaultDashboardData,
      profile: { role: 'employee', email: 'emp@test.com', displayName: 'Employee' },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('EmployeeDashboard')).toBeInTheDocument();
  });
});
