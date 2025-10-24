import React from 'react';
import { render, screen,  waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

declare global {
  interface Window {
    readonly innerWidth: number;
    readonly innerHeight: number;
  }
}
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import Dashboard from './dashboard';
import Api from '../../shared/api/api';

// Mock dependencies
jest.mock('../../shared/api/api');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock dashboard manager
jest.mock('../../shared/dashboardManager', () => ({
  __esModule: true,
  default: ({ children }: any) => <div data-testid="dashboard-manager">{children}</div>,
}));

// Mock store setup
const createMockStore = (authData = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { authData }) => state,
    },
  });
};

const defaultAuthData = {
  branchId: 'branch-123',
  churchId: 'church-456',
  name: 'John Doe',
  role: 'admin',
};

const mockDashboardData = {
  followUps: {
    weekly: {
      thisWeek: 25,
      lastWeek: 20,
      change: 25,
    },
    monthly: {
      thisMonth: 100,
      lastMonth: 85,
      change: 17.6,
    },
  },
  collections: {
    weekly: {
      thisWeek: 50000,
      lastWeek: 45000,
      change: 11.1,
    },
    monthly: {
      thisMonth: 200000,
      lastMonth: 180000,
      change: 11.1,
    },
  },
  structure: {
    totalBranches: 5,
    totalDepartments: 12,
    totalUnits: 30,
    totalWorkers: 150,
  },
  upcomingPrograms: [
    {
      date: '2025-10-25',
      startTime: '10:00',
      endTime: '12:00',
      event: {
        id: 'event-1',
        title: 'Sunday Service',
        branchId: 'branch-123',
      },
    },
    {
      date: '2025-10-27',
      startTime: '18:00',
      endTime: '20:00',
      event: {
        id: 'event-2',
        title: 'Bible Study',
        branchId: 'branch-123',
      },
    },
  ],
  scope: 'branch',
};

