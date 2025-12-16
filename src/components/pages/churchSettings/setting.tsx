import React, { useState, useEffect } from "react";

// Utility function for calculating contrast color
const calculateContrastColor = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const ChangeColorButton: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState(
    "linear-gradient(135deg, #0d1421 0%, #1a1a2e 20%, #16213e 40%, #201339 80%, #533483 105%, #201339 200%)"
  );

  useEffect(() => {
    const contrastColor = calculateContrastColor(primaryColor as string);

    // Set CSS variables globally
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-text-on-primary', contrastColor);
    document.documentElement.style.setProperty('--color-text-light', "#D1D5DB"); // 👈 light gray (#D1D5DB = Tailwind gray-300)
  }, [primaryColor]);

  const handlePrimaryColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryColor(e.target.value);
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg">
      <div className="flex items-center gap-4">
        <label htmlFor="primary-color" className="font-medium text-sm">
          Church Color:
        </label>
        <input
          id="primary-color"
          type="color"
          value={primaryColor}
          onChange={handlePrimaryColorChange}
          className="w-12 h-12 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChangeColorButton;
