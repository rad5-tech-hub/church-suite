import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MembersCountDialogue, { MembersCountDialogueProps } from '../programs/memberAttendance';
import Api from '../../../shared/api/api';
import { showPageToast } from '../../../util/pageToast';

// Mock dependencies
jest.mock('../../../shared/api/api');
jest.mock('../../../util/pageToast', () => ({
  showPageToast: jest.fn(),
}));
jest.mock('../../../hooks/usePageToast', () => jest.fn());

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    auth: (state = { authData: { role: 'admin' } }) => state,
  },
});

// Mock API response
const mockEventResponse = {
  data: {
    message: 'Success',
    eventOccurrence: {
      id: '1',
      eventId: 'event-123',
      date: '2025-10-10',
      startTime: '10:00',
      endTime: '12:00',
      isCancelled: false,
      hasAttendance: false,
      dayOfWeek: 'Friday',
      createdAt: '2025-10-01',
      updatedAt: '2025-10-01',
      attendances: [],
      assignedDepartments: [],
      event: { id: 'event-123', title: 'Test Event' },
    },
  },
};

describe('MembersCountDialogue', () => {
  const defaultProps: MembersCountDialogueProps = {
    eventId: 'event-123',
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Api.get as jest.Mock).mockResolvedValue(mockEventResponse);
  });

  it('renders loading state when fetching data', () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when API call fails', async () => {
    (Api.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch event data'));
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch event data')).toBeInTheDocument();
      expect(showPageToast).toHaveBeenCalledWith('Failed to fetch event data', 'error');
    });
  });

  it('renders restricted message for department role', async () => {
    const departmentStore = configureStore({
      reducer: {
        auth: () => ({ authData: { role: 'department' } }),
      },
    });

    render(
      <Provider store={departmentStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Members Count')).toBeInTheDocument();
      expect(
        screen.getByText('Attendance recording is not available for department role.')
      ).toBeInTheDocument();
    });
  });

  it('renders form with input fields for admin role', async () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Members Count')).toBeInTheDocument();
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
      expect(screen.getByText('Men')).toBeInTheDocument();
      expect(screen.getByText('Women')).toBeInTheDocument();
      expect(screen.getByText('Children')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Save Information')).toBeInTheDocument();
    });
  });

  it('updates input fields and calculates total', async () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const maleInput = screen.getByText('Men').closest('div')?.querySelector('input');
    const femaleInput = screen.getByText('Women').closest('div')?.querySelector('input');
    const childrenInput = screen.getByText('Children').closest('div')?.querySelector('input');
    const totalInput = screen.getByText('Total').closest('div')?.querySelector('input');

    fireEvent.change(maleInput!, { target: { value: '10' } });
    fireEvent.change(femaleInput!, { target: { value: '15' } });
    fireEvent.change(childrenInput!, { target: { value: '5' } });

    expect(maleInput).toHaveValue('10');
    expect(femaleInput).toHaveValue('15');
    expect(childrenInput).toHaveValue('5');
    expect(totalInput).toHaveValue('30');
    expect(totalInput).toBeDisabled();
  });

  it('prevents non-numeric input in fields', async () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const maleInput = screen.getByText('Men').closest('div')?.querySelector('input');
    fireEvent.change(maleInput!, { target: { value: 'abc' } });
    expect(maleInput).toHaveValue('');
  });

  it('handles save button click and API submission', async () => {
    (Api.post as jest.Mock).mockResolvedValue({ data: { message: 'Success' } });

    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const maleInput = screen.getByText('Men').closest('div')?.querySelector('input');
    fireEvent.change(maleInput!, { target: { value: '10' } });

    const saveButton = screen.getByText('Save Information');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(Api.post).toHaveBeenCalledWith('/church/create-attendance/event-123', {
        male: 10,
      });
      expect(showPageToast).toHaveBeenCalledWith('Attendance saved successfully!', 'success');
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('shows error toast when no attendance values are entered', async () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Information');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith('Please enter at least one attendance value', 'error');
      expect(Api.post).not.toHaveBeenCalled();
    });
  });

  it('handles API error during save', async () => {
    (Api.post as jest.Mock).mockRejectedValue({
      response: { data: { error: { message: 'Failed to save attendance' } } },
    });

    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const maleInput = screen.getByText('Men').closest('div')?.querySelector('input');
    fireEvent.change(maleInput!, { target: { value: '10' } });

    const saveButton = screen.getByText('Save Information');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(showPageToast).toHaveBeenCalledWith('Attendance Error: Failed to save attendance', 'error');
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('closes dialog when close button is clicked', async () => {
    render(
      <Provider store={mockStore}>
        <MembersCountDialogue {...defaultProps} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});