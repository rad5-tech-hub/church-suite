import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateAccount from './createAccount'; // Adjust the import path as needed
import '@testing-library/jest-dom';

// Mock the icons and Link component
jest.mock('react-icons/io5', () => ({
  IoCallOutline: () => <div data-testid="call-icon" />,
  IoMailOutline: () => <div data-testid="mail-icon" />,
  IoPersonOutline: () => <div data-testid="person-icon" />,
}));

jest.mock('react-icons/pi', () => ({
  PiEye: () => <div data-testid="eye-icon" />,
  PiEyeClosed: () => <div data-testid="eye-closed-icon" />,
}));

jest.mock('react-icons/sl', () => ({
  SlLock: () => <div data-testid="lock-icon" />,
}));

jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('CreateAccount Component', () => {
  beforeEach(() => {
    render(<CreateAccount />);
  });

  it('renders the component correctly', () => {
    // Check header section
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText(/Kindly create an account to set up your church/i)).toBeInTheDocument();
    
    // Check form fields
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
  });

  it('renders all input icons correctly', () => {
    expect(screen.getByTestId('person-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    expect(screen.getByTestId('call-icon')).toBeInTheDocument();
    expect(screen.getAllByTestId('lock-icon').length).toBe(2);
  });

  it('toggles password visibility for both password fields', () => {
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText('Confirm Password') as HTMLInputElement;
    const passwordToggle = screen.getAllByRole('button')[0]; // First eye icon
    const confirmPasswordToggle = screen.getAllByRole('button')[1]; // Second eye icon

    // Initial state - passwords hidden
    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');
    expect(screen.getAllByTestId('eye-closed-icon').length).toBe(2);

    // Toggle password visibility
    fireEvent.click(passwordToggle);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

    // Toggle confirm password visibility
    fireEvent.click(confirmPasswordToggle);
    expect(confirmPasswordInput.type).toBe('text');
    expect(screen.getAllByTestId('eye-icon').length).toBe(2);

    // Toggle back
    fireEvent.click(passwordToggle);
    fireEvent.click(confirmPasswordToggle);
    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');
    expect(screen.getAllByTestId('eye-closed-icon').length).toBe(2);
  });

  it('has required fields', () => {
    expect(screen.getByPlaceholderText('Enter your full name')).toBeRequired();
    expect(screen.getByPlaceholderText('Enter your email')).toBeRequired();
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeRequired();
    expect(screen.getByPlaceholderText('Enter your password')).toBeRequired();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeRequired();
  });

  it('contains valid form inputs', () => {
    const fullNameInput = screen.getByPlaceholderText('Enter your full name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const phoneInput = screen.getByPlaceholderText('Enter your phone number');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');

    fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'securePassword123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'securePassword123' } });

    expect(fullNameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(phoneInput).toHaveValue('1234567890');
    expect(passwordInput).toHaveValue('securePassword123');
    expect(confirmPasswordInput).toHaveValue('securePassword123');
  });

  it('has a working continue button link', () => {
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton.closest('a')).toHaveAttribute('href', '/setting-up');
  });
});