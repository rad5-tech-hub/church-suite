// ChangeColorButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ChangeColorButton from './setting';

describe('ChangeColorButton Component', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.documentElement.style.cssText = '';
  });

  it('renders without crashing', () => {
    render(<ChangeColorButton />);
    expect(screen.getByText('Church Color:')).toBeInTheDocument();
  });

  it('renders color input with default value', () => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:');
    expect(colorInput).toHaveValue('#111827');
  });

  it('updates primary color when color input changes', () => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    
    expect(colorInput).toHaveValue('#ff0000');
    expect(screen.getByText('#ff0000')).toBeInTheDocument();
  });

  it('applies CSS variables when primary color changes', () => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:');
    fireEvent.change(colorInput, { target: { value: '#336699' } });
    
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#336699');
    expect(document.documentElement.style.getPropertyValue('--color-text-on-primary')).toBe('#ffffff');
  });

  it('calculates correct contrast color for dark colors', () => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:');
    fireEvent.change(colorInput, { target: { value: '#000000' } });
    
    expect(document.documentElement.style.getPropertyValue('--color-text-on-primary')).toBe('#ffffff');
  });

  it('calculates correct contrast color for light colors', () => {
    render(<ChangeColorButton />);
    const colorInput = screen.getByLabelText('Church Color:');
    fireEvent.change(colorInput, { target: { value: '#ffffff' } });
    
    expect(document.documentElement.style.getPropertyValue('--color-text-on-primary')).toBe('#000000');
  });
});

describe('calculateContrastColor', () => {
  it('returns white for dark colors', () => {
    expect(calculateContrastColor('#000000')).toBe('#ffffff');
    expect(calculateContrastColor('#336699')).toBe('#ffffff');
  });

  it('returns black for light colors', () => {
    expect(calculateContrastColor('#ffffff')).toBe('#000000');
    expect(calculateContrastColor('#f0f0f0')).toBe('#000000');
  });
});

// Mock implementation of the utility function for testing
function calculateContrastColor(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}