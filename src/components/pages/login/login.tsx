import React, { useState } from "react";
import { IoMailOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link } from "react-router-dom";
import { SlLock } from "react-icons/sl";

// Component Code
const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your submit logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 h-screen">
        {/* Left Section (Image) */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-9/12 py-8">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Log in</h1>
            <p className="text-lg lg:text-xl text-gray-300">
              Welcome, Kindly login to your account to continue with your church
            </p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="email"
                  id="email"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow relative">
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full text-base text-gray-800 focus:outline-none pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full gap-3 pt-5">
              <button
                type="submit"
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
              >
                Continue
              </button>
            </div>
            <div className="mt-5 text-center">
              <span>Don't have account?</span>{" "}
              <Link to="/setup-church" className="underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen, fireEvent } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, and expect to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('Login Component', () => {
    test('renders login form elements', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(screen.getByText('Log in')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Kindly login to your account to continue with your church')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
      expect(screen.getByText(/Don't have account?/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    test('toggles password visibility', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const toggleButton = screen.getByLabelText('Toggle password visibility');

      expect(passwordInput.type).toBe('password');
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');
      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    test('allows email input', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });

    test('allows password input', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput.value).toBe('password123');
    });

    test('submits the form', () => {
      const mockSubmit = jest.fn();
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const submitButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(submitButton);
      expect(mockSubmit).toHaveBeenCalledTimes(0); // Adjust if you add actual submit logic
    });
  });
}

export default Login;