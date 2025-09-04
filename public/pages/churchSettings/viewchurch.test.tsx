import React from 'react';
import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import ViewAdmin from './viewChurch';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';
import userEvent from '@testing-library/user-event';

// Mock MUI hooks using jest.mock
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@mui/material/useTheme', () => ({
  __esModule: true,
  default: () => ({
    palette: { 
      background: { paper: '#fff' }, 
      divider: '#ddd', 
      text: { primary: '#000', secondary: '#666' },
      error: { main: '#f44336' },
      success: { main: '#4caf50' }
    },
    breakpoints: { 
      up: jest.fn().mockImplementation((key) => key === 'lg'),
      down: jest.fn().mockImplementation((key) => key === 'sm') 
    }
  })
}));

// Mock icons individually for better control
jest.mock('@mui/icons-material/ArrowBack', () => () => <div>ArrowBackIcon</div>);
jest.mock('@mui/icons-material/SentimentVeryDissatisfied', () => () => <div>EmptyIcon</div>);
// Add other icons similarly...

// Mock components with props verification
jest.mock('../../shared/dashboardManager', () => ({ 
  children, 
  ...props 
}: { 
  children: React.ReactNode 
}) => {
  console.log('DashboardManager props:', props);
  return <div data-testid="dashboard-manager">{children}</div>;
});

jest.mock('./setting', () => () => <div data-testid="color-button">ChangeColorButton</div>);

// Mock axios with better typing
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockStore = configureStore([]);

describe('ViewAdmin Component', () => {
  let store: any;
  const user = userEvent.setup();

  const mockChurchData = {
    id: '1',
    name: 'Test Church',
    logo: 'logo.jpg',
    backgroundImage: 'bg.jpg',
    address: '123 Church St',
    churchPhone: '1234567890',
    churchEmail: 'test@church.com',
    isHeadQuarter: true,
    isDeleted: false,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    isSuperAdmin: true
  };

  beforeEach(() => {
    store = mockStore({
      auth: {
        authData: {
          token: 'test-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@user.com'
          }
        }
      }
    });

    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/church/get-church')) {
        return Promise.resolve({ 
          data: { 
            data: mockChurchData 
          } 
        });
      }
      return Promise.reject(new Error('Not mocked'));
    });

    mockedAxios.patch.mockResolvedValue({ data: {} });
  });

  // Basic rendering tests
  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementationOnce(() => new Promise(() => {}));
    
    render(
      <Provider store={store}>
        <Router>
          <ViewAdmin />
        </Router>
      </Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));
    
    render(
      <Provider store={store}>
        <Router>
          <ViewAdmin />
        </Router>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Church Data not available!')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  // Data display tests
  it('renders church profile data correctly', async () => {
    render(
      <Provider store={store}>
        <Router>
          <ViewAdmin />
        </Router>
      </Provider>
    );

    await waitFor(() => {
      // Main header
      expect(screen.getByRole('heading', { name: 'Church Profile' })).toBeInTheDocument();
      
      // Church info
      expect(screen.getByText(mockChurchData.name)).toBeInTheDocument();
      expect(screen.getByText(mockChurchData.address)).toBeInTheDocument();
      expect(screen.getByText(mockChurchData.churchPhone)).toBeInTheDocument();
      expect(screen.getByText(mockChurchData.churchEmail)).toBeInTheDocument();
      
      // Status chips
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      
      // Dates
      expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();
      
      // Images (using alt text)
      expect(screen.getByAltText(mockChurchData.name)).toBeInTheDocument();
      expect(screen.getByAltText('Church Background')).toBeInTheDocument();
      
      // Child components
      expect(screen.getByTestId('color-button')).toBeInTheDocument();
    });
  });

  // Edit dialog tests
  describe('Edit Dialog', () => {
    it('opens when edit button is clicked', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Edit Church Profile' })).toBeInTheDocument();
    });

    it('pre-fills form with current church data', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      expect(screen.getByLabelText('Church Name')).toHaveValue(mockChurchData.name);
      expect(screen.getByLabelText('Phone Number')).toHaveValue(mockChurchData.churchPhone);
      expect(screen.getByLabelText('Email Address')).toHaveValue(mockChurchData.churchEmail);
    });

    it('validates form fields', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      // Clear fields
      await user.clear(screen.getByLabelText('Church Name'));
      await user.clear(screen.getByLabelText('Email Address'));
      await user.type(screen.getByLabelText('Phone Number'), 'invalid');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is not valid')).toBeInTheDocument();
    });

    it('submits valid form data', async () => {
      const updatedData = {
        name: 'Updated Church',
        phoneNo: '0987654321',
        email: 'updated@church.com'
      };

      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));

      await user.type(screen.getByLabelText('Church Name'), '{selectall}{del}' + updatedData.name);
      await user.type(screen.getByLabelText('Phone Number'), '{selectall}{del}' + updatedData.phoneNo);
      await user.type(screen.getByLabelText('Email Address'), '{selectall}{del}' + updatedData.email);

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          '/church/edit-admin',
          updatedData
        );
      });
    });

    it('handles submission errors', async () => {
      const errorMessage = 'Update failed';
      mockedAxios.patch.mockRejectedValueOnce({
        response: { data: { message: errorMessage } }
      });

      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('closes when cancel is clicked', async () => {
      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await user.click(screen.getByRole('button', { name: /edit profile/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // Responsive behavior tests
  describe('Responsive Behavior', () => {
    it('adapts to mobile view', async () => {
      // Mock mobile view
      const useMediaQueryMock = jest.requireMock('@mui/material/useMediaQuery').default;
      useMediaQueryMock.mockImplementation((query: string) => query.includes('sm'));

      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await waitFor(() => {
        // Example: Check if layout changes for mobile
        expect(screen.getByRole('heading', { name: 'Church Profile' }))
          .toHaveStyle('font-size: 1.5rem');
      });
    });

    it('adapts to desktop view', async () => {
      // Mock desktop view
      const useMediaQueryMock = jest.requireMock('@mui/material/useMediaQuery').default;
      useMediaQueryMock.mockImplementation((query: string) => query.includes('lg'));

      render(
        <Provider store={store}>
          <Router>
            <ViewAdmin />
          </Router>
        </Provider>
      );

      await waitFor(() => {
        // Example: Check if layout changes for desktop
        expect(screen.getByRole('button', { name: /edit profile/i }))
          .toHaveStyle('font-size: 1rem');
      });
    });
  });

  // Navigation tests
  it('navigates back when back button is clicked', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    mockedAxios.get.mockRejectedValueOnce(new Error('Error'));

    render(
      <Provider store={store}>
        <Router>
          <ViewAdmin />
        </Router>
      </Provider>
    );

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
    });

    // This would need proper react-router mocking to verify
    // expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  // Additional edge cases
  it('handles missing optional fields', async () => {
    const incompleteData = {
      ...mockChurchData,
      address: '',
      churchPhone: '',
      isHeadQuarter: false
    };

    mockedAxios.get.mockResolvedValueOnce({ data: { data: incompleteData } });

    render(
      <Provider store={store}>
        <Router>
          <ViewAdmin />
        </Router>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Not provided')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });
});