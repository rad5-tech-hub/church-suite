import React, { useState, useEffect } from "react";

// Utility functions for color calculations

const calculateContrastColor = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};


const ChangeColorButton: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState("#111827");

  useEffect(() => {
    // Set initial colors
    const contrastColor = calculateContrastColor(primaryColor);
    
    // Set CSS variables
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-text-on-primary', contrastColor);
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
        <span className="text-gray-700">{primaryColor}</span>
      </div>
    </div>      
  );
};

export default ChangeColorButton;
