import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './login';
import '@testing-library/jest-dom';
import { store } from '../../reduxstore/redux';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock external dependencies
jest.mock('react-icons/io5', () => ({
  IoMailOutline: () => <div>mail-icon</div>,
  SlLock: () => <div>lock-icon</div>,
}));

jest.mock('react-icons/pi', () => ({
  PiEye: () => <div>eye-icon</div>,
  PiEyeClosed: () => <div>eye-closed-icon</div>,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useLocation: () => ({
    pathname: '/'
  })
}));

// Mock fetch
(globalThis as any).fetch = jest.fn() as jest.Mock;

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  test('renders login form', () => {
    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );
    
    // Test left section
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Kindly login to your account/i)).toBeInTheDocument();
    
    // Test right section
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have account?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('toggles password visibility', () => {
    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );
    
    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
    
    // Initial state
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // After click
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('handles form submission successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    // Check loading state
    expect(screen.getByText(/Loging in.../i)).toBeInTheDocument();

    await waitFor(() => {
      // Check for success notification
      expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
      expect(screen.getByText(/You have successfully logged in!/i)).toBeInTheDocument();
    });
  });

  test('handles form submission error', async () => {
    const errorMessage = 'Invalid credentials';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: errorMessage } }),
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('opens and closes forgot password modal', async () => {
    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Click forgot password
    fireEvent.click(screen.getByText('Forgot Password?'));

    // Check modal is open
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    await waitFor(() => {
      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument();
    });
  });

  test('handles forgot password submission successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Open forgot password modal
    fireEvent.click(screen.getByText('Forgot Password?'));

    // Fill out email
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password reset link has been sent to your email!/i)).toBeInTheDocument();
    });
  });

  test('handles forgot password submission error', async () => {
    const errorMessage = 'Email not found';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: errorMessage } }),
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Open forgot password modal
    fireEvent.click(screen.getByText('Forgot Password?'));

    // Fill out email
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'nonexistent@example.com' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('clears notifications when dismissed', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Test error' } }),
    });

    render(
      <Provider store={store}>
        <Router>
          <Login />
        </Router>
      </Provider>
    );

    // Submit form to trigger error notification
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    // Dismiss notification
    fireEvent.click(screen.getByRole('button', { name: /close notification/i }));

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});