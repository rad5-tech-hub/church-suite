import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BrandColors {
  primary: string;      // Main accent color (buttons, active links, header accents)
  primaryLight: string;  // Light version for backgrounds
}

interface ThemeContextType {
  brandColors: BrandColors | null;
  setBrandColors: (colors: BrandColors) => void;
  resetToDefault: () => void;
  isCustomized: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'churchset_brand_colors';

const DEFAULT_PRIMARY = '#2563eb'; // blue-600
const DEFAULT_PRIMARY_LIGHT = '#dbeafe'; // blue-100

function hexToOklch(hex: string): string {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Linear RGB
  const lr = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const lg = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const lb = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Approximate lightness for a simple approach
  const l = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const lightness = Math.pow(l, 1 / 3);

  // We'll just return the hex for CSS usage since modern browsers handle it
  return hex;
}

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function applyBrandColors(colors: BrandColors | null) {
  const root = document.documentElement;
  if (colors) {
    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--brand-primary-light', colors.primaryLight);
  } else {
    root.style.removeProperty('--brand-primary');
    root.style.removeProperty('--brand-primary-light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [brandColors, setBrandColorsState] = useState<BrandColors | null>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    applyBrandColors(brandColors);
  }, [brandColors]);

  const setBrandColors = (colors: BrandColors) => {
    setBrandColorsState(colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(colors));
  };

  const resetToDefault = () => {
    setBrandColorsState(null);
    localStorage.removeItem(THEME_STORAGE_KEY);
  };

  return (
    <ThemeContext.Provider
      value={{
        brandColors,
        setBrandColors,
        resetToDefault,
        isCustomized: brandColors !== null,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { lightenColor, DEFAULT_PRIMARY, DEFAULT_PRIMARY_LIGHT };
