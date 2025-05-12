import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Component Code
const Loading: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const progress = document.getElementById("progress");
    const spinner = document.getElementById("spinner");

    if (progress) {
      progress.addEventListener("animationend", () => {
        if (spinner) {
          spinner.classList.remove("animate-spin");
        }
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6">
        {/* Circular Loader */}
        <div id="spinner" className="flex justify-center mb-4 animate-spin [animation-duration:0.5s]">
          <div className="rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
        </div>

        {/* Text */}
        <h3 className="loading text-center text-xl sm:text-xl md:text-2xl lg:text-2xl text-[#1A3C34]">
          Setting up Church! Please wait...
        </h3>

        {/* Progress Bar */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-2 bg-gray-200 rounded-full overflow-hidden mt-5">
          <div
            id="progress"
            className="h-full bg-[#111827] rounded-full"
            style={{
              animation: "fillProgress 5s linear forwards",
            }}
          ></div>
        </div>

        {/* Inline Keyframes */}
        <style>
          {`
            @keyframes fillProgress {
              from {
                width: 0%;
              }
              to {
                width: 100%;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen, waitFor } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('Loading Component', () => {
    test('renders loading elements', () => {
      render(
        <MemoryRouter>
          <Loading />
        </MemoryRouter>
      );

      expect(screen.getByText('Setting up Church! Please wait...')).toBeInTheDocument();
      const spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
      const progressBar = document.getElementById('progress');
      expect(progressBar).toBeInTheDocument();
    });

    test('spinner has increased speed', () => {
      render(
        <MemoryRouter>
          <Loading />
        </MemoryRouter>
      );

      const spinner = screen.getByTestId('spinner');
      expect(spinner).toHaveStyle({ 'animation-duration': '0.5s' });
    });

    test('navigates to dashboard after animation ends', async () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      render(
        <MemoryRouter>
          <Loading />
        </MemoryRouter>
      );

      const progressBar = document.getElementById('progress');
      progressBar?.dispatchEvent(new Event('animationend'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 2000 });
    });
  });
}

export default Loading;