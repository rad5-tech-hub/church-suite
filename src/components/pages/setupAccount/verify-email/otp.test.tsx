
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailVerification from './otp';
import { useNavigate } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the react-router-dom hooks
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock the fetch API
// Mock the fetch API
window.fetch = jest.fn() as jest.Mock;
// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('EmailVerification Component', () => {
  const mockNavigate = jest.fn();
  const mockEmail = 'test@example.com';
  const mockVerificationCode = '123456';
  
  beforeEach(() => {
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    window.sessionStorage.setItem('email', mockEmail);
    (fetch as jest.Mock).mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('renders correctly with email from sessionStorage', () => {
    render(<EmailVerification />);
    
    expect(screen.getByText(/Verify Email To Set Up Church!/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`We sent a verification code to.*${mockEmail}`, 'i'))).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('*')).toHaveLength(6);
  });

  it('focuses first input on mount', () => {
    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    expect(inputs[0]).toHaveFocus();
  });

  it('handles code input and auto-focus', () => {
    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    
    // Test input handling
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(inputs[0]).toHaveValue('1');
    expect(inputs[1]).toHaveFocus();

    // Test backspace handling
    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(inputs[0]).toHaveFocus();
  });

  it('enables verify button only when all digits are filled', () => {
    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    const verifyButton = screen.getByRole('button', { name: /verify email/i });

    expect(verifyButton).toBeDisabled();

    // Fill all inputs
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: (index + 1).toString() } });
    });

    expect(verifyButton).not.toBeDisabled();
  });

  it('handles successful verification', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    
    // Fill all inputs
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: mockVerificationCode[index] } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('verify-admin'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: mockEmail,
          otp: mockVerificationCode,
        }),
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles verification error', async () => {
    const errorMessage = 'Invalid verification code';
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false, message: errorMessage }),
    });

    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    
    // Fill all inputs
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: mockVerificationCode[index] } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles resend code functionality', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<EmailVerification />);
    fireEvent.click(screen.getByText(/click to resend/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('resend-verification-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: mockEmail }),
      });
    });
  });

  it('shows loading state during verification', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      }), 100))
    );

    render(<EmailVerification />);
    const inputs = screen.getAllByPlaceholderText('*');
    
    // Fill all inputs
    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: mockVerificationCode[index] } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify email/i }));

    expect(screen.getByRole('button', { name: /verifying.../i })).toBeInTheDocument();
    expect(screen.getByTestId('loading-overlay')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('redirects if no email is found in sessionStorage', () => {
    window.sessionStorage.clear();
    render(<EmailVerification />);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});