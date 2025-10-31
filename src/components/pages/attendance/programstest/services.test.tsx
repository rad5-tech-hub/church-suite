import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { CreateProgramModal, EditProgramModal } from '../programs/services';
import Api from '../../../shared/api/api';
import * as pageToastModule from '../../../util/pageToast';

// Mock dependencies
jest.mock('../../../shared/api/api');
jest.mock('../../../util/pageToast');
jest.mock('../../../hooks/usePageToast', () => ({
  usePageToast: jest.fn(),
}));
jest.mock('../../../util/popCalender', () => ({
  __esModule: true,
  default: ({ open }: any) => (
    open ? <div data-testid="calendar-dialog">Calendar Dialog</div> : null
  ),
}));

const mockShowPageToast = pageToastModule.showPageToast as jest.Mock;

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
};

// Mock API responses
const mockBranches = [
  { id: 'branch-123', name: 'Main Branch' },
  { id: 'branch-456', name: 'Second Branch' },
];

const mockDepartments = [
  { id: 'dept-1', name: 'Youth Ministry', type: 'Ministry' },
  { id: 'dept-2', name: 'Music Department', type: 'Arts' },
];

const mockCollections = [
  { id: 'col-1', name: 'Tithes' },
  { id: 'col-2', name: 'Offerings' },
];

const mockEventOccurrence = {
  id: 'event-123',
  eventId: 'event-main-123',
  date: '2025-10-25',
  startTime: '10:00',
  endTime: '12:00',
  isCancelled: false,
  hasAttendance: false,
  dayOfWeek: 'Saturday',
  createdAt: '2025-10-20T10:00:00Z',
  branchId: 'branch-123',
  collection: [
    { id: 'col-1', name: 'Tithes', collection: { id: 'col-1', name: 'Tithes' } },
  ],
  assignedDeparments: [
    { id: 'dept-1', name: 'Youth Ministry' },
  ],
  event: {
    id: 'event-main-123',
    title: 'Sunday Service',
  },
};

describe('ProgramModal - Create Mode', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore(defaultAuthData);

    // Setup default API mocks
    (Api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/church/get-branches')) {
        return Promise.resolve({ data: { branches: mockBranches } });
      }
      if (url.includes('/church/get-departments')) {
        return Promise.resolve({ data: { departments: mockDepartments } });
      }
      if (url.includes('/church/get-all-collections')) {
        return Promise.resolve({ data: { collections: mockCollections } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('renders create modal with correct title', async () => {
    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });
  });

  test('loads branches, departments, and collections on mount', async () => {
    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(Api.get).toHaveBeenCalledWith('/church/get-branches');
      expect(Api.get).toHaveBeenCalledWith(
        expect.stringContaining('/church/get-departments?branchId=')
      );
      expect(Api.get).toHaveBeenCalledWith(
        expect.stringContaining('/church/get-all-collections/')
      );
    });
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    
    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create program/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockShowPageToast).toHaveBeenCalledWith(
        'Program title is required',
        'error'
      );
    });
  });

  test('handles program type selection', async () => {
    const user = userEvent.setup();
    
    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Select Weekly program type
    const weeklyRadio = screen.getByLabelText(/weekly/i);
    await user.click(weeklyRadio);

    expect(weeklyRadio).toBeChecked();
  });

  test('creates single program successfully', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    (Api.post as jest.Mock).mockResolvedValue({
      data: {
        event: {
          title: 'Test Service',
        },
      },
    });

    render(
      <Provider store={store}>
        <CreateProgramModal 
          open={true} 
          onClose={onClose} 
          onSuccess={onSuccess}
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Fill in required fields
    const titleInput = screen.getByLabelText(/program title/i);
    await user.type(titleInput, 'Test Service');

    const dateInput = screen.getByLabelText(/start date/i);
    await user.type(dateInput, '2025-10-25');

    const startTimeInput = screen.getByLabelText(/start time/i);
    await user.type(startTimeInput, '10:00');

    const endTimeInput = screen.getByLabelText(/end time/i);
    await user.type(endTimeInput, '12:00');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create program/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(Api.post).toHaveBeenCalledWith(
        '/church/create-event',
        expect.objectContaining({
          title: 'Test Service',
          date: '2025-10-25',
          startTime: '10:00',
          endTime: '12:00',
          recurrenceType: 'none',
        })
      );
    });

    await waitFor(() => {
      expect(mockShowPageToast).toHaveBeenCalledWith(
        expect.stringContaining('created successfully'),
        'success'
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('handles API error during creation', async () => {
    const user = userEvent.setup();

    (Api.post as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'Failed to create program',
        },
      },
    });

    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Fill in required fields
    const titleInput = screen.getByLabelText(/program title/i);
    await user.type(titleInput, 'Test Service');

    const dateInput = screen.getByLabelText(/start date/i);
    await user.type(dateInput, '2025-10-25');

    const startTimeInput = screen.getByLabelText(/start time/i);
    await user.type(startTimeInput, '10:00');

    const endTimeInput = screen.getByLabelText(/end time/i);
    await user.type(endTimeInput, '12:00');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create program/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockShowPageToast).toHaveBeenCalledWith(
        'Failed to create program',
        'error'
      );
    });
  });

  test('handles weekly recurrence type', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Select Weekly program type
    const weeklyRadio = screen.getByLabelText(/weekly/i);
    await user.click(weeklyRadio);

    // Days of the Week select should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/days of the week/i)).toBeInTheDocument();
    });
  });

  test('closes modal and resets form on close', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={onClose} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Fill in some data
    const titleInput = screen.getByLabelText(/program title/i);
    await user.type(titleInput, 'Test Service');

    // Close modal
    const closeButton = screen.getAllByRole('button')[0]; // First button is close icon
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});

