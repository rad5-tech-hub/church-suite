import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../../../reduxstore/redux';
import SetupStep2 from './setupstep2';
import { setChurchData } from '../../../reduxstore/datamanager';

// Fix for global type
declare const global: typeof globalThis;


// Mock react-icons
jest.mock('react-icons/sl', () => ({
  SlCloudUpload: () => <span>UploadIcon</span>
}));

jest.mock('react-icons/io5', () => ({
  IoArrowForward: () => <span>ArrowIcon</span>,
  IoCheckmarkCircle: () => <span>CheckmarkIcon</span>
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: jest.fn().mockImplementation(({ children }) => children),
}));

// Mock FileReader API
class MockFileReader {
  result = '';
  onload: () => void = () => {};
  readAsDataURL() {
    this.result = 'data:image/png;base64,test';
    this.onload();
  }
}

global.FileReader = MockFileReader as any;

describe('SetupStep2 Component', () => {
  const mockChurchData = {
    logoPreview: null,
    backgroundPreview: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(setChurchData(mockChurchData));
  });

  test('renders the component correctly', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Image Uploads')).toBeInTheDocument();
    expect(screen.getByText('Upload Logo')).toBeInTheDocument();
    expect(screen.getByText('Upload Banner Image')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  test('shows error when trying to continue without logo', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Please upload a logo')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument(); // Button text doesn't change to "Continuing..."
    });
  });

  test('handles file upload for logo', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const logoInput = screen.getByLabelText('Upload Logo').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(logoInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(setChurchData).toHaveBeenCalledWith({
        logoPreview: 'data:image/png;base64,test'
      });
      expect(screen.getByText('CheckmarkIcon')).toBeInTheDocument();
    });
  });

  test('handles file upload for background', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const bgInput = screen.getByLabelText('Upload Banner Image').querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(bgInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(setChurchData).toHaveBeenCalledWith({
        backgroundPreview: 'data:image/png;base64,test'
      });
      expect(screen.getByText('CheckmarkIcon')).toBeInTheDocument();
    });
  });

  test('navigates to admin account after successful submission', async () => {
    store.dispatch(setChurchData({ 
      ...mockChurchData,
      logoPreview: 'data:image/png;base64,testlogo' 
    }));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Continue'));

    await waitFor(() => {
      expect(screen.getByText('Continuing...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin-account');
    }, { timeout: 3000 });
  });

  test('allows skipping to admin account', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Skip'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin-account');
  });

  test('shows loading state during submission', async () => {
    store.dispatch(setChurchData({ 
      ...mockChurchData,
      logoPreview: 'data:image/png;base64,testlogo' 
    }));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText('Continue'));

    expect(await screen.findByText('Continuing...')).toBeInTheDocument();
  });
});