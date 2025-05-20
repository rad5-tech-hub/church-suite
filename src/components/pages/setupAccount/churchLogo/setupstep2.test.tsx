import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import SetupStep2 from './setupstep2';
import { setChurchData } from '../../../reduxstore/datamanager';

const mockStore = configureStore([]);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('SetupStep2 Component', () => {
  let store: any;
  const mockNavigate = jest.fn();

  beforeEach(() => {
    store = mockStore({
      church: {
        logoPreview: {},
        backgroundPreview: {},
      },
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    store.dispatch = jest.fn();
  });

  it('should render the form with all fields', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/Upload Logo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload Background Image/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('should handle logo file upload and dispatch setChurchData', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload Logo/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(store.dispatch).toHaveBeenCalledWith(
      setChurchData({ logoPreview: expect.any(String) })
    );
  });

  it('should handle background image file upload and dispatch setChurchData', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    const file = new File(['background'], 'background.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Upload Background Image/i);

    fireEvent.change(input, { target: { files: [file] } });

    expect(store.dispatch).toHaveBeenCalledWith(
      setChurchData({ backgroundPreview: expect.any(String) })
    );
  });

  it('should navigate to /admin-account after clicking Continue and waiting 2 seconds', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin-account');
    });
  });

  it('should disable the Continue button while loading', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByRole('button', { name: /Continuing.../i })).toBeDisabled();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin-account');
    });
  });
});