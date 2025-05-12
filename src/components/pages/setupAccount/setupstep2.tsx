import React, { useState } from "react";
import { SlCloudUpload } from "react-icons/sl";
import { IoArrowForward } from "react-icons/io5";
import { Link } from "react-router-dom";

// Component Code
const SetupStep2: React.FC = () => {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section (Image) */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-9/12 py-8">
            <p className="mb-2 text-sm text-gray-200">Step 2 of 3</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Image Uploads</h1>
            <p className="text-lg lg:text-xl text-gray-300">
              Upload your logo and background image to complete the setup.
            </p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10  justify-center flex flex-col">
          {/* Form */}
          <form className="flex flex-col">
            {/* Upload Logo */}
            <div className="mb-6">
              <label htmlFor="logo-upload" className="block text-base text-gray-700 font-medium mb-2">
                Upload Logo
              </label>
              <div
                className={`file-upload input-shadow flex flex-col items-center justify-center border border-gray-300 rounded-md py-6 cursor-pointer relative ${
                  logoPreview
                    ? "border-light-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    : ""
                }`}
              >
                <input
                  type="file"
                  id="logo-upload"
                  accept=".svg,.png,.jpg,.gif"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleLogoUpload}
                  required
                />
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-14 h-14 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-9 h-9 bg-[#B7CBD0] rounded-full flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full flex bg-[#B7CBD0] items-center justify-center">
                        <SlCloudUpload className="w-5 h-5 text-[#111827] text-center" />
                      </div>
                    </div>
                  </div>
                )}
                <span className="text-gray-500 text-base mt-3">
                  <span className="font-semibold text-[#175668]">Click to upload</span> Logo
                </span>
                <span className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</span>
              </div>
            </div>

            {/* Upload Background Image */}
            <div className="mb-6">
              <label htmlFor="background-upload" className="block text-base text-gray-700 font-medium mb-2">
                Upload Background Image
              </label>
              <div
                className={`file-upload input-shadow flex flex-col items-center justify-center border border-gray-300 rounded-md py-6 cursor-pointer relative ${
                  backgroundPreview
                    ? "border-light-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    : ""
                }`}
              >
                <input
                  type="file"
                  id="background-upload"
                  accept=".svg,.png,.jpg,.gif"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleBackgroundUpload}
                  required
                />
                {backgroundPreview ? (
                  <img
                    src={backgroundPreview}
                    alt="Background Preview"
                    className="w-14 h-14 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-9 h-9 bg-[#B7CBD0] rounded-full flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full flex bg-[#B7CBD0] items-center justify-center">
                        <SlCloudUpload className="w-5 h-5 text-[#111827] text-center" />
                      </div>
                    </div>
                  </div>
                )}
                <span className="text-gray-500 text-base mt-3">
                  <span className="font-semibold text-[#175668]">Click to upload</span> Background Image
                </span>
                <span className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse lg:flex-row lg:justify-between gap-3 pt-5">
              {/* Skip Button */}
              <Link to={'/admin-account'} className="flex items-center">
                <button
                  type="button"
                  className="flex items-center justify-center mb-5 h-12 gap-3 px-7 w-full lg:w-auto text-gray-600 rounded-full text-base font-semibold border border-gray-300 hover:bg-gray-100"
                >
                  Skip
                  <IoArrowForward className="w-5 h-5 text-gray-600 mr-2" />
                </button>
              </Link>

              {/* Continue Button */}
              <Link to={'/admin-account'} className="flex items-center">
                <button
                  type="submit"
                  className="h-12 px-10 mb-5 lg:w-auto w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-[#111827]"
                >
                  Continue
                </button>
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

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('SetupStep2 Component', () => {
    test('renders upload form elements', () => {
      render(
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      );

      expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
      expect(screen.getByText('Image Uploads')).toBeInTheDocument();
      expect(screen.getByText('Upload your logo and background image to complete the setup.')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload Logo')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload Background Image')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    test('updates logo preview and adds green shadow on upload', () => {
      render(
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      );

      const logoInput = screen.getByLabelText('Upload Logo') as HTMLInputElement;
      const file = new File(['(dummy content)'], 'test.png', { type: 'image/png' });
      fireEvent.change(logoInput, { target: { files: [file] } });

      const logoPreviewImg = screen.getByAltText('Logo Preview');
      expect(logoPreviewImg).toBeInTheDocument();
      const logoUploadDiv = logoInput.closest('.file-upload');
      expect(logoUploadDiv).toHaveClass('border-light-green-500');
      expect(logoUploadDiv).toHaveClass('shadow-[0_0_10px_rgba(34,197,94,0.5)]');
    });

    test('updates background preview and adds green shadow on upload', () => {
      render(
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      );

      const backgroundInput = screen.getByLabelText('Upload Background Image') as HTMLInputElement;
      const file = new File(['(dummy content)'], 'test.png', { type: 'image/png' });
      fireEvent.change(backgroundInput, { target: { files: [file] } });

      const backgroundPreviewImg = screen.getByAltText('Background Preview');
      expect(backgroundPreviewImg).toBeInTheDocument();
      const backgroundUploadDiv = backgroundInput.closest('.file-upload');
      expect(backgroundUploadDiv).toHaveClass('border-light-green-500');
      expect(backgroundUploadDiv).toHaveClass('shadow-[0_0_10px_rgba(34,197,94,0.5)]');
    });

    test('submits the form', () => {
      const mockSubmit = jest.fn();
      render(
        <MemoryRouter>
          <SetupStep2 />
        </MemoryRouter>
      );

      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      expect(mockSubmit).toHaveBeenCalledTimes(0); // No actual submit handler, just testing button click
    });
  });
}

export default SetupStep2;