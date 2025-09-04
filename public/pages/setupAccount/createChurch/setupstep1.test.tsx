import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../../../reduxstore/redux';
import SetupChurch from './setupstep1';
import { setChurchData } from '../../../reduxstore/datamanager';

// Mock react-icons
jest.mock('react-icons/io5', () => ({
  IoCallOutline: () => <span>CallIcon</span>,
  IoMailOutline: () => <span>MailIcon</span>,
  IoLocationOutline: () => <span>LocationIcon</span>,
}));

jest.mock('react-icons/pi', () => ({
  PiChurchLight: () => <span>ChurchIcon</span>,
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: jest.fn().mockImplementation(({ children }) => children),
}));

describe('SetupChurch Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders the form with all fields', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Set Up Your Church')).toBeInTheDocument();
    expect(screen.getByLabelText('Name of Church')).toBeInTheDocument();
    expect(screen.getByLabelText('Email of Church (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number of Church')).toBeInTheDocument();
    expect(screen.getByLabelText('Church Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Does your church have branches?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  test('handles input changes correctly', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    const churchNameInput = screen.getByPlaceholderText('Enter the name of your church');
    fireEvent.change(churchNameInput, { target: { value: 'Test Church' } });
    expect(churchNameInput).toHaveValue('Test Church');

    const phoneInput = screen.getByPlaceholderText('Enter the phone number of your church');
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    expect(phoneInput).toHaveValue('1234567890');
  });

  test('validates form before submission', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Church name is required')).toBeInTheDocument();
    });
  });

  test('submits form successfully with valid data', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Enter the name of your church'), {
      target: { value: 'Test Church' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter the phone number of your church'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter the location of your church'), {
      target: { value: 'Test Location' },
    });
    fireEvent.change(screen.getByLabelText('Does your church have branches?'), {
      target: { value: 'true' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(setChurchData).toHaveBeenCalledWith({
        churchName: 'Test Church',
        churchEmail: '',
        churchPhone: '1234567890',
        churchLocation: 'Test Location',
        isHeadquarter: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/setup-logo');
    });
  });

  test('shows loading state during submission', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    // Fill out required fields
    fireEvent.change(screen.getByPlaceholderText('Enter the name of your church'), {
      target: { value: 'Test Church' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter the phone number of your church'), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter the location of your church'), {
      target: { value: 'Test Location' },
    });
    fireEvent.change(screen.getByLabelText('Does your church have branches?'), {
      target: { value: 'false' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Continuing...')).toBeInTheDocument();
  });

  test('allows dismissing error messages', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    // Trigger validation error
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByText('Church name is required')).toBeInTheDocument();
    });

    // Dismiss error
    fireEvent.click(screen.getByRole('button', { name: 'Close error message' }));
    expect(screen.queryByText('Church name is required')).not.toBeInTheDocument();
  });
});