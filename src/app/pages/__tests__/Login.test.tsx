import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Login } from '../Login';

// ─── Mock react-router navigate ──────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ─── Mock AuthContext ─────────────────────────────────────────────
const mockSignIn = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

// ─── Mock ChurchContext ───────────────────────────────────────────
const mockLoadChurch = vi.fn();
vi.mock('../../context/ChurchContext', () => ({
  useChurch: () => ({ loadChurchFromServer: mockLoadChurch }),
}));

function renderLogin(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignIn.mockReset();
    mockLoadChurch.mockResolvedValue(undefined);
  });

  it('renders the welcome heading and sign-in form', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the "Forgot password?" link', () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  it('renders the onboarding link', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /set up churchset/i })).toBeInTheDocument();
  });

  it('lets the user type into the email and password fields', async () => {
    const user = userEvent.setup();
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'admin@church.com');
    await user.type(passwordInput, 'secret123');

    expect(emailInput).toHaveValue('admin@church.com');
    expect(passwordInput).toHaveValue('secret123');
  });

  it('toggles password visibility when the eye button is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle button has tabIndex={-1}, find it by its sibling position
    const toggleBtn = passwordInput.parentElement!.querySelector('button[type="button"]') as HTMLButtonElement;
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows an error message when signIn returns an error', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'bad@church.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard after successful login', async () => {
    mockSignIn.mockResolvedValue({});
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('navigates to /choose-plan when requiresSubscription is true', async () => {
    mockSignIn.mockResolvedValue({ requiresSubscription: true });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/choose-plan');
    });
  });

  it('navigates to /verify-email when needsEmailVerification is true', async () => {
    mockSignIn.mockResolvedValue({ needsEmailVerification: true });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'unverified@church.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/verify-email'),
        expect.any(Object)
      );
    });
  });

  it('shows loading state while signing in', async () => {
    // Keep sign-in pending so we can observe the loading state
    let resolve: (val: any) => void;
    mockSignIn.mockReturnValue(new Promise((res) => { resolve = res; }));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email address/i), 'admin@church.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    // cleanup
    resolve!({});
  });

  it('pre-fills email from query param', () => {
    render(
      <MemoryRouter initialEntries={['/login?email=prefilled%40church.com']}>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/email address/i)).toHaveValue('prefilled@church.com');
  });
});
