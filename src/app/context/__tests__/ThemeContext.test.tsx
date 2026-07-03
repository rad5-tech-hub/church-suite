import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme, DEFAULT_PRIMARY, DEFAULT_PRIMARY_LIGHT, lightenColor } from '../ThemeContext';

// ─── Consumer component for testing context values ────────────────
function ThemeConsumer() {
  const { brandColors, isCustomized, setBrandColors, resetToDefault } = useTheme();
  return (
    <div>
      <span data-testid="primary">{brandColors?.primary ?? 'none'}</span>
      <span data-testid="customized">{String(isCustomized)}</span>
      <button
        onClick={() => setBrandColors({ primary: '#ff0000', primaryLight: '#ffe0e0' })}
      >
        Set Red
      </button>
      <button onClick={resetToDefault}>Reset</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Remove any CSS variables set by the provider
    document.documentElement.style.removeProperty('--brand-primary');
    document.documentElement.style.removeProperty('--brand-primary-light');
  });

  it('provides null brandColors and isCustomized=false by default', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('primary')).toHaveTextContent('none');
    expect(screen.getByTestId('customized')).toHaveTextContent('false');
  });

  it('updates brandColors and isCustomized after setBrandColors is called', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByRole('button', { name: /set red/i }));

    expect(screen.getByTestId('primary')).toHaveTextContent('#ff0000');
    expect(screen.getByTestId('customized')).toHaveTextContent('true');
  });

  it('persists brand colors to localStorage', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByRole('button', { name: /set red/i }));

    const stored = JSON.parse(localStorage.getItem('churchset_brand_colors')!);
    expect(stored.primary).toBe('#ff0000');
  });

  it('resets to defaults and clears localStorage', async () => {
    const user = userEvent.setup();
    localStorage.setItem('churchset_brand_colors', JSON.stringify({ primary: '#ff0000', primaryLight: '#ffe0e0' }));

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByTestId('primary')).toHaveTextContent('none');
    expect(screen.getByTestId('customized')).toHaveTextContent('false');
    expect(localStorage.getItem('churchset_brand_colors')).toBeNull();
  });

  it('restores brand colors from localStorage on mount', () => {
    localStorage.setItem('churchset_brand_colors', JSON.stringify({ primary: '#123456', primaryLight: '#abcdef' }));

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('primary')).toHaveTextContent('#123456');
    expect(screen.getByTestId('customized')).toHaveTextContent('true');
  });

  it('applies CSS variables to the document root when colors are set', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    await user.click(screen.getByRole('button', { name: /set red/i }));

    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#ff0000');
  });

  it('useTheme throws when used outside ThemeProvider', () => {
    const BadConsumer = () => { useTheme(); return null; };
    expect(() => render(<BadConsumer />)).toThrow(/ThemeProvider/);
  });
});

// ─── lightenColor helper ─────────────────────────────────────────

describe('lightenColor', () => {
  it('lightens black (#000000) to white when amount is 1', () => {
    expect(lightenColor('#000000', 1)).toBe('#ffffff');
  });

  it('returns the same color when amount is 0', () => {
    expect(lightenColor('#123456', 0)).toBe('#123456');
  });

  it('clamps channel values to 255', () => {
    const result = lightenColor('#ffffff', 1);
    expect(result).toBe('#ffffff');
  });

  it('produces a valid 7-char hex string', () => {
    const result = lightenColor('#336699', 0.5);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// ─── exported constants ──────────────────────────────────────────

describe('exported constants', () => {
  it('DEFAULT_PRIMARY is a valid hex color', () => {
    expect(DEFAULT_PRIMARY).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('DEFAULT_PRIMARY_LIGHT is a valid hex color', () => {
    expect(DEFAULT_PRIMARY_LIGHT).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