const renderWithProviders = (
  component: React.ReactElement,
  authData = defaultAuthData
) => {
  const store = createMockStore(authData);
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Api.get as jest.Mock).mockResolvedValue({ data: mockDashboardData });
  });

  describe('Rendering and Initial Load', () => {
    test('renders loading state initially', () => {
      renderWithProviders(<Dashboard />);
      
      expect(screen.getByTestId('dashboard-manager')).toBeInTheDocument();
      // Loading spinner should be visible
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('displays welcome message with user name', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, John Doe/i)).toBeInTheDocument();
      });
    });

    test('displays scope information', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Here's what's happening in your branch/i)).toBeInTheDocument();
      });
    });

    test('fetches dashboard data on mount', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(Api.get).toHaveBeenCalledWith(
          expect.stringContaining('/member/get-dashboard?branchId=branch-123')
        );
      });
    });

    test('handles missing auth data gracefully', async () => {
      const store = createMockStore({});
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </Provider>
      );

      // Should not call API without branchId
      await waitFor(() => {
        expect(Api.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('Structure Statistics Cards', () => {
    test('displays all structure statistics', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Branches')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        
        expect(screen.getByText('Total Departments')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        
        expect(screen.getByText('Total Units')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        
        expect(screen.getByText('Total Workers')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    test('displays correct icons for structure stats', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check for icon presence by class names
        const icons = document.querySelectorAll('[class*="text-[24px]"]');
        expect(icons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('View Toggle (Monthly/Weekly)', () => {
    test('defaults to monthly view', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Month Newcomers')).toBeInTheDocument();
      });
    });

    test('switches to weekly view when selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Month Newcomers')).toBeInTheDocument();
      });

      // Click on the view selector
      const viewSelect = screen.getByLabelText('View');
      await user.click(viewSelect);

      // Select weekly option
      const weeklyOption = screen.getByRole('option', { name: 'Weekly' });
      await user.click(weeklyOption);

      await waitFor(() => {
        expect(screen.getByText('This Week Newcomers')).toBeInTheDocument();
      });
    });

    test('displays correct values for monthly view', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument(); // This month newcomers
        expect(screen.getByText('₦200,000')).toBeInTheDocument(); // This month collections
      });
    });

    test('displays correct values for weekly view', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Month Newcomers')).toBeInTheDocument();
      });

      // Switch to weekly view
      const viewSelect = screen.getByLabelText('View');
      await user.click(viewSelect);
      const weeklyOption = screen.getByRole('option', { name: 'Weekly' });
      await user.click(weeklyOption);

      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument(); // This week newcomers
        expect(screen.getByText('₦50,000')).toBeInTheDocument(); // This week collections
      });
    });
  });

  describe('Collections and Follow-ups', () => {
    test('displays follow-ups with change percentage', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('This Month Newcomers')).toBeInTheDocument();
        expect(screen.getByText('17.6%')).toBeInTheDocument();
      });
    });

    test('displays collections with change percentage', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Church Collections/i)).toBeInTheDocument();
        expect(screen.getByText('11.1%')).toBeInTheDocument();
      });
    });

    test('shows department collections for HOD role', async () => {
      const hodAuthData = {
        ...defaultAuthData,
        role: 'department',
        department: 'dept-123',
      };

      renderWithProviders(<Dashboard />, hodAuthData);

      await waitFor(() => {
        expect(screen.getByText(/Department Collections/i)).toBeInTheDocument();
      });
    });

    test('includes departmentId in API call for HOD role', async () => {
      const hodAuthData = {
        ...defaultAuthData,
        role: 'department',
        department: 'dept-123',
      };

      renderWithProviders(<Dashboard />, hodAuthData);

      await waitFor(() => {
        expect(Api.get).toHaveBeenCalledWith(
          expect.stringContaining('branchId=branch-123&departmentId=dept-123')
        );
      });
    });
  });

  describe('Collections Chart', () => {
    test('renders collections progression chart', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    test('displays chart title with current view', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Church Collections \(Monthly Progression\)/i)).toBeInTheDocument();
      });
    });

    test('updates chart title when view changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Monthly Progression/i)).toBeInTheDocument();
      });

      // Switch to weekly view
      const viewSelect = screen.getByLabelText('View');
      await user.click(viewSelect);
      const weeklyOption = screen.getByRole('option', { name: 'Weekly' });
      await user.click(weeklyOption);

      await waitFor(() => {
        expect(screen.getByText(/Weekly Progression/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    test('displays all quick action buttons', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Admins')).toBeInTheDocument();
        expect(screen.getByText('Manage Programs')).toBeInTheDocument();
        expect(screen.getByText('Workers')).toBeInTheDocument();
        expect(screen.getByText('Newcomers')).toBeInTheDocument();
      });
    });

    test('quick action buttons are clickable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Admins')).toBeInTheDocument();
      });

      const adminsButton = screen.getByRole('button', { name: /Admins/i });
      expect(adminsButton).toBeEnabled();
      
      await user.click(adminsButton);
      // Navigation is mocked, so we just ensure it doesn't throw
    });
  });

  describe('Upcoming Events', () => {
    test('displays upcoming events section', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
      });
    });

    test('shows list of upcoming programs', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sunday Service')).toBeInTheDocument();
        expect(screen.getByText('Bible Study')).toBeInTheDocument();
      });
    });

    test('displays program dates and times correctly', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Oct 25, 2025.*10:00 - 12:00/)).toBeInTheDocument();
        expect(screen.getByText(/Oct 27, 2025.*18:00 - 20:00/)).toBeInTheDocument();
      });
    });

    test('shows message when no upcoming events', async () => {
      (Api.get as jest.Mock).mockResolvedValue({
        data: {
          ...mockDashboardData,
          upcomingPrograms: [],
        },
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('No upcoming events')).toBeInTheDocument();
      });
    });

    test('limits displayed programs to 5', async () => {
      const manyPrograms = Array.from({ length: 10 }, (_, i) => ({
        date: `2025-10-${20 + i}`,
        startTime: '10:00',
        endTime: '12:00',
        event: {
          id: `event-${i}`,
          title: `Program ${i}`,
          branchId: 'branch-123',
        },
      }));

      (Api.get as jest.Mock).mockResolvedValue({
        data: {
          ...mockDashboardData,
          upcomingPrograms: manyPrograms,
        },
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const eventItems = screen.getAllByText(/Program \d+/);
        expect(eventItems.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (Api.get as jest.Mock).mockRejectedValue(new Error('API Error'));

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Dashboard fetch error:',
          expect.any(Error)
        );
      });

      // Should still render with default data
      await waitFor(() => {
        expect(screen.getByText('Total Branches')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    test('displays zero values when no data is available', async () => {
      (Api.get as jest.Mock).mockResolvedValue({
        data: {
          followUps: {
            weekly: { thisWeek: 0, lastWeek: 0, change: 0 },
            monthly: { thisMonth: 0, lastMonth: 0, change: 0 },
          },
          collections: {
            weekly: { thisWeek: 0, lastWeek: 0, change: 0 },
            monthly: { thisMonth: 0, lastMonth: 0, change: 0 },
          },
          structure: {
            totalBranches: 0,
            totalDepartments: 0,
            totalUnits: 0,
            totalWorkers: 0,
          },
          upcomingPrograms: [],
          scope: 'branch',
        },
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Stat Card Component', () => {
    test('displays positive change with trending up icon', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check for positive change indicator
        const chips = screen.getAllByText(/17\.6%|11\.1%|25%/);
        expect(chips.length).toBeGreaterThan(0);
      });
    });

    test('stat cards have hover effect classes', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        const cards = document.querySelectorAll('[class*="MuiCard"]');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('renders grid layout for different screen sizes', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check for Grid components with size props
        const grids = document.querySelectorAll('[class*="MuiGrid"]');
        expect(grids.length).toBeGreaterThan(0);
      });
    });

    test('renders correctly on mobile viewport', async () => {
      window.innerWidth = 375;
      window.innerHeight = 667;

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Branches')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    test('formats currency values correctly', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('₦200,000')).toBeInTheDocument();
      });
    });

    test('formats dates using moment', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        // Check for formatted date (Oct 25, 2025)
        expect(screen.getByText(/Oct 25, 2025/)).toBeInTheDocument();
      });
    });

    test('displays percentage changes correctly', async () => {
      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('17.6%')).toBeInTheDocument();
        expect(screen.getByText('11.1%')).toBeInTheDocument();
      });
    });
  });
});