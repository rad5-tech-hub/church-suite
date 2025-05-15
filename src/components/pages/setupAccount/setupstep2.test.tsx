import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SetupStep2 from './SetupStep2';
import '@testing-library/jest-dom';

// Type declarations
declare global {
  interface Window {
    URL: {
      createObjectURL: jest.Mock;
    };
  }
}

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock react-icons
jest.mock('react-icons/io5', () => ({
  IoArrowForward: () => <div>arrow-icon</div>,
}));

jest.mock('react-icons/sl', () => ({
  SlCloudUpload: () => <div>upload-icon</div>,
}));

describe('SetupStep2 Component', () => {
  beforeEach(() => {
    window.URL = {
      createObjectURL: jest.fn(() => 'mock-url')
    };
  });

  afterEach(() => {
    (window.URL.createObjectURL as jest.Mock).mockReset();
  });

  it('renders upload sections', () => {
    render(<SetupStep2 />);
    
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Upload Logo')).toBeInTheDocument();
    expect(screen.getByText('Upload Background Image')).toBeInTheDocument();
  });

  it('handles logo upload', () => {
    render(<SetupStep2 />);
    
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const logoInput = screen.getByTestId('logo-upload');
    
    fireEvent.change(logoInput, { target: { files: [file] } });
    
    expect(logoInput.files).toHaveLength(1);
    expect(logoInput.files?.[0].name).toBe('logo.png');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles background image upload', () => {
    render(<SetupStep2 />);
    
    const file = new File(['bg'], 'background.jpg', { type: 'image/jpeg' });
    const bgInput = screen.getByTestId('background-upload');
    
    fireEvent.change(bgInput, { target: { files: [file] } });
    
    expect(bgInput.files).toHaveLength(1);
    expect(bgInput.files?.[0].name).toBe('background.jpg');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('shows preview after upload', () => {
    render(<SetupStep2 />);
    
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    const logoInput = screen.getByTestId('logo-upload');
    
    fireEvent.change(logoInput, { target: { files: [file] } });
    
    expect(screen.getByAltText('Logo Preview')).toBeInTheDocument();
 