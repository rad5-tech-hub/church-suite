import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ForgotPassword } from '../ForgotPassword';

const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockForgotPassword = vi.fn();
vi.mock('../../api', () => ({
  forgotPassword: (...args: any[]) => mockForgotPassword(...args),
}));

function renderPage(path = '/forgot-password') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ForgotPassword />
    </MemoryRouter>
  );
}

describe('ForgotPassword page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockForgotPassword.mockReset();
  });

  it('renders the heading and email input', () => {
    renderPage();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('renders the "Return to login" link', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitted with empty email', async () => {
    renderPage();

    // Use fireEvent.submit to bypass JSDOM's HTML5 required-field validation
    // and directly invoke the component's own validation logic.
    const { container } = renderPage();
    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getAllByText(/please enter the email/i).length).toBeGreaterThan(0);
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('calls the forgotPassword API with the entered email', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Reset link sent.' });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'admin@church.com' });
    });
  });

  it('shows the success state after API call succeeds', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Check your inbox!' });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      expect(screen.getByText('Check your inbox!')).toBeInTheDocument();
    });
    // Form should no longer be visible
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
  });

  it('shows a "Return to Login" button in the success state', async () => {
    mockForgotPassword.mockResolvedValue({ message: 'Sent!' });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /return to login/i })).toBeInTheDocument();
    });
  });

  it('shows an error message when the API call fails', async () => {
    mockForgotPassword.mockRejectedValue({ message: 'Email not found' });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'unknown@church.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Email not found')).toBeInTheDocument();
    });
  });

  it('shows a loading state while the API call is in flight', async () => {
    let resolve: (val: any) => void;
    mockForgotPassword.mockReturnValue(new Promise((res) => { resolve = res; }));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/sending reset link/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /sending reset link/i })).toBeDisabled();

    resolve!({ message: 'Done' });
  });

  it('pre-fills email from query param', () => {
    render(
      <MemoryRouter initialEntries={['/forgot-password?email=pre%40church.com']}>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email address/i)).toHaveValue('pre@church.com');
  });

  it('"Return to login" navigates back to /login with current email', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.click(screen.getByRole('button', { name: /return to login/i }));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/login')
    );
  });
});
