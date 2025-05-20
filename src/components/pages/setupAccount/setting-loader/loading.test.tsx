import { render, screen, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import Loading from './loading'; // Adjust the import path as needed
import '@testing-library/jest-dom';

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

describe('Loading Component', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock the animationend event
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 0);
      return 0;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('renders all elements correctly', () => {
    render(<Loading />);
    
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByText('Setting up Church! Please wait...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has the correct animation classes', () => {
    render(<Loading />);
    
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveClass('animate-spin');
    
    const progressBar = screen.getByRole('progressbar').firstChild;
    expect(progressBar).toHaveStyle('animation: fillProgress 5s linear forwards');
  });

  it('navigates to dashboard after animation completes', () => {
    jest.useFakeTimers();
    render(<Loading />);
    
    const progress = screen.getByRole('progressbar').firstChild;
    
    // Trigger animationend event
    act(() => {
      const animationEndEvent = new Event('animationend');
      progress?.dispatchEvent(animationEndEvent);
    });
    
    // Check spinner animation was removed
    const spinner = screen.getByTestId('spinner');
    expect(spinner).not.toHaveClass('animate-spin');
    
    // Advance timers by the delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Check navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    
    jest.useRealTimers();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(Element.prototype, 'removeEventListener');
    const { unmount } = render(<Loading />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'animationend',
      expect.any(Function)
    );
  });

  it('handles missing elements gracefully', () => {
    // Mock getElementById to return null
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue(null);
    
    // This should not throw errors
    expect(() => {
      render(<Loading />);
    }).not.toThrow();
    
    // Restore original implementation
    document.getElementById = originalGetElementById;
  });
});