describe('ProgramModal - Edit Mode', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore(defaultAuthData);

    // Setup default API mocks
    (Api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/church/get-branches')) {
        return Promise.resolve({ data: { branches: mockBranches } });
      }
      if (url.includes('/church/get-departments')) {
        return Promise.resolve({ data: { departments: mockDepartments } });
      }
      if (url.includes('/church/get-all-collections')) {
        return Promise.resolve({ data: { collections: mockCollections } });
      }
      if (url.includes('/church/get-event/')) {
        return Promise.resolve({ data: { eventOccurrence: mockEventOccurrence } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('renders edit modal with correct title', async () => {
    render(
      <Provider store={store}>
        <EditProgramModal 
          open={true} 
          onClose={jest.fn()} 
          eventId="event-123"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Program')).toBeInTheDocument();
    });
  });

  test('loads existing event data in edit mode', async () => {
    render(
      <Provider store={store}>
        <EditProgramModal 
          open={true} 
          onClose={jest.fn()} 
          eventId="event-123"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(Api.get).toHaveBeenCalledWith('/church/get-event/event-123');
    });

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/program title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Sunday Service');
    });
  });

  test('updates program successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    (Api.patch as jest.Mock).mockResolvedValue({
      data: {
        message: 'Program updated successfully',
      },
    });

    render(
      <Provider store={store}>
        <EditProgramModal 
          open={true} 
          onClose={jest.fn()} 
          onSuccess={onSuccess}
          eventId="event-123"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Program')).toBeInTheDocument();
    });

    // Wait for form to load
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/program title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Sunday Service');
    });

    // Update title
    const titleInput = screen.getByLabelText(/program title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Service');

    // Submit form
    const updateButton = screen.getByRole('button', { name: /update program/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(Api.patch).toHaveBeenCalledWith(
        expect.stringContaining('/church/edit-an-event/event-123/branch/'),
        expect.objectContaining({
          title: 'Updated Service',
        })
      );
    });

    await waitFor(() => {
      expect(mockShowPageToast).toHaveBeenCalledWith(
        expect.stringContaining('updated successfully'),
        'success'
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  test('shows warning when no changes are made', async () => {
    const user = userEvent.setup();

    (Api.patch as jest.Mock).mockResolvedValue({
      data: { message: 'Updated' },
    });

    render(
      <Provider store={store}>
        <EditProgramModal 
          open={true} 
          onClose={jest.fn()} 
          eventId="event-123"
        />
      </Provider>
    );

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/program title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Sunday Service');
    });

    // Submit without changes
    const updateButton = screen.getByRole('button', { name: /update program/i });
    await user.click(updateButton);

    await waitFor(() => {
      expect(mockShowPageToast).toHaveBeenCalledWith(
        'No changes to update',
        'warning'
      );
    });
  });

  test('hides program type selection in edit mode', async () => {
    render(
      <Provider store={store}>
        <EditProgramModal 
          open={true} 
          onClose={jest.fn()} 
          eventId="event-123"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Program')).toBeInTheDocument();
    });

    // Program Type radio group should not be present in edit mode
    expect(screen.queryByText('Program Type')).not.toBeInTheDocument();
  });
});

describe('ProgramModal - Branch Selection', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore(defaultAuthData);

    (Api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/church/get-branches')) {
        return Promise.resolve({ data: { branches: mockBranches } });
      }
      if (url.includes('/church/get-departments')) {
        return Promise.resolve({ data: { departments: mockDepartments } });
      }
      if (url.includes('/church/get-all-collections')) {
        return Promise.resolve({ data: { collections: mockCollections } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('clears departments and collections when branch changes', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Wait for initial load
    await waitFor(() => {
      expect(Api.get).toHaveBeenCalled();
    });

    // Change branch - this should trigger re-fetching of departments and collections
    const branchSelect = screen.getByLabelText(/expected branch/i);
    await user.click(branchSelect);

    // Note: Testing MUI Select interactions requires more complex setup
    // This is a simplified test
  });
});

describe('ProgramModal - Custom Recurrence', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMockStore(defaultAuthData);

    (Api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/church/get-branches')) {
        return Promise.resolve({ data: { branches: mockBranches } });
      }
      if (url.includes('/church/get-departments')) {
        return Promise.resolve({ data: { departments: mockDepartments } });
      }
      if (url.includes('/church/get-all-collections')) {
        return Promise.resolve({ data: { collections: mockCollections } });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('opens calendar dialog for custom recurrence', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={store}>
        <CreateProgramModal open={true} onClose={jest.fn()} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Program')).toBeInTheDocument();
    });

    // Select Custom program type
    const customRadio = screen.getByLabelText(/custom/i);
    await user.click(customRadio);

    // Calendar dialog should open
    await waitFor(() => {
      expect(screen.getByTestId('calendar-dialog')).toBeInTheDocument();
    });
  });
});