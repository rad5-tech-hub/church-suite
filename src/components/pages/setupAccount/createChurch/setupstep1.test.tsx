import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import SetupChurch from './setupstep1';
import { setChurchData } from '../../../reduxstore/datamanager';

const mockStore = configureStore([]);
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('SetupChurch Component', () => {
  let store: any;
  const mockNavigate = jest.fn();

  beforeEach(() => {
    store = mockStore({
      church: {
        churchName: '',
        churchEmail: '',
        churchPhone: '',
        churchLocation: '',
        isHeadquarter: '',
      },
    });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    store.dispatch = jest.fn();
  });

  it('should render the form with all fields', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/Name of Church/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email of Church/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number of Church/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Church Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Is this the Headquarter?/i)).toBeInTheDocument();
  });

  it('should show an error message if required fields are empty', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(await screen.findByText(/Please fill all required fields./i)).toBeInTheDocument();
  });

  it('should dispatch setChurchData and navigate to /setup-logo on valid form submission', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/Name of Church/i), { target: { value: 'Grace Church' } });
    fireEvent.change(screen.getByLabelText(/Email of Church/i), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number of Church/i), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByLabelText(/Church Location/i), { target: { value: '123 Church Street' } });
    fireEvent.change(screen.getByLabelText(/Is this the Headquarter?/i), { target: { value: 'yes' } });

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalledWith(
        setChurchData({
          churchName: 'Grace Church',
          churchEmail: 'grace@example.com',
          churchPhone: '123-456-7890',
          churchLocation: '123 Church Street',
          isHeadquarter: false,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/setup-logo');
    });
  });

  it('should disable the submit button while loading', async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SetupChurch />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/Name of Church/i), { target: { value: 'Grace Church' } });
    fireEvent.change(screen.getByLabelText(/Email of Church/i), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number of Church/i), { target: { value: '123-456-7890' } });
    fireEvent.change(screen.getByLabelText(/Church Location/i), { target: { value: '123 Church Street' } });
    fireEvent.change(screen.getByLabelText(/Is this the Headquarter?/i), { target: { value: 'yes' } });

    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    expect(screen.getByRole('button', { name: /Submitting.../i })).toBeDisabled();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/setup-logo');
    });
  });
});