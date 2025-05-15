import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './login';
import '@testing-library/jest-dom';

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
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('Login Component', () => {
  test('renders login form', () => {
    render(<Login />);
    
    // Test left section
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Kindly login to your account/i)).toBeInTheDocument();
    
    // Test right section
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  test('toggles password visibility', () => {
    render(<Login />);
    
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
});