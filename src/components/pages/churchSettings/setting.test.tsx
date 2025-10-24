import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ChangeColorButton from './setting';

describe('ChangeColorButton Component', () => {
  beforeEach(() => {
    // Reset CSS custom properties before each test
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-text-on-primary');
  });

  afterEach(() => {
    // Cleanup after each test
    document.documentElement.style.removeProperty('--color-primary');
    document.documentElement.style.removeProperty('--color-text-on-primary');
  });

  describe('Rendering', () => {
    test('renders the component with label and color input', () => {
      render(<ChangeColorButton />);

      expect(screen.getByText('Church Color:')).toBeInTheDocument();
      expect(screen.getByLabelText('Church Color:')).toBeInTheDocument();
    });

    test('renders color input with default value #111827', () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      expect(colorInput).toHaveAttribute('type', 'color');
      expect(colorInput.value).toBe('#111827');
    });

    test('color input has correct CSS classes', () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:');
      expect(colorInput).toHaveClass('w-12', 'h-12', 'cursor-pointer');
    });
  });

  describe('CSS Variables Initialization', () => {
    test('sets initial CSS variables on mount', () => {
      render(<ChangeColorButton />);

      const primaryColor = document.documentElement.style.getPropertyValue('--color-primary');
      const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');

      expect(primaryColor).toBe('#111827');
      expect(contrastColor).toBe('#ffffff'); // Dark color should have white text
    });

    test('initializes with dark color and white contrast', () => {
      render(<ChangeColorButton />);

      const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
      expect(contrastColor).toBe('#ffffff');
    });
  });

  describe('Color Change Functionality', () => {
    test('updates primary color when user changes input', async () => {
      const user = userEvent.setup();
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      await user.clear(colorInput);
      await user.type(colorInput, '#ff5733');

      expect(colorInput.value).toBe('#ff5733');
    });

    test('updates CSS variable when color changes', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#3498db' } });

      await waitFor(() => {
        const primaryColor = document.documentElement.style.getPropertyValue('--color-primary');
        expect(primaryColor).toBe('#3498db');
      });
    });

    test('calculates correct contrast color for light backgrounds', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      // Set a light color (e.g., light yellow)
      fireEvent.change(colorInput, { target: { value: '#ffeb3b' } });

      await waitFor(() => {
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        expect(contrastColor).toBe('#000000'); // Light background should have black text
      });
    });

    test('calculates correct contrast color for dark backgrounds', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      // Set a dark color (e.g., dark blue)
      fireEvent.change(colorInput, { target: { value: '#1a237e' } });

      await waitFor(() => {
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        expect(contrastColor).toBe('#ffffff'); // Dark background should have white text
      });
    });

    test('handles multiple color changes', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      // First change
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#ff0000');
      });

      // Second change
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#00ff00');
      });

      // Third change
      fireEvent.change(colorInput, { target: { value: '#0000ff' } });
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#0000ff');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles pure white color (#ffffff)', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#ffffff' } });

      await waitFor(() => {
        const primaryColor = document.documentElement.style.getPropertyValue('--color-primary');
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        
        expect(primaryColor).toBe('#ffffff');
        expect(contrastColor).toBe('#000000'); // White needs black text
      });
    });

    test('handles pure black color (#000000)', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#000000' } });

      await waitFor(() => {
        const primaryColor = document.documentElement.style.getPropertyValue('--color-primary');
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        
        expect(primaryColor).toBe('#000000');
        expect(contrastColor).toBe('#ffffff'); // Black needs white text
      });
    });

    test('handles mid-tone colors near luminance threshold', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      // Color with luminance around 0.5 threshold
      fireEvent.change(colorInput, { target: { value: '#808080' } });

      await waitFor(() => {
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        expect(contrastColor).toMatch(/^#(000000|ffffff)$/); // Should be either black or white
      });
    });

    test('handles rapid color changes', async () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
      
      colors.forEach((color) => {
        fireEvent.change(colorInput, { target: { value: color } });
      });

      await waitFor(() => {
        const primaryColor = document.documentElement.style.getPropertyValue('--color-primary');
        expect(primaryColor).toBe('#ff00ff'); // Should settle on last color
      });
    });
  });

  describe('Accessibility', () => {
    test('color input has proper id attribute', () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:');
      expect(colorInput).toHaveAttribute('id', 'primary-color');
    });

    test('label is properly associated with input', () => {
      render(<ChangeColorButton />);

      const label = screen.getByText('Church Color:');
      expect(label).toHaveAttribute('for', 'primary-color');
    });

    test('color input is keyboard accessible', () => {
      render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:');
      expect(colorInput).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Component Lifecycle', () => {
    test('updates CSS variables on every color change', async () => {
      const { rerender } = render(<ChangeColorButton />);

      const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#e91e63' } });

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#e91e63');
      });

      rerender(<ChangeColorButton />);

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#111827');
      });
    });

    test('component unmounts cleanly', () => {
      const { unmount } = render(<ChangeColorButton />);

      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#111827');

      unmount();

      // CSS variables should still exist after unmount
      // (This is expected behavior - the component doesn't clean them up)
      expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#111827');
    });
  });
});

describe('calculateContrastColor utility function', () => {
  // Helper to test the contrast calculation
  const testContrastColor = (color: string, expectedContrast: string) => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:') as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: color } });
    
    return new Promise<void>((resolve) => {
      waitFor(() => {
        const contrastColor = document.documentElement.style.getPropertyValue('--color-text-on-primary');
        expect(contrastColor).toBe(expectedContrast);
        resolve();
      });
    });
  };

  test('returns white for dark colors', async () => {
    await testContrastColor('#000000', '#ffffff');
    await testContrastColor('#333333', '#ffffff');
    await testContrastColor('#1a237e', '#ffffff');
  });

  test('returns black for light colors', async () => {
    await testContrastColor('#ffffff', '#000000');
    await testContrastColor('#ffeb3b', '#000000');
    await testContrastColor('#e0e0e0', '#000000');
  });

  test('calculates luminance correctly using standard formula', async () => {
    // Red with medium luminance
    await testContrastColor('#ff6b6b', '#000000');
    
    // Blue with low luminance
    await testContrastColor('#2c3e50', '#ffffff');
    
    // Green with high luminance
    await testContrastColor('#81c784', '#000000');
  });
